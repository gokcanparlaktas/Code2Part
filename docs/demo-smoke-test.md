# Code2Part — Demo smoke test checklist

Manual checks on a real Android device before sharing a demo APK. Use **local Wi‑Fi / USB** dev build or a **preview APK** build.

## Before you start

- [ ] `npm test` passes on the build machine
- [ ] App opens to home screen (Code2Part search card visible)
- [ ] No red error overlay on launch

---

## 1. Exact hydraulic identification

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Enter `4WE6G-6X/EG24N9K4` → **Tanımla ve karşılaştır** | Full result: Rexroth **4WE6**, high confidence |
| 1.2 | Open **Teknik özellikler** accordion | Voltage **24V DC** (EG24), function token visible |
| 1.3 | Open **Tespit Detayları** | Evidence rows + demo disclaimer at bottom |
| 1.4 | Enter `DG4V-3-2A-M-U-D24-60` | Vickers **DG4V-3**, full identification |
| 1.5 | Enter `DG4V-3-2A-M-U-H7-60` | Full identification; voltage **not** shown as confirmed 24V DC (H7 → check/unknown) |

---

## 2. Partial hydraulic search

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Type `4WE6` (do not submit full example) | Suggestions may appear; **not** full high-confidence product card |
| 2.2 | Submit `4WE6` | Not found / partial — not same as exact example |
| 2.3 | Type `DG4V 3` | Partial suggestions; no 100% “exact” match feel |

---

## 3. Exact pneumatic identification

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | `DSBC-63-200-PPVA` | Festo **DSBC**, bore **63**, stroke **200** |
| 3.2 | `C96-40-80` | SMC **C96**, bore **40**, stroke **80** |
| 3.3 | `SI-63-150` | AirTAC **SI**, bore **63**, stroke **150** |
| 3.4 | Tap a **Hızlı örnek** chip | Code fills; search works |

---

## 4. Partial pneumatic search

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Type `50-100` without series prefix | Series-less suggestions; confidence not “high” |
| 4.2 | Type `50 N3` | May suggest DSBC-style codes; suggestions cautious |
| 4.3 | Submit unknown code `ZZZZ-99-99` | Clear “ürün bulunamadı” + tips (full code, brand, spaces) |

---

## 5. Equivalent comparison

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | From `DSBC-63-200-PPVA` result → **Muadilleri Gör** | List of candidates (e.g. SMC CP96) |
| 5.2 | Expand one muadil card | Match %, **Uyumlu** / **Farklı** / **Kontrol** sections |
| 5.3 | Read subtitle | States comparison is not final technical approval |
| 5.4 | Demo disclaimer visible at bottom | Two short Turkish lines |

---

## 6. Technical attributes & evidence

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Hydraulic full ID → technical attributes | CETOP/NG, function, voltage rows as applicable |
| 6.2 | Pneumatic full ID → technical attributes | Bore, stroke; cushioning/options if in code |
| 6.3 | Evidence accordion | Turkish evidence labels; disclaimer when expanded |

---

## 7. Unknown / check warnings

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | H7 hydraulic code | Voltage requires catalog check |
| 7.2 | Muadil with different function tokens (e.g. Rexroth E vs Atos path) | **Kontrol** items, not “kesin uyumlu” |
| 7.3 | Low-confidence identification | Warning card if applicable |

---

## 8. Search history

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Run 3 different successful searches | **Son Aramalar** lists them |
| 8.2 | Repeat same code twice | Only **one** row for that normalized code (no duplicates) |
| 8.3 | Tap a history row | Reopens result screen |

---

## 9. Diagnostics / catalog validation

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | **Son Aramalar** → **Veri Kontrolü** | Screen opens |
| 9.2 | **Çalışma kataloğu (v2)** | Status **Geçerli** |
| 9.3 | Record counts | ~20 series, check rules, function mappings shown |
| 9.4 | Demo disclaimer at top | Visible |

---

## 10. Demo disclaimer (global)

Confirm short disclaimer appears (no large modal):

- [ ] Home screen (bottom of search card or info area)
- [ ] Result screen (footer)
- [ ] Muadiller screen (footer)
- [ ] Veri Kontrolü screen

Text:

1. *Demo verileri katalog kontrolü gerektirebilir.*
2. *Uyumluluk sonuçları kesin teknik onay yerine geçmez.*

---

## Quick regression codes (copy-paste)

```
4WE6G-6X/EG24N9K4
DG4V-3-2A-M-U-D24-60
DSG-01-3C2-D24-N1-50
DSBC-63-200-PPVA
C96-40-80
SI-63-150
```

---

## Sign-off

| Tester | Date | Build | Pass / Fail | Notes |
|--------|------|-------|-------------|-------|
| | | | | |
