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

`npm run typecheck` dhe `npm run build` kaluan. Në shfletuesin lokal provoi
faqen offline në gjerësi 390 px: nuk pati lëvizje horizontale, manifesti u
ngarkua dhe service worker u regjistrua. Kur çaktivizova lidhjen dhe hapa
panelin, shfletuesi shfaqi faqen offline. Këto prova nuk zëvendësojnë testet
reale të OAuth-it dhe databazës më poshtë.

### Prova 1: Hyrja, rifreskimi dhe dalja

Rrjedha e hyrjes/daljes dhe paneli janë implementuar, por prova reale me
GitHub nuk u krye në këtë mjedis: mungojnë OAuth App Client ID/Secret dhe
`NEXTAUTH_SECRET`. Përfundimi duhet verifikuar lokalisht pasi të krijohet
OAuth App dhe të plotësohet `aplikacioni/.env.local`: pa hyrje paneli ofron
butonin “Hyr me GitHub”; pas hyrjes dhe rifreskimit duhet të shfaqë emrin,
ID-në dhe rolin; pas daljes duhet të ofrojë përsëri hyrjen. Nuk po e shënoj
provën si të kaluar pa këto kredenciale dhe verifikim në shfletues.

### Prova 2: Shoferi ndryshon udhëtimin e vet

Kontrolli në server dhe formulari për udhëtimin ID 2 janë implementuar.
Ndryshimi real në Neon nuk u provua sepse mungojnë `DATABASE_URL` dhe
konfigurimi OAuth. Pas ekzekutimit të `schema-java05.sql`, hyrjes me GitHub,
caktimit të rolit `shofer` dhe pronësisë së ID 2, provo orën `08:25`.
Verifikoje në panel, listë, detaje dhe Neon, pastaj riktheje në `08:15`.
Mos e shëno si të kaluar pa e kryer këtë provë.

### Prova 3: Veprimi pa leje refuzohet

Përditësimi SQL kërkon njëkohësisht që përdoruesi i sesionit të jetë shofer
dhe pronar i udhëtimit. Testi real me formularin dhe Neon nuk u krye në këtë
mjedis. Për verifikim, pasi të kalojë Prova 2, ndrysho përkohësisht vlerën
`id` të formularit nga `2` në `1` dhe provo ruajtjen. Paneli duhet të tregojë
“Nuk ke leje për këtë udhëtim. Ora nuk ndryshoi.”; në Neon ID 1 duhet të
mbetet `08:00`. Rikthe formularin dhe ID 2 në gjendjen fillestare.

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

OAuth App duhet krijuar nga pronari i llogarisë GitHub; sekretet vendosen
vetëm në `.env.local` dhe nuk publikohen. Konfigurimi lokal përdor callback
`http://localhost:3000/api/auth/callback/github`. Provat e mësipërme që
kërkojnë kredenciale/databazë duhen kryer lokalisht para dorëzimit final.

## Çfarë mbetet për përmirësim

Kërkesa për vend vazhdon të jetë simulim dhe nuk ruhet. Hapi pasues mund të
jetë ruajtja e kërkesës dhe miratimi/refuzimi i saj nga shoferi. Duhet
gjithashtu të kryhen tri provat manuale me OAuth App dhe Neon.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)

AI ndihmoi në implementimin e hyrjes, kontrollit të lejeve, ndërfaqes mobile,
PWA-së dhe këtij raporti. Lidhja reale me GitHub dhe Neon nuk mund të
verifikohej në këtë mjedis pa kredencialet personale; këto hapa janë shënuar
qartë si të pakryer.
