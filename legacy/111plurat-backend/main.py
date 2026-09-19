# CrateJuice Backend (FastAPI) — memory-mode fallback
import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="CrateJuice Backend", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI", "").strip()
USE_MEMORY = not bool(MONGO_URI)

# ---- Memory store (fallback) ----
_mem: List[dict] = []
MEM_FILE = os.getenv("MEM_FILE", "plays.json")

# ---- Optional Mongo store (lazy import) ----
if not USE_MEMORY:
    from pymongo import MongoClient, ASCENDING
    _client = _db = None
    def get_db():
        global _client, _db
        if _db is not None:
            return _db
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")
        _db = _client["cratejuice"]
        _db.tracks.create_index([("played_at", ASCENDING)])
        _db.tracks.create_index([("track_id", ASCENDING)])
        return _db

class TrackPlay(BaseModel):
    track_id: str
    source: Optional[str] = None
    user: Optional[str] = None
    memo: Optional[str] = None
    played_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrackOut(TrackPlay):
    id: str

@app.get("/")
def root():
    return {"message": "CrateJuice backend alive",
            "version": "0.2.0",
            "mongo_configured": bool(MONGO_URI),
            "mode": ("mongo" if not USE_MEMORY else "memory")}

@app.get("/healthz")
def healthz():
    if not USE_MEMORY:
        _ = get_db()
    return {"ok": True}

@app.post("/tracks/log", response_model=TrackOut)
def log_track(play: TrackPlay):
    doc = play.dict()
    if USE_MEMORY:
        _mem.append(doc)
        # persist lightly
        try:
            import json
            with open(MEM_FILE, "w") as f:
                json.dump(_mem[-1000:], f, default=str, indent=2)
        except Exception:
            pass
        return {"id": str(len(_mem)), **doc}
    else:
        db = get_db()
        res = db.tracks.insert_one(doc)
        return {"id": str(res.inserted_id), **doc}

@app.get("/tracks/recent", response_model=List[TrackOut])
def recent(limit: int = 25):
    limit = max(1, min(limit, 200))
    if USE_MEMORY:
        items = _mem[-limit:][::-1]
        return [{"id": str(i+1), **it} for i, it in enumerate(items)]
    else:
        db = get_db()
        items = list(db.tracks.find({}, sort=[("played_at", -1)], limit=limit))
        return [
            {"id": str(it["_id"]),
             "track_id": it.get("track_id"),
             "source": it.get("source"),
             "user": it.get("user"),
             "memo": it.get("memo"),
             "played_at": it.get("played_at")}
            for it in items
        ]
