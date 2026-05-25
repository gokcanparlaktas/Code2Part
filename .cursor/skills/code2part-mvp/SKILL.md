# Code2Part MVP Skill

Use this skill only for this project.

## Purpose

Help build Code2Part, a React Native Expo TypeScript MVP for industrial product code identification and equivalent product comparison.

## Product Context

Code2Part helps technical salespeople, suppliers, and purchasing staff identify industrial products from product codes.

The app should explain:
- What the product is
- Which brand and series it belongs to
- Which technical attributes were extracted
- Which equivalent series may fit
- Which fields are compatible, different, or require checking

## Current MVP Scope

Use only:
- Expo
- React Native
- TypeScript
- Expo Router
- Local JSON mock data

Do not add:
- Firebase
- Backend
- Authentication
- Payments
- PDF parsing
- CAD
- Technical drawing features

## Initial Product Families

Support only these for now:

### Festo DSBC
- Category: pneumatic cylinder
- Standard family: ISO 15552
- Example code: DSBC-50-100-PPVA-N3

### SMC CP96
- Category: pneumatic cylinder
- Standard family: ISO 15552
- Example code: CP96-50-100

Both belong to:
pneumatic_iso_15552_cylinder

## Attribute Evidence

Every technical attribute must include one of these evidence levels:

- code: extracted directly from product code
- series_table: known from series-level data
- standard: known from standard family
- inferred: inferred but not fully verified
- unknown: not known

Never show inferred or unknown values as certain.

## Compatibility Output

Equivalent comparison must return:

- compatible
- different
- unknownOrCheck
- warnings

Use simple Turkish labels in the UI:

- Uyumlu
- Farklı
- Kontrol Gerekli
- Bilinmiyor
- Uyarılar

## Development Rules

- Keep business logic outside UI components.
- Use TypeScript types.
- Prefer small pure functions.
- Keep resolver functions testable.
- Keep mock data editable and readable.
