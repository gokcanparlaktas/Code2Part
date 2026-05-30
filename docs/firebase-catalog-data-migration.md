# Firebase / Firestore catalog-data migration plan

**Status:** Approved for Phase 1 implementation (narrow scope).  
**Runtime default:** Local JSON (`data/catalog-data`) — unchanged until explicitly approved.  
**Do not mutate:** `data/catalog-data` source files during import/publish.

---

## Goals

Mirror the working local pipeline:

```text
parser → resolver → canonical profile → comparison → UI metadata
```

Firestore is a **publish target** and future optional remote source. Phase 1 does **not** switch app runtime to Firebase.

---

## Critical design corrections (must follow)

### 1. Firestore document IDs — no slashes

Firestore document IDs under `.../docs/{id}` **cannot contain `/`**.

**Do not use** path strings like `rexroth/directional-controls/shared/spool-symbol-candidates` as document IDs.

**Use a single-segment encoded ID:**

```text
encodedDocumentId = relativePath without ".json", with "/" replaced by "__"
```

| Field | Example |
|-------|---------|
| `relativePath` | `rexroth/directional-controls/shared/spool-symbol-candidates.json` |
| `documentKey` | `rexroth/directional-controls/shared/spool-symbol-candidates` |
| `encodedDocumentId` | `rexroth__directional-controls__shared__spool-symbol-candidates` |

**Rules:**

- All import, read, manifest, and test code must use shared helpers:
  - `encodeCatalogDocumentId(documentKey: string): string`
  - `decodeCatalogDocumentId(encodedDocumentId: string): string` (inverse: `__` → `/`, only for tooling/debug)
- Firestore path: `catalogData/{catalogVersion}/docs/{encodedDocumentId}`
- Envelope stores both `documentKey` (human-readable) and `encodedDocumentId` (Firestore id).

**Tests required:** round-trip encode/decode, edge cases (single segment, family docs, family-index), collision safety (no ambiguous decode if keys contain `__` — document keys in repo must not contain `__`; validator rejects if they do).

---

### 2. Collection names — align with proprietary catalog-data security

**Catalog-data is proprietary.** Client/public Firestore access is fully denied for all catalog collections. Only backend services using the Admin SDK (import CLI, Cloud Functions resolver) may read or write catalog documents — Admin SDK bypasses Firestore rules.

**Use these collection names (not `catalog/` or `catalogMeta/`):**

```text
catalogData/{catalogVersion}/docs/{encodedDocumentId}
catalogDataMeta/active
catalogDataReleases/{catalogVersion}
```

**Firestore rules (target):**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /catalogData/{document=**} {
      allow read, write: if false;
    }

    match /catalogDataMeta/{document=**} {
      allow read, write: if false;
    }

    match /catalogDataReleases/{document=**} {
      allow read, write: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- **Client/mobile:** no Firestore reads or writes on catalog collections. The mobile app must call resolver HTTP endpoints (`identify`, `compare`, `equivalents`), never Firestore directly.
- **Backend:** Admin SDK import, verify CLI, and Cloud Functions use service account credentials and bypass rules.
- Add `firestore.rules` + `firebase.json` emulator config in Phase 1 tooling (not app bundle).

---

### 3. Checksum manifest — array, not map

Avoid `checksumManifest: Record<documentKey, string>` (large awkward map keys, harder to inspect).

**Preferred release manifest shape:**

```typescript
checksumManifest: Array<{
  documentKey: string;
  encodedDocumentId: string;
  relativePath: string;
  checksumSha256: string;
  runtimeUsed: boolean;
}>;
```

Stored on `catalogDataReleases/{catalogVersion}`.

---

## Firestore structure (corrected)

### Collections

```text
catalogDataMeta/
  active                              # pointer to published catalogVersion

catalogDataReleases/
  {catalogVersion}                    # release metadata + checksumManifest[]

catalogData/
  {catalogVersion}/
    docs/
      {encodedDocumentId}             # single segment, no slashes
```

### `catalogDataMeta/active`

```typescript
{
  catalogVersion: string;
  schemaVersion: string;              // e.g. "catalog-data-v1"
  publishedAt: Timestamp;
  publishedBy?: string;
}
```

### `catalogDataReleases/{catalogVersion}`

```typescript
{
  catalogVersion: string;
  schemaVersion: string;
  importedAt: Timestamp;
  sourceUpdatedAt: Timestamp;
  sourceGitRef?: string;
  importedBy?: string;
  manufacturers: ("rexroth" | "yuken")[];
  categories: ("directional-controls")[];
  families: {
    rexroth: ["we"];
    yuken: ["dsg", "dshg"];
  };
  documentCount: number;
  checksumManifest: ChecksumManifestEntry[];   // array — see §3
  status: "draft" | "validated" | "published";
  validationReportId?: string;
}
```

### `catalogData/{catalogVersion}/docs/{encodedDocumentId}`

```typescript
{
  catalogVersion: string;
  schemaVersion: string;

  // Identity
  manufacturer: "rexroth" | "yuken";
  category: "directional-controls";
  scope: "shared" | "family" | "index";
  familyId?: "we" | "dsg" | "dshg";
  documentType:
    | "family_index"
    | "spool_symbol_candidates"
    | "mounting_surface_candidates"
    | "connector_voltage_candidates"
    | "technical_data_candidates"
    | "parser_spec_candidate"
    | "mapping_candidates"
    | "catalog_source"
    | "unknown_or_review";

  documentKey: string;                 // readable path without extension
  encodedDocumentId: string;           // Firestore doc id
  relativePath: string;                // e.g. ".../spool-symbol-candidates.json"
  payload: object;                     // exact JSON file content
  payloadFormat: "json";
  checksumSha256: string;
  sourceUpdatedAt: Timestamp;
  importedAt: Timestamp;

  appliesToFamilies?: string[];
  runtimeUsed: boolean;                // true if loadCatalogData uses it today
}
```

---

## Local repo mirror (unchanged source of truth)

```text
data/catalog-data/
  rexroth/directional-controls/
    family-index.json
    shared/spool-symbol-candidates.json
    shared/mounting-surface-candidates.json
    we/{parser-spec, connector-voltage, technical-data, mapping, catalog-source, unknown-or-review}.json
  yuken/directional-controls/
    family-index.json
    shared/{spool-symbol, mounting-surface, technical-data}-candidates.json
    dsg/...
    dshg/...
```

**Runtime today** (`loadCatalogData.ts`): static local imports only — Rexroth WE, Yuken DSG (+ DSHG parser-spec prep). No Firestore reads.

---

## Import script design

**Location:** `scripts/catalog-data-firestore/` (Node/TS, not Expo bundle)

### CLI

```bash
catalog-data-import \
  --source ./data/catalog-data \
  [--dry-run] \
  [--validate-only] \
  [--emulator] \
  [--catalog-version 2026.05.29] \
  [--families rexroth:we,yuken:dsg,yuken:dshg] \
  [--publish]   # sets catalogDataMeta/active — manual/CI only
```

### Environment (never hardcode secrets)

Read from process env only:

```bash
FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
# Emulator:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

- **Never** `import` or `require()` service account JSON from app/runtime source.
- Admin SDK initialized in import script only, using path from env.

### Pipeline

1. Discover files under `data/catalog-data` → `relativePath`, `documentKey`, `encodedDocumentId`.
2. Filter MVP families (see First implementation scope).
3. Validate JSON + cross-refs (family-index paths resolve).
4. Stable JSON stringify → `checksumSha256`.
5. Build `checksumManifest[]`.
6. **Dry-run:** print report, no writes.
7. **Write:** upsert `catalogData/{version}/docs/{encodedDocumentId}` + release doc.
8. **Publish (optional):** update `catalogDataMeta/active`.

---

## Validation strategy

| Layer | Checks |
|-------|--------|
| Path encoding | `encodeDocumentId` round-trip; reject `documentKey` containing `__` |
| JSON | Parseable; required fields per `documentType` |
| family-index | `sharedResources[].path` and family folders exist |
| Runtime MVP set | All docs used by `loadCatalogData.ts` for WE/DSG/DSH present |
| Size | Each payload &lt; 900 KB (largest today ~111 KB) |
| Manifest | Array entries match written docs; counts match |
| Dry-run | `--dry-run` / `--validate-only` exit non-zero on errors |

Post-import: read-back sample docs; compare checksums to manifest entries.

---

## App loader abstraction (future — not Phase 1)

When separately approved:

```typescript
interface CatalogDataLoader {
  loadDocument<T>(ref: CatalogDocumentRef): Promise<Readonly<T>>;
}

type CatalogDataSource = 'local' | 'firestore' | 'firestore-emulator';
// Default: 'local'
```

Firestore loader would resolve:

```text
active.catalogVersion
→ catalogData/{version}/docs/{encodeCatalogDocumentId(documentKey)}
→ envelope.payload
```

**Phase 1 explicitly excludes:** `FirestoreCatalogDataLoader`, runtime feature flags, Expo Firebase client reads.

---

## Migration phases

| Phase | Scope |
|-------|--------|
| **0** | This plan + encode helper spec |
| **1** | **First implementation (narrow)** — see below |
| **2** | Full import write + emulator seed + CI validate |
| **3** | Loader interface refactor (local wrapper only) |
| **4** | Firestore loader + parity tests (dev/emulator) |
| **5** | Optional remote default (product decision) |

---

## First implementation scope (Phase 1 only)

Implement **only** the following. Do **not** switch app runtime to Firebase.

| Item | Action |
|------|--------|
| Plan doc | This file |
| `.gitignore` | Ensure ignored: `.env`, `.env.local`, `secrets/`, `firebase-service-account.json`, `*.service-account.json` |
| `.env.example` | Document `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_PATH`, optional `FIRESTORE_EMULATOR_HOST` |
| `encodeCatalogDocumentId` | Shared helper + unit tests |
| Import script | **Dry-run + validate-only** modes; no required live write in first PR |
| Validation | JSON + path + MVP runtime doc set |
| Firebase emulator | `firebase.json` emulators block; document seed flow |
| Firestore rules | `firestore.rules` as specified above |
| **Excluded** | Remote runtime loader, app config switch, mutating `data/catalog-data` |

Suggested paths:

```text
scripts/catalog-data-firestore/
  encodeCatalogDocumentId.ts
  encodeCatalogDocumentId.test.ts
  validateCatalogDataTree.ts
  import.ts                    # dry-run / validate-only first
  types.ts
.env.example
firestore.rules
firebase.json                  # emulators only initially
docs/firebase-catalog-data-migration.md
```

---

## Commit / secrets safety

**Must remain gitignored (verify before any commit):**

```gitignore
.env
.env.local
secrets/
firebase-service-account.json
*.service-account.json
```

- No service account JSON in repo, chat, or source imports.
- Import script reads credentials path from `FIREBASE_SERVICE_ACCOUNT_PATH` at runtime only.
- `.env.example` contains placeholder values only.

---

## MVP import document set

| Manufacturer | Family | Documents |
|--------------|--------|-----------|
| rexroth | we + shared | family-index, shared spool/mounting, we connector-voltage, technical-data, parser-spec, mapping, catalog-source, unknown-or-review |
| yuken | dsg, dshg + shared | family-index, shared spool/mounting/technical-data, per-family runtime + prep docs |

Mark `runtimeUsed: true/false` per manifest entry. Defer parked families (`dhg-dm-dr-dc`, `check-pilot-check-prefill`).

---

## Risks and costs (summary)

| Risk | Mitigation |
|------|------------|
| Invalid Firestore doc IDs | `encodedDocumentId` helper + tests |
| Rules/collection mismatch | Use `catalogData`, `catalogDataMeta`, `catalogDataReleases` |
| Schema drift | `checksumManifest[]`, `schemaVersion`, CI dry-run |
| Accidental secret commit | `.gitignore` + `.env.example`; no JSON in code |
| Premature runtime switch | Phase 1 = tooling only; local default preserved |
| Read cost (later) | Cache + bundled local fallback when remote is enabled |

Storage ~500 KB total; writes on import only; reads matter only after Phase 4+.

---

## Requirements traceability

| Requirement | Plan element |
|-------------|--------------|
| Mirror catalog-data structure | `documentKey` + `relativePath` + `payload` |
| rexroth, yuken / directional-controls | Import filter + manifest |
| WE, DSG, DSHG | MVP families |
| Shared docs | `scope: shared` |
| Family docs | `scope: family`, `familyId` |
| Versioning | `catalogVersion`, `schemaVersion`, `sourceUpdatedAt`, `importedAt` |
| Dry-run validation | `--dry-run`, `--validate-only` |
| Emulator | `--emulator`, `FIRESTORE_EMULATOR_HOST` |
| Local default | No app runtime Firebase in Phase 1 |
| Safe doc IDs | `encodeCatalogDocumentId` |
| Rules alignment | `catalogData`, `catalogDataMeta`, `catalogDataReleases` |
| Manifest inspectability | `checksumManifest[]` |

---

## Next step

Implement Phase 1 narrow scope: encode helper + tests, `.env.example`, import dry-run/validate, emulator config, rules file — **without** app runtime changes or `data/catalog-data` mutations.
