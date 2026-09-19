# CrateJuice Backend (FastAPI) — memory-mode fallback

Works **with** MongoDB Atlas or **without** (in-memory + optional JSON file).

## Endpoints
- `GET /` — sanity
- `POST /tracks/log` — save a play
- `GET /tracks/recent` — last N plays

## Run locally
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# http://127.0.0.1:8000/docs
```

## MongoDB (optional)
Add env var `MONGO_URI` with your Atlas connection string and restart.

## Render deploy
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: add `MONGO_URI` (for Mongo) or leave blank (memory)

## Netlify proxy
```
[[redirects]]
  from = "/api/*"
  to = "https://<your-render>.onrender.com/:splat"
  status = 200
  force = true
```
