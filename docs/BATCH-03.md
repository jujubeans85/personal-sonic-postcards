# Batch 03 — legacy postcard and library consolidation

19 September 2026. This is a bounded source migration, not completion of all stage-6 actions.

## Canonical destinations

- `collections/`: maintained recipient gallery, explicit `?t=vintage-1` through `?t=vintage-8`, copy link, print, original audio controls and local image preview. Unknown slugs display an error rather than silently selecting a different gift. No autoplay, API call, tracking or storage is added.
- `collections/vintage/`: byte-preserved eight fronts, eight backs, eight WAV samples and historical HTML from cratejuice-v1. The historical HTML is retained for provenance; use the maintained gallery as the entry point.
- `collections/print/`: 18 original A6 JPG files previously buried in `juju_whole_lot_v1to4.zip`.
- `shared/postcard-catalog.mjs`: deterministic catalogue and slug/share functions adapted from 111PLURAT. Generated share links retain the hosting prefix, existing query parameters and hash.
- `shared/image-preview.mjs`: reimplementation of the useful cratejuice-snaps preview idea, consumed by the gallery. One owned object URL, release on replacement/error/clear/page exit, 12 MiB input cap, 24 MP decoded cap. A browser must decode before its dimensions are known, so transient decoder allocation is not bounded by the pixel check. Images are never uploaded or persisted.
- `tools/index-library.py`: corrected extraction of cratejuice's `cratejuice/apps/indexer/index_crates_light.py`. Explicit input/output directories, nested media, stable path-derived IDs, URL escaping, and refusal to overwrite existing catalogues. Indexing is filename-based; `media_validation: not_decoded` prevents it being treated as audio verification.
- `legacy/111plurat-backend/`: main.py, requirements and README preserved byte-for-byte from the shared backend ZIP. Reference only; no active demo imports it. Its old README is historical, not current deployment advice. No environment files, Mongo connection test or deployment binding are activated.
- `legacy/111plurat-tracks.json`: original seeded data; external sample URLs and `anchor-beat-sonic-love-letter`, `mimis-drift`, `cbos-glow` remain reference data. These are not silently redirected to unrelated vintage cards.

`stage-6-preservation.json` records 253 tracked source files, every member of their 16 ZIP files, source commits, SHA-256 hashes and 47 exact copied files. Originals remain in their repositories and rollback branches; source history is not rewritten. An inventory is not proof that every historical feature has been migrated.

## Library indexing

From a local checkout, with Python 3.9 or newer:

```sh
python3 tools/index-library.py --media /absolute/path/to/media --output /absolute/path/to/new-catalogue
```

The output's parent must exist and the output directory must be new. It creates library.json and 8/16/all playlists. File URLs are relative to the catalogue directory; serve catalogue and media under a common HTTP root if consumed in a browser. It installs nothing and does not modify media. This command was tested in the remote Linux workspace, not on the user's Mac. No Mac runtime is configured by this batch.

## Open gates

- Existing legacy entry points, local-storage key `cratejuice_crate`, source ZIP downloads and custom domains remain unchanged. There are no retirement redirects in this batch.
- 111PLURAT's user-created localStorage tracks need an explicit export/import migration; recipient seed links cannot substitute for user data.
- The retained backend has unauthenticated writes, permissive CORS, unbounded in-memory accumulation, inconsistent memory IDs and no reload of its persisted file. No backend is needed by the new static gallery. Any retained logging service requires a selected host, access policy, persistence repair and API tests before cutover.
- cratejuice's multiple download/playback/API/QR/packaging variants are inventoried but not all proven or migrated. The old packager can remove output directories and is not promoted.
- cratejuice-v1 has two conflicting Netlify deploy workflows (root vs extracted postcard directory), plus a workflow generator. They were not triggered or reconfigured by changing that repository. Active external hosting and incoming QR/slug URLs still need verification.
- Other ZIP-only HTML and SoundCloud variants remain in the source and inventory; only print image assets were extracted from the whole-lot bundle.
- GitHub Pages deployment is reported separately in the portfolio batch report. Browser visual verification, physical iOS, physical printing and Mac audio/hardware are separate evidence categories.
- No repository is archived or deleted. Admin operations remain unavailable here; retirement is also blocked by the explicit compatibility gates above.

## Verification

`node --test tests/batch-02.test.cjs tests/batch-03.test.mjs` and `python3 tests/test_library_index.py` pass: 11 checks total. All 47 copied files match their source hashes. WAV headers parse. Browser and deployment evidence, if available, is recorded in the portfolio report.

## Rollback

The portfolio report records the exact source and rollback commits. Revert the batch commit normally, preserving subsequent work. Do not reset or force-push main. Existing Cinema/NFC/visualizer/profile entry points and their modules are unchanged; the root gains only a collection link.
