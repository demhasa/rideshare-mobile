# RideShare — Java 6 · PWA dhe leximi offline

## Çfarë ndërtova

Shtova një lexues publik offline për listën e udhëtimeve. API-ja
`/api/udhetimet` kthen vetëm gjashtë fushat publike të udhëtimit dhe nuk
ekspozon profile, email, sesione ose sekrete. Service worker-i ruan vetëm
faqen `offline.html`, ikonat dhe përgjigjen e kësaj API-je në cache-n
`rideshare-public-v1`.

Faqja offline tregon kartat, burimin e të dhënave dhe kohën e ruajtjes.
Butoni i kërkesës për vend është i çaktivizuar: kjo është vetëm pamje leximi
dhe nuk konfirmon rezervime. Kur rikthehet lidhja, butoni “Rifresko listën”
lexon përsëri serverin dhe ruan versionin e ri.

## Provat

### Prova 1 — Manifesti dhe vizita online

Hapa `/manifest.webmanifest`, `/icon-192.png` dhe `/icon-512.png`; manifesti
ka emrin RideShare dhe ikonat përkatëse. Me internet hapa faqen kryesore dhe
`/offline.html`; lista u lexua nga API-ja dhe service worker-i u regjistrua.
Kjo provë u verifikua edhe me `npm run typecheck` dhe `npm run build`.

### Prova 2 — Pa internet edhe pas rifreskimit

Pasi lista u hap online, service worker-i ruajti snapshot-in. Në modalitetin
offline, `/offline.html` përdor përgjigjen e cache-it dhe shfaq kartat,
burimin “Lista e fundit e ruajtur” dhe kohën e ruajtjes. Pamja nuk shfaq
formular hyrjeje dhe butoni i rezervimit mbetet i çaktivizuar.

### Prova 3 — Rikthimi i lidhjes dhe të dhënat e reja

Me RideShare offline ndryshova përkohësisht orën e udhëtimit me ID 2 në Neon
nga `08:15` në `08:25`, pastaj riktheva lidhjen dhe përdora “Rifresko listën”.
API-ja ktheu versionin e ri me burim serveri dhe kohën e re të snapshot-it.
Në fund e riktheva orën në `08:15`. Nuk u ndryshuan rezervime apo të dhëna
private.

## Ku gjendet puna

- API publike: `aplikacioni/src/app/api/udhetimet/route.ts`
- Service worker: `aplikacioni/public/sw.js`
- Lexuesi offline: `aplikacioni/public/offline.html`
- Regjistrimi dhe ngrohja e snapshot-it:
  `aplikacioni/src/components/Pwa.tsx`
- Lidhja me layout-in: `aplikacioni/src/app/layout.tsx`
- Manifesti dhe ikonat ekzistuese: `aplikacioni/src/app/manifest.ts`,
  `aplikacioni/public/icon-192.png`, `aplikacioni/public/icon-512.png`

## Ndihma nga AI

AI ndihmoi në implementimin e API-së, service worker-it, lexuesit offline dhe
raportit. Kontrolli teknik u bë me TypeScript dhe build-in e Next.js; të
dhënat e databazës u përdorën vetëm për provat e përshkruara më sipër.
