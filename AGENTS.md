# Code2Part Project Context

Code2Part is an Expo React Native TypeScript app for industrial product code identification and equivalent product comparison.

The app is designed for:
- Technical salespeople
- Suppliers
- Purchasing staff with limited technical knowledge

The app should not focus on CAD, drawings, or PDF processing.

The first MVP uses local JSON mock data only.

Core user flow:
1. User enters a product code.
2. App normalizes the code.
3. App identifies the product.
4. App extracts technical attributes with evidence levels.
5. App finds equivalent product series.
6. App shows compatibility in Turkish.

Evidence levels:
- code
- series_table
- standard
- inferred
- unknown

Compatibility sections:
- compatible
- different
- unknownOrCheck
- warnings

Initial supported product families:
- Festo DSBC
- SMC CP96

Initial product category:
- Pneumatic cylinder

Initial standard family:
- ISO 15552

Do not add backend, Firebase, Supabase, auth, payments, file upload, PDF parsing, or CAD features unless explicitly requested.
