# Code2Part — Project Guide, Current Architecture and Roadmap

Bu doküman Code2Part projesinin tek kaynak rehberidir. Cursor, Claude veya başka bir agent ile çalışırken önce bu dosya okunmalıdır.

Amaç; projenin ne olduğunu, şu ana kadar ne yapıldığını, hangi mimari kurallarla ilerlediğini, mevcut checkpoint’i, bilinçli ertelenen işleri ve gelecek yol haritasını tek yerde toplamaktır.

---

## 0. Kısa Özet

**Code2Part**, endüstriyel ürün kodlarını üretici bağımsız ortak teknik dile çeviren ve muadil ürünleri bu ortak dil üzerinden karşılaştıran bir mobil uygulamadır.

Ana fikir:

```text
Üretici kodu
→ ürün/kategori/seri tanıma
→ üreticiye özel parser
→ canonical teknik sözlük
→ compatibility profile
→ kategori solver / comparison
→ kullanıcıya Türkçe teknik sonuç
```

En kritik ilke:

```text
Ham kod ana bilgi değildir.
Ham kod sadece iç kanıt/veridir.
Ana bilgi ortak teknik anlamdır.
Karşılaştırma ortak teknik anlamla yapılır.
```

Örnek:

```text
G24 / D24 / EG24 / H → DC_24V → 24V DC
PPVA / PPV → ADJUSTABLE_PNEUMATIC_CUSHIONING → Ayarlanabilir pnömatik sönümleme
K4 / U / U1 / U6 → DIN_VALVE_CONNECTOR → DIN valf soketi ailesi
```

---

## 1. Proje Nedir?

Code2Part, kullanıcının girdiği endüstriyel ürün kodunu anlayıp şu sorulara cevap verir:

1. Bu kod hangi ürüne ait?
2. Ürün kategorisi nedir?
3. Hangi üretici ve seri?
4. Kod parçaları teknik olarak ne anlama geliyor?
5. Teknik özellikleri nedir?
6. Muadil ürünler var mı?
7. Muadiller hangi alanlarda uyumlu, farklı veya kontrol gerekli?
8. Sipariş öncesi kullanıcı nelere dikkat etmeli?

İlk MVP odağı:

```text
pnömatik silindir
hidrolik yön kontrol valfi
```

Uzun vadeli hedef:

```text
rulman
sensör
regülatör
filtre-regülatör
pnömatik valf
vakum ejektörü
lineer kızak
motor / redüktör
servo sürücü
kaplin
endüstriyel switch
```

---

## 2. Hedef Kullanıcılar

Uygulama özellikle şu kullanıcılar içindir:

- Teknik satış ekipleri
- Tedarikçiler
- Satın alma ekipleri
- Bakım ekipleri
- Ürün kodunu bilen ama teknik detayını bilmeyen kullanıcılar
- Muadil araştırması yapan kullanıcılar

UI dili sade Türkçe olmalıdır.

Yanlış UI:

```text
Bobin voltajı: G24
Sönümleme: PPVA
Konnektör: K4
Sürgü: 3C2
```

Doğru UI:

```text
Bobin voltajı: 24V DC
Sönümleme tipi: Ayarlanabilir pnömatik sönümleme
Konnektör tipi: DIN valf soketi / EN 175301-803
Sürgü davranışı: Katalog sembolünden doğrulanmalı
```

---

## 3. Mevcut Teknoloji

Şu an kullanılan stack:

```text
Expo
React Native
Expo Router
TypeScript
Jest
Local JSON / TS mapping data
Development build + Metro
```

Şu an bilinçli olarak yapılmayanlar:

```text
Firebase / Firestore yok
Backend yok
Auth yok
Payment yok
Barcode / kamera tarama yok
PDF import pipeline production değil
Tam katalog coverage yok
```

Mevcut fazda uygulama local/offline catalog data ile çalışır. Mimari ileride database’e taşınabilecek şekilde tasarlanmalıdır.

---

## 4. Temel Ürün Akışı

Kullanıcı kod girince hedef akış:

```text
1. Kullanıcı ürün kodu girer
2. Kod normalize edilir
3. identifyProduct kategori/üretici/seri bulur
4. Üretici/kategori parser’ı raw structured field üretir
5. resolveCanonicalAttribute raw token’ı ortak teknik anlama çevirir
6. Category compatibility profile oluşturulur
7. Ürün detayları displayValue ile gösterilir
8. findEquivalentCandidates aday havuzunu oluşturur
9. Her aday canonical profile ile karşılaştırılır
10. Sonuçlar score’a göre sıralanır
11. Ana ekranda shortlist gösterilir
12. Kullanıcı isterse Tüm Alternatifler ekranına gider
13. Dikkat edilmesi gerekenler importance’a göre accordionlarda gösterilir
```

---

## 5. Ana Mimari İlke: Ortak Teknik Dil

Uygulama ham üretici kodlarını doğrudan karşılaştırmaz.

Yanlış:

```text
G24 != D24
PPVA != PPV
K4 != U
H7 bilinmiyor
```

Doğru:

```text
G24 → DC_24V → 24V DC
D24 → DC_24V → 24V DC
PPVA → ADJUSTABLE_PNEUMATIC_CUSHIONING
PPV → ADJUSTABLE_PNEUMATIC_CUSHIONING
K4 → DIN_VALVE_CONNECTOR
U → DIN_VALVE_CONNECTOR
H7 → H + 7
H → DC_24V
7 → TANK_PRESSURE_207_BAR
```

Karşılaştırma ham token ile değil, `canonicalKey` / `canonicalValue` ile yapılır.

---

## 6. Canonical Translation Pipeline

Ana pipeline:

```text
raw product code
→ identify product/category/series
→ manufacturer/category parser
→ structured raw fields
→ context-aware canonical resolver
→ canonical compatibility profile
→ category comparison / solver
→ score + warnings + UI explanation
```

### Örnek: Vickers DG4V

Kod:

```text
DG4V-3-2A-M-U-H7-60
```

Parser raw olarak şunları üretir:

```text
series: DG4V-3
function_code: 2A
spool_symbol: 2
spring_arrangement: A
electrical_option: M
connector_type: U
coil_rating: H
tank_pressure_rating: 7
design_series: 60
```

Resolver ortak teknik dile çevirir:

```text
DG4V-3 → ISO 4401-03 / CETOP 03 / NG6
A → Yay ofsetli, uçtan uca
U → DIN valf soketi / ISO 4400
H → 24V DC
7 → 207 bar
60 → Basic design
```

UI ana değer olarak bunları gösterir. Ham tokenlar ana UI’da gösterilmez.

---

## 7. Parser Sorumluluğu

Parser sadece raw structured field üretir.

Doğru parser çıktısı:

```ts
{
  attributeKey: "coil_rating",
  rawToken: "H",
  evidence: "code",
  confidence: "medium",
  requiresCatalogCheck: true
}
```

Parser asla şunları üretmez:

```text
canonicalKey
canonicalValue
displayValue
Türkçe teknik anlam
UI metni
```

Yanlış:

```ts
{
  attributeKey: "coil_rating",
  rawToken: "H",
  displayValue: "24V DC"
}
```

`24V DC` bilgisi sadece resolver/mapping tarafından üretilir.

---

## 8. Canonical Resolver Sorumluluğu

`resolveCanonicalAttribute`, parser’dan gelen raw field’ı bağlamına göre canonical teknik değere çevirir.

Input:

```ts
{
  category: "hydraulic_valve",
  manufacturer: "Vickers",
  series: "DG4V-3",
  attributeKey: "coil_rating",
  rawToken: "H"
}
```

Output:

```ts
{
  canonicalKey: "DC_24V",
  canonicalValue: "DC_24V",
  displayValue: "24V DC",
  evidence: "catalog_table",
  confidence: "medium",
  requiresCatalogCheck: true
}
```

### Context zorunludur

Aynı raw token farklı bağlamlarda farklı anlamlara gelebilir.

```text
Vickers H + coil_rating → 24V DC
Vickers H + manual_override → farklı anlam olabilir
```

Resolver context:

```text
category
manufacturer
series
seriesFamily
attributeKey
rawToken
```

Mevcut resolver `seriesFamily` desteği içerir:

```text
DG4V-3 / DG4V-5 → seriesFamily: DG4V
```

---

## 9. Canonical Key Standardı

`canonicalKey` makine-okunabilir, sabit ve karşılaştırılabilir anahtardır.

Doğru:

```ts
{
  canonicalKey: "DC_24V",
  canonicalValue: "DC_24V",
  displayValue: "24V DC"
}
```

Yanlış:

```ts
{
  canonicalKey: "24V DC";
}
```

Örnek canonical key’ler:

```text
DC_24V
AC_230V
ISO_15552
ADJUSTABLE_PNEUMATIC_CUSHIONING
DIN_VALVE_CONNECTOR
AMP_JUNIOR_TIMER
NO_CONNECTOR_INCLUDED
SPRING_CENTERED
TANK_PRESSURE_207_BAR
ISO_4401_03_CETOP_03_NG6_NFPA_D03
```

---

## 10. Attribute Key Standardı

Tüm parser ve resolver tarafında `snake_case` kullanılır.

### Hidrolik Valf

```text
mounting_standard
ways_positions
spool_symbol
function_code
center_condition
centering
spring_arrangement
coil_rating
connector_type
manual_override
electrical_option
tank_pressure_rating
max_pressure
max_flow
seal_material
design_series
variant_code
```

Not:

```text
coil_rating = üretici kod segmenti
coil_voltage = resolver/profile sonrası mühendislik anlamı
```

### Pnömatik Silindir

```text
standard_family
bore
stroke
cushioning_type
magnetic_piston
sensor_compatibility
port_thread
mounting_interface
rod_end
seal_material
variant_code
option_code
```

---

## 11. UI Kuralları

Ana UI her zaman `displayValue` gösterir.

```text
displayValue varsa onu göster
canonical display varsa onu göster
rawToken primary value olamaz
“Kod kanıtı” ana UI’da gösterilmez
“Kod parçaları” bölümü yoktur
```

Doğru:

```text
Bobin voltajı
24V DC

Konnektör tipi
DIN valf soketi / ISO 4400
```

Yanlış:

```text
Bobin voltajı
H7

Konnektör tipi
U

Kod kanıtı: U
```

Raw token ve evidence verisi içeride kalabilir; ileride diagnostics veya evidence popup için kullanılabilir.

---

## 12. Unknown ve Catalog Check Kuralları

`Katalogdan doğrulanmalı` canonical değer değildir.

Doğru:

```ts
{
  canonicalKey: "unknown",
  canonicalValue: null,
  displayValue: "Katalogdan doğrulanmalı",
  requiresCatalogCheck: true
}
```

Kural:

```text
unknown vs unknown asla compatible değildir.
```

### Aynı canonical + catalog check

Eğer iki alan aynı canonical değere çözülüyorsa ama bir tarafta `requiresCatalogCheck: true` ise:

```text
compatible olarak kalabilir
ama warning/check item eklenir
```

Örnek:

```text
Vickers H → DC_24V
Rexroth EG24 → DC_24V

Sonuç:
Bobin voltajı compatible
Warning:
Bobin voltajı kodu katalogdan doğrulanmalıdır.
```

Bu kural “bildiğini saklama, eminlik seviyesini ayrıca göster” prensibini uygular.

---

## 13. Compatibility Profile

Her kategori kendi compatibility profile’ını üretir.

Profile attribute’ları şu bilgileri taşıyabilir:

```ts
{
  label: string;
  canonicalKey?: string;
  canonicalValue?: string | number | boolean | null;
  displayValue: string;
  rawToken?: string;
  evidence: "code" | "series_table" | "standard" | "inferred" | "unknown";
  confidence: "high" | "medium" | "low" | "unknown";
  requiresCatalogCheck?: boolean;
  importance: "critical" | "important" | "optional";
  compareMode:
    | "exact"
    | "numeric"
    | "same_or_check"
    | "presence"
    | "catalog_check"
    | "ignore";
}
```

Comparison raw token üzerinden değil, canonical değer üzerinden yapılır.

---

## 14. Scoring Kuralları

Uyum yüzdesi canonical comparison sonucuna göre hesaplanır.

```text
critical compatible → güçlü pozitif
important compatible → orta pozitif
optional compatible → küçük pozitif / neutral
critical different → güçlü negatif
unknown/check → skor düşürür
warnings → skorun 100 olmasını engeller
```

`100%` sadece şu durumda olabilir:

```text
different yok
unknown/check yok
warning yok
kritik alanlar biliniyor ve uyumlu
```

---

## 15. Connector Family Model

Connector mappingleri artık “her token ayrı dünya” şeklinde değil, endüstriyel connector ailesi + opsiyon detayı olarak modellenir.

Connector family örnekleri:

```text
DIN_VALVE_CONNECTOR
PLUG_IN_CONNECTOR
AMP_JUNIOR_TIMER
DEUTSCH_CONNECTOR
M12_CONNECTOR
NO_CONNECTOR
FLYING_LEAD
TERMINAL_BOX
UNKNOWN
```

Mevcut mapping örnekleri:

```text
Rexroth K4 → DIN_VALVE_CONNECTOR → DIN valf soketi / EN 175301-803
Rexroth C4Z → AMP_JUNIOR_TIMER
Yuken N → PLUG_IN_CONNECTOR → generic, catalog check
Yuken N1 → PLUG_IN_CONNECTOR + indicator light detail
Vickers U / U1 / U6 → DIN_VALVE_CONNECTOR
U1 → PG11 detail
U6 → indicator light detail
Vickers KUP4 → AMP_JUNIOR_TIMER
Vickers KUP5 → DEUTSCH_CONNECTOR
Vickers KUPM4L → M12_4_PIN
Atos X → NO_CONNECTOR_INCLUDED → Konnektör dahil değil / ayrı sipariş edilir
```

Comparison davranışı:

```text
U vs U6 → farklı değildir; ışıklı/ışıksız opsiyon uyarısı olabilir
U vs U1 → farklı değildir; PG11 bağlantı detayı kontrol edilebilir
K4 vs U → kritik uyumsuzluk değildir; aynı DIN valf soketi ailesi / form detayı kontrol
U vs KUP4 → farklı connector ailesi
Yuken N1 vs DIN → generic plug-in olduğu için exact compatible sayılmaz
```

---

## 16. Atos X Kuralı

Atos `X` düşük önemli design metadata değildir.

Atos DHI/DHU model kodlarında `X`:

```text
Konnektör dahil değil / ayrı sipariş edilir
```

Canonical:

```ts
{
  attributeKey: "connector_type",
  rawToken: "X",
  canonicalKey: "NO_CONNECTOR_INCLUDED",
  connectorFamilyKey: "NO_CONNECTOR",
  displayValue: "Konnektör dahil değil / ayrı sipariş edilir",
  importance: "important"
}
```

Atos `X` asla `ATOS_VARIANT_X` veya `Varyant X` olarak gösterilmemelidir.

---

## 17. Design Series Kuralı

`design_series` alanı düşük önemli metadata’dır.

Örnek mappingler:

```text
Vickers 60 → Basic design
Vickers 61 → Type 8 spool design
Rexroth 3X / 6X / 7X → Komponent serisi
Yuken 50 / 70 → Tasarım numarası
```

Kurallar:

```text
design_series optional / low importance
cross-brand critical mismatch yaratmaz
same manufacturer/series içinde düşük önemli uyarı olabilir
skoru güçlü etkilemez
raw “Tasarım serisi kodu” ana UI’da görünmez
```

---

## 18. Hidrolik Valf Ortak Teknik Alanları

Hidrolik yön kontrol valflerinde temel alanlar:

```text
mounting_standard
ways_positions
center_condition
centering
spring_arrangement
coil_rating / coil voltage
connector_type
manual_override
tank_pressure_rating
max_pressure
max_flow
seal_material
design_series
electrical_option
function_code
spool_symbol
```

Güvenli mapping yapılabilen alanlar:

```text
mounting standard
coil voltage
connector type
tank pressure rating
design series
spring arrangement
```

Daha dikkatli ilerlenmesi gereken alanlar:

```text
function_code
spool_symbol
center_condition
center behavior
```

Bu alanlar için katalog sembolü ve görsel doğrulama gerekir. Emin olunmadan mapping yapılmamalıdır.

---

## 19. Pnömatik Silindir Ortak Teknik Alanları

Pnömatik silindirlerde temel alanlar:

```text
standard_family
bore
stroke
cushioning_type
magnetic_piston
sensor_compatibility
port_thread
mounting_interface
rod_end
seal_material
variant_code
option_code
```

Mevcut güvenli mapping örnekleri:

```text
DSBC + N3 → ISO_15552
PPV / PPVA → ADJUSTABLE_PNEUMATIC_CUSHIONING
PPS → SELF_ADJUSTING_PNEUMATIC_CUSHIONING
P → ELASTIC_CUSHIONING
```

SMC, Parker, Aventics, AirTAC tarafında daha fazla catalog mapping gereklidir.

---

## 20. Desteklenen Kategoriler ve Seriler

### Pnömatik Silindir

```text
Festo DSBC
Festo ADN
Festo DSNU
SMC CP96
SMC C96
SMC CQ2
SMC C85
Parker P1D
Aventics PRA
AirTAC SI
```

### Hidrolik Valf

```text
Rexroth 4WE6
Rexroth 4WE10
Yuken DSG-01
Yuken DSG-03
Vickers DG4V-3
Vickers DG4V-5
Atos DHI
Atos DHU
Parker D1VW
Parker D3W
```

---

## 21. Candidate Discovery

Muadil adayları artık sadece manuel `equivalenceGroups` ile sınırlı değildir.

Aday havuzu kaynakları:

```text
existing equivalenceGroups
same category
profile-based coarse filters
catalog exampleCodes
```

Hidrolik valf coarse filter:

```text
same mounting_standard
same NG / CETOP bucket
NG6 vs NG10 ayrımı korunur
cross-category engellenir
```

Pnömatik silindir coarse filter:

```text
same category
same bore
same stroke
same standard_family if known
```

Aday havuzuna girmek kesin muadil olmak anlamına gelmez. Son kararı comparison/scoring verir.

---

## 22. Muadil UX

Ana muadil ekranı tüm adayları doğrudan basmaz.

```text
Aday sayısı <= 5 ise hepsi gösterilir.
Aday sayısı > 5 ise shortlist gösterilir.
Düşük uyumlu alternatifler gizlenir.
Kullanıcı isterse Tüm Alternatifler ekranına gider.
```

Route:

```text
/all-alternatives
```

Bu ekran `code` paramıyla sonuçları yeniden hesaplar.

---

## 23. Dikkat Edilmesi Gerekenler UI

Check item’lar importance’a göre accordionlarda gösterilir.

Gruplar:

```text
Kritik kontroller
Kontrol gerekli
Düşük önemli
```

Kurallar:

```text
Tüm accordionlar default kapalı gelir
Başlıkta madde sayısı görünür
Boş gruplar gizlenir
Kullanıcı açıp kapatabilir
```

---

## 24. Diagnostics ve Audit

### Canonical Coverage Diagnostics

`buildCanonicalCoverageDiagnostics()` coverage durumunu ölçer.

Son snapshot:

```json
{
  "totalCheckedCodes": 69,
  "totalParsedAttributes": 206,
  "resolvedAttributes": 77,
  "unresolvedAttributes": 129,
  "requiresCatalogCheckCount": 9,
  "coveragePercent": 37.4
}
```

Kategori kırılımı:

```text
hydraulic_valve: 72 / 190 resolved, 37.9%
pneumatic_cylinder: 5 / 16 resolved, 31.3%
```

Öne çıkan eksikler:

```text
function_code: 31
spool_symbol: 20
number_of_positions: 20
mounting_standard: 12
spring_arrangement: 12
variant_code: 11
manual_override: 8
electrical_option: 6
solenoid_type: 4
tank_pressure_rating: 3
design_series: 2
```

### Equivalent Match Audit

`buildEquivalentMatchAudit(sourceCode)` her adayın neden o skoru aldığını açıklar.

Voltage fix sonrası kural:

```text
DC_24V == DC_24V
→ compatible
requiresCatalogCheck varsa
→ warning ekle
```

---

## 25. Test Durumu

Son bilinen durum:

```text
58 test suite passed
469 tests passed
failed yok
```

Önemli test alanları:

```text
canonical resolver
parser strictness
H7 split
connector family comparison
unknown vs unknown
raw token leakage
design_series leak prevention
candidate discovery
all alternatives filtering
match audit
coil voltage regression
```

---

## 26. Katalog / OCR Destekli Mapping Workflow

PaddleOCR çıktısı katalog mapping üretmek için kullanılabilir.

Doğrudan DB’ye basılmaz.

Doğru akış:

```text
PDF katalog
→ PaddleOCR / OCR markdown output
→ mapping candidate extraction
→ confidence / needsReview
→ insan kontrolü
→ canonical mapping patch
→ test
→ diagnostics coverage artışı
→ sonra DB’ye taşınabilir veri
```

OCR özellikle şu alanlarda faydalı:

```text
coil_rating / voltage
connector_type
design_series
tank_pressure_rating
spring_arrangement
manual_override
seal_material
mounting_standard
pressure / flow
performance type
```

Dikkatli olunacak alanlar:

```text
spool_symbol
function_code
center_condition
hidrolik sembol davranışı
```

Bu alanlar çoğu zaman hidrolik sembol görseli gerektirir. OCR metni tek başına yeterli olmayabilir.

---

## 27. Gelecekte Yeni Kategori ve Solver Mimarisi

Code2Part uzun vadede birçok kategoriye genişleyecek bir industrial code intelligence platformudur.

Her kategori kendi özel çözücüsüne sahip olabilir:

```text
category resolver
manufacturer parser
canonical dictionary
compatibility profile
category-specific solver
comparison/scoring
UI explanation
```

Örnek kategori solver alanları:

### Pnömatik Silindir Solver

```text
çap
strok
standart ailesi
sönümleme tipi
manyetik piston
port/diş
montaj
sensör uyumu
mil ucu
```

### Hidrolik Valf Solver

```text
montaj standardı
yol/konum
merkez tipi
merkezleme
bobin voltajı
konnektör
basınç/debi
manuel kumanda
sürgü davranışı
```

### Sensör Solver

```text
algılama tipi
besleme voltajı
çıkış tipi
PNP/NPN
NO/NC
bağlantı tipi
gövde ölçüsü
IP sınıfı
```

### Rulman Solver

```text
iç çap
dış çap
genişlik
seri
kapak/keçe tipi
boşluk sınıfı
yük sınıfı
```

Kritik kural:

```text
Her kategori farklı parser/solver kullanabilir.
Ama hepsi ortak canonical dile sonuç vermelidir.
```

---

## 28. Category Solver Sözleşmesi

Gelecekte her kategori için şu sözleşmeye yakın yapı hedeflenir:

```ts
type CategorySolver = {
  category: ProductResolverCategory;

  identify(inputCode: string): ProductIdentification | null;

  parse(
    inputCode: string,
    identification: ProductIdentification,
  ): ParsedRawField[];

  resolveCanonicalFields(fields: ParsedRawField[]): CanonicalResolvedField[];

  buildCompatibilityProfile(
    fields: CanonicalResolvedField[],
  ): ProductCompatibilityProfile;

  compare(
    source: ProductCompatibilityProfile,
    candidate: ProductCompatibilityProfile,
  ): CompatibilityResult;

  suggest(inputCode: string): ProductSuggestion[];
};
```

Yeni kategori ekleme prensibi:

```text
1. category key tanımla
2. local catalog/mock data ekle
3. parser yaz
4. canonical mapping ekle
5. compatibility profile builder yaz
6. category solver/comparison yaz
7. diagnostics test ekle
8. UI genel componentleri kullanmaya devam et
```

---

## 29. Firebase / Database Planı

Motor kısmı stabil olduktan sonra database kurulacak.

Şu an DB eklenmeyecek; önce local canonical model oturmalı.

Gelecekte beklenen collections:

```text
productSeries
productExamples
equivalenceGroups
canonicalDictionaries
manufacturerCodeMappings
catalogEvidence
checkRules
compatibilityRules
voltageMappings
connectorMappings
functionBehaviorMappings
categorySolvers
ocrExtractionJobs
mappingReviewQueue
```

DB’ye geçiş hedefi:

```text
Uygulamayı güncellemeden yeni mapping ekleyebilmek
Katalog verisini merkezi yönetmek
Review queue ile yanlış mapping riskini azaltmak
Kullanıcıdan gelen kodları yeni mapping fırsatı olarak toplamak
```

---

## 30. Kamera / Tarama Planı

Motor + DB stabil olduktan sonra kamera ile ürün kodu tarama eklenecek.

Akış:

```text
kamera görüntüsü
→ OCR / barcode / text recognition
→ candidate code extraction
→ kullanıcı onayı
→ normalizeCode
→ existing product search flow
```

Kamera tarama canonical engine yerine geçmez. Sadece input yöntemi olur.

---

## 31. Yayına Çıkış Stratejisi

Yayın hedefi için sıralama:

```text
1. Canonical engine stabil
2. Katalog coverage belirli seviyeye çıkar
3. DB / remote mapping altyapısı kurulur
4. Admin/review workflow oluşur
5. Kamera ile kod tarama eklenir
6. Beta test
7. Store yayınları
```

---

## 32. Bilinçli Ertelenen İşler

Şu işler bilinçli olarak sonraya bırakılmıştır:

```text
Firebase/backend
barcode/kamera tarama
i18n
payment/auth
tam PDF import automation
otomatik katalog DB’ye basma
tam function_code/spool_symbol mapping
center_condition görsel sembol çözümü
admin panel
production analytics
```

Sebep:

```text
Önce motor doğru çalışmalı.
Yanlış çalışan engine üzerine DB veya kamera eklemek problemi büyütür.
```

---

## 33. Sonraki En Mantıklı Aşamalar

Öncelik sırası:

1. PROJECT_GUIDE güncellemesi
2. Yuken `22` design_series kontrolü
3. Güvenli mapping coverage artırma
4. PaddleOCR destekli catalog extraction
5. function_code / spool_symbol stratejisi
6. Score weight tuning
7. Database mimarisi
8. Kamera tarama
9. Store yayını

Güvenli mapping alanları:

```text
mounting_standard
number_of_positions
spring_arrangement
manual_override
electrical_option
tank_pressure_rating
seal_material
```

Riskli alanlar:

```text
function_code
spool_symbol
center_condition
```

Bu riskli alanlar yalnızca katalog kanıtıyla yapılmalıdır.

---

## 34. Claude / Cursor / Agent Talimatı

Her agent şu kuralları izlemelidir:

```text
PROJECT_GUIDE.md source of truth.
Mevcut mimariyi yeniden yazma.
Küçük, testli patchler yap.
Parser’a displayValue koyma.
Raw token’ı ana UI’da gösterme.
Canonical resolver’ı bypass etme.
Unknown değerleri compatible sayma.
DB/Firebase/barcode işlerine motor stabil olmadan geçme.
Yeni mappingleri evidence/confidence ile ekle.
```

Kod yazmadan önce agent şunları raporlamalı:

```text
hangi dosyaları değiştirecek
hangi testleri ekleyecek
hangi behavior değişecek
diagnostics coverage etkisi ne olabilir
```

---

## 35. Manuel Test Kodları

Her önemli değişiklikten sonra telefonda denenmeli:

```text
DG4V-3-2A-M-U-H7-60
4WE6E-7X/HG24N9K4
4WE6E-6X/EG24N9K4
DSG-01-3C2-D24-N1-70
DHI-0711-X 24DC
DHU-0711-X 24DC
DSBC-50-100-PPVA-N3
CP96-50-100
```

Kontrol:

```text
raw token primary görünmüyor
Kod kanıtı ana UI’da yok
displayValue doğru
unknown/check compatible değil
warning varsa skor 100 değil
katalog kontrolü gereken alanlar açık
Tüm alternatifler ekranı çalışıyor
accordionlar kapalı geliyor
```

---

## 36. Kısa Sonuç

Code2Part artık şu noktadadır:

```text
Canonical translation pipeline çalışıyor.
Connector family modeli çalışıyor.
Atos X no-connector olarak ele alınıyor.
Design series optional metadata.
Profile-based candidate discovery çalışıyor.
All alternatives screen var.
Match audit diagnostics var.
Voltage comparison bug düzeltildi.
Testler geçiyor.
```

Bundan sonraki ana yön:

```text
Katalog/OCR destekli mapping coverage artırmak,
her marka ve kategori için ayrı parser/solver yazmak,
ama tüm sonuçları ortak canonical teknik dile çevirmek,
motor stabil olduktan sonra DB kurmak,
sonra kamera ile taramayı ekleyip uygulamayı yayına hazırlamak.
```
