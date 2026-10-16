# RideShare — Java 5 · Hyrja dhe lejet

## Çfarë ndërtova

Shtova hyrjen dhe daljen me GitHub OAuth përmes NextAuth 4.24.15. GitHub
vërteton identitetin dhe ID-ja e verifikuar ruhet në sesion; roli (`udhetar`
ose `shofer`) lexohet nga tabela `profilet` në Neon. Pronësia e udhëtimit
ruhet veçmas në kolonën `udhetimet.shofer_id`. Përdoruesi nuk mund ta caktojë
vetë rolin ose pronarin nga shfletuesi.

Shoferi mund të ndryshojë orën e udhëtimit të vet. Veprimi i serverit
kontrollon sesionin, rolin, formatin e orës dhe pronësinë në databazë për
çdo ruajtje. Ndryshimi i ID-së së fshehur në formular nuk jep leje për
udhëtimin e dikujt tjetër.

Përmirësova ndërfaqen për telefona dhe shtova manifest, ikonë, service worker
dhe faqe offline. Service worker nuk ruan faqet dinamike me orare apo panelin
e llogarisë, për të mos paraqitur të dhëna të vjetruara.

## Provat që bëra

### Verifikimi teknik dhe PWA

`npm run typecheck` dhe `npm run build` kaluan. Në shfletues, manifesti u
ngarkua dhe service worker u regjistrua/aktivizua. Lista u shfaq me katër
udhëtime në gjerësi telefoni 375 px, pa lëvizje horizontale. Kur u çaktivizua
lidhja, shfletuesi shfaqi faqen offline dhe jo oraret e ruajtura.

### Prova 1: Hyrja, rifreskimi dhe dalja

Pa hyrje, `/panel` shfaqi butonin “Hyr me GitHub”. Hyrja u krye përmes GitHub;
paneli shfaqi emrin dhe rolin `udhetar`. Pas rifreskimit sesioni vazhdoi.
Pas caktimit të rolit në Neon, rifreskimi shfaqi `shofer`. Klikimi “Dil nga
llogaria” e ktheu panelin te gjendja pa hyrje me butonin e hyrjes. Hyrja e
dytë u krye me sukses dhe paneli shfaqi sërish rolin `shofer`.

### Prova 2: Shoferi ndryshon udhëtimin e vet

Pas ekzekutimit të SQL-së, profili im u caktua `shofer` dhe udhëtimi ID 2
iu caktua profilit tim. E ndryshova orën nga `08:15` në `08:25`; paneli
shfaqi mesazhin e suksesit, faqja e detajeve dhe lista treguan `08:25`, dhe
Neon e konfirmoi ndryshimin. Pastaj e riktheva orën në `08:15` dhe e
verifikova përsëri në Neon.

### Prova 3: Veprimi pa leje refuzohet

Ndryshova përkohësisht ID-në e fshehur në formular nga `2` në `1` dhe
provova ta ruaja. Paneli refuzoi veprimin me “Nuk ke leje për këtë udhëtim.
Ora nuk ndryshoi.” Neon konfirmoi se ID 1 nuk ndryshoi dhe mbeti `10:00`;
ID 2 mbeti `08:15`. **Shënim:** të dhënat ekzistuese të Neon-it kishin
`10:00` për ID 1, jo `08:00` si shembulli i ushtrimit; raportova vlerën që
u lexua realisht para dhe pas provës.

## Ku gjendet puna

- OAuth dhe sesioni: `aplikacioni/src/lib/auth.ts`,
  `aplikacioni/src/app/api/auth/[...nextauth]/route.ts`
- Kontrolli i rolit dhe pronësisë: `aplikacioni/src/lib/lejet.ts`
- Paneli dhe veprimi i serverit: `aplikacioni/src/app/panel/`
- SQL Java 5: `aplikacioni/schema-java05.sql`
- Konfigurimi lokal shembull: `aplikacioni/.env.example`
- PWA: `aplikacioni/src/app/manifest.ts`, `aplikacioni/src/app/icon.svg`,
  `aplikacioni/public/icon-192.png`, `aplikacioni/public/icon-512.png`,
  `aplikacioni/public/sw.js`
- Aplikacioni: https://github.com/demhasa/rideshare-mobile
- Demo: https://rideshare-mobile-ten.vercel.app/

OAuth-i lokal përdor callback `http://localhost:3000/api/auth/callback/github`.
Vlerat private ruhen vetëm në `aplikacioni/.env.local` dhe nuk publikohen.

## Çfarë mbetet për përmirësim

Kërkesa për vend vazhdon të jetë simulim dhe nuk ruhet. Hapi pasues mund të
jetë ruajtja e kërkesës dhe miratimi/refuzimi i saj nga shoferi. Për aktivizim
në Vercel, duhen krijuar OAuth App dhe secrets të veçanta për domenin live,
pasi callback-u lokal nuk përdoret në prodhim. Dorëzimi i detyrës bëhet në
formularin GitHub të kursit pasi ndryshimet të jenë publike.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)

AI ndihmoi në implementimin e hyrjes, kontrollit të lejeve, ndërfaqes mobile,
PWA-së dhe këtij raporti. Hyrjen, daljen, ndryshimin e lejuar dhe refuzimin
e provova vetë në shfletues me databazën Neon.
