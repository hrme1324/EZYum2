# Ingestion Guide

This document explains how to ingest commercial-safe recipes into Supabase and expose them in the app.

## License Guardrails

- Only ingest datasets that explicitly permit commercial reuse: Public Domain, CC0, or CC-BY.
- If license is missing/unclear/NC: skip.
- YouTube: store only `video_url` and embed via iframe; do not download.
- Images: only if explicitly allowed; otherwise keep `image_url` empty.

## Data Shape (NDJSON)

Each line is a JSON object with:

```
{
  "title": "...",
  "ingredients": ["..."],
  "instructions": ["..."],
  "cook_time_min": 30,
  "difficulty": "easy|medium|hard",
  "image_url": null,
  "source_url": null,
  "video_url": null,
  "license": "Public Domain|CC0|CC-BY 4.0"
}
```

## CLI

- USDA ingest:

```
npm run tools:ingest:usda path/to/usda.json
# writes tools/out/usda.ndjson
```

## Server Ingest API

- Endpoint: `POST /api/recipes/ingest`
- Content-Type: `application/x-ndjson`
- Body: NDJSON lines as above
- License allowlist: `Public Domain`, `CC0`, `CC-BY 3.0/4.0`
- Uses Supabase Service Role on server side. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`.

Example:

```
curl -X POST \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @tools/out/usda.ndjson \
  http://localhost:3001/api/recipes/ingest
```

## Difficulty Heuristic

- easy: time ≤ 25, steps ≤ 6, ingredients ≤ 8
- medium: 25 < time ≤ 60 or steps ≤ 12
- hard: otherwise

## Notes

- Global seed recipes are stored with `user_id = null` and `source_type = 'usda'`.
- Frontend will expose difficulty filters and license captions.
