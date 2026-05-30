# Backend Resolver HTTP (Cloud Functions)

Protected HTTPS endpoints that expose resolver DTOs only. Raw `catalogData` never leaves the backend.

## Endpoints

Each export is a separate Cloud Function (Firebase Functions v2):

| Function | Method | Body |
|----------|--------|------|
| `identify` | POST | `{ "code": "4WE6E-6X/EG24N9K4" }` |
| `compare` | POST | `{ "sourceCode": "...", "candidateCode": "..." }` |
| `equivalents` | POST | `{ "code": "4WE6E-6X/EG24N9K4" }` |

Production base URL pattern:

```text
https://europe-west3-<project-id>.cloudfunctions.net/<functionName>
```

## Build (do not deploy without approval)

```bash
cd functions
npm install
npm run build
```

Bundle output: `functions/lib/index.js` (includes shared backend/domain code).

## Local emulator

From repo root, with `.env` credentials for Firestore (Admin SDK reads catalog server-side):

```bash
cd functions && npm install && npm run build && cd ..
firebase emulators:start --only functions,firestore
```

Default emulator URLs:

```text
http://127.0.0.1:5001/<project-id>/europe-west3/identify
http://127.0.0.1:5001/<project-id>/europe-west3/compare
http://127.0.0.1:5001/<project-id>/europe-west3/equivalents
```

Replace `<project-id>` with `FIREBASE_PROJECT_ID` (e.g. `code2part-de0d0`).

### Example curl (emulator)

```bash
curl -s -X POST "http://127.0.0.1:5001/code2part-de0d0/europe-west3/identify" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"4WE6E-6X/EG24N9K4\"}"

curl -s -X POST "http://127.0.0.1:5001/code2part-de0d0/europe-west3/compare" \
  -H "Content-Type: application/json" \
  -d "{\"sourceCode\":\"4WE6E-6X/EG24N9K4\",\"candidateCode\":\"DSG-01-3C2-D24-N1-70\"}"

curl -s -X POST "http://127.0.0.1:5001/code2part-de0d0/europe-west3/equivalents" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"4WE6E-6X/EG24N9K4\"}"
```

## Security notes (Phase 3)

- **Catalog-data is proprietary.** Firestore rules deny all client/public read and write on `catalogData`, `catalogDataMeta`, and `catalogDataReleases`.
- Only backend Admin SDK / Cloud Functions may access catalog documents (rules bypass).
- The mobile app must call resolver HTTP endpoints — never Firestore directly.
- Responses pass `assertNoForbiddenBackendResponseKeys` before send (no raw catalog payloads).
- **Future:** Firebase App Check, Auth, rate limiting (see `RESOLVER_HTTP_SECURITY_NOTES` in code).

## Deploy

**Not enabled in Phase 3.** Deploy rules and functions only after explicit approval:

```bash
firebase deploy --only firestore:rules,functions
```
