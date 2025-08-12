# Ingestion Sample

Try end-to-end ingest locally:

1. Generate NDJSON from sample

```
npm run tools:ingest:usda tools/sample-usda.json
```

2. Post to backend

```
curl -X POST \
  -H 'Content-Type: application/x-ndjson' \
  -H 'x-admin-secret: change_me_strong_secret' \
  --data-binary @tools/out/usda.ndjson \
  http://localhost:3001/api/recipes/ingest
```

Check Supabase `public.recipes` for inserted rows.
