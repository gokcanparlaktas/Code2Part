# Code2Part — Android APK build notes (demo)

Local-catalog demo build. **No Firebase**, no backend, no auth.

## Prerequisites

- Node.js LTS, npm
- Android SDK (for local builds) or [EAS CLI](https://docs.expo.dev/build/setup/) (cloud builds)
- Expo account (only if using EAS)

## Verify before building

```bash
npm test
npx expo doctor
```

Fix any `expo doctor` warnings that block Android builds (SDK versions, dependency mismatches).

Regenerate catalog v2 after data changes:

```bash
node scripts/build-catalog-v2.mjs
```

## App metadata (current)

| Field | Value |
|-------|--------|
| App name | Code2Part |
| Slug | Code2Part |
| Version | 1.0.0 |
| Icon | `./assets/images/icon.png` |
| Android adaptive icon | foreground + monochrome under `assets/images/` |
| Splash | `expo-splash-screen` plugin, `android-icon-background.png` |
| Android package | `com.anonymous.Code2Part` |

**Before store or client handoff:** change `android.package` in `app.json` from `com.anonymous.*` to your org id (e.g. `com.yourcompany.code2part`). Anonymous package is fine for internal demo APKs.

## EAS Build (recommended for demo APK)

This project does **not** ship `eas.json` yet. One-time setup:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Add a **preview** profile in `eas.json` (Android APK, internal distribution), then:

```bash
eas build -p android --profile preview
```

Download the `.apk` from the Expo build page and install on device (enable “Install unknown apps” if needed).

## Local Android build (optional)

```bash
npm run prebuild:android
npm run android
```

Or open the generated `android/` project in Android Studio and build **assembleRelease** with a debug keystore for internal testing.

Local release APK path (typical):  
`android/app/build/outputs/apk/release/app-release.apk`

## Dev client on device (fastest iteration)

```bash
npx expo start
```

Scan QR with Expo Go, or use a development build if native modules require it. AsyncStorage and catalog JSON work in Expo Go for this MVP.

## Known limitations (demo)

| Topic | Note |
|-------|------|
| Data | **Local JSON catalog only** (v2 under `src/data/catalog/`) |
| Backend | **No Firebase** / Supabase / API yet |
| Verification | Most series `manual_unverified` — demo expansion v1 |
| Compatibility | Scores and “uyumlu” fields are **candidates**; kontrol/check items must be reviewed |
| H7 / inferred voltage | Never treated as confirmed 24V DC |
| Cross-brand functions | Cautious `unknownOrCheck`, not full equivalence |
| History | Stored on device only (`AsyncStorage`) |
| Diagnostics | **Veri Kontrolü** shows v2 runtime catalog + legacy v1 JSON check |

## Post-build smoke test

Use [demo-smoke-test.md](./demo-smoke-test.md) on the installed APK.

## Troubleshooting

| Issue | Suggestion |
|-------|------------|
| Metro cache / stale bundle | `npx expo start -c` |
| Tests fail after catalog edit | `node scripts/build-catalog-v2.mjs` then `npm test` |
| `expo doctor` dependency errors | Align versions with `npx expo install --fix` |
| Build fails on splash/icon | Confirm paths in `app.json` match files under `assets/images/` |

## What is **not** blocking a demo APK today

- Missing Firebase (intentional)
- No `eas.json` (only blocks **EAS** until configured)
- `com.anonymous.Code2Part` package name (OK for internal demo)

## What **may** block production APK later

- Signing keystore / Play Console setup
- Unique application id (package name)
- Privacy policy if collecting analytics (not applicable now)
- ProGuard / release tuning (not required for first demo)
