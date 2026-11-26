# rideshare-mobile

## RideShare — Java 5

Projekt mësimor Next.js për listën e udhëtimeve, detajet dhe një kërkesë të
simuluar. Lista dhe detajet lexohen nga PostgreSQL në Neon. Hyrja mundësohet
me GitHub OAuth; pasi të konfigurohen çelësat, roli dhe pronësia e udhëtimit
kontrollohen në Neon përpara se shoferi të ndryshojë orën. Të gjitha të dhënat
janë fiktive; aplikacioni nuk bën rezervime reale.

### Projekti live

Mund ta kontrollosh aplikacionin këtu: [rideshare-mobile-ten.vercel.app](https://rideshare-mobile-ten.vercel.app/).

### Nisja e aplikacionit

Instalo Node.js dhe npm, pastaj nga dosja `aplikacioni/` kopjo `.env.example`
te `.env.local` dhe plotëso vlerat e tua. Krijo një OAuth App në
[GitHub Developer settings](https://github.com/settings/applications/new):

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Gjenero `NEXTAUTH_SECRET` lokalisht me
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Mbaj `DATABASE_URL` nga Neon. Mos i vendos vlerat reale në GitHub, raport ose
mesazhe; `.env.local` përjashtohet nga Git.

Ekzekuto në Neon SQL Editor fillimisht `schema.sql`, pastaj
`schema-java05.sql`, `schema-java09.sql`, `schema-java10.sql` dhe `schema-java11.sql`. Nis aplikacionin:

```bash
npm install
npm run dev
```

Hap `http://localhost:3000/panel`, hyr me GitHub dhe kopjo ID-në numerike të
shfaqur. Në Neon SQL Editor cakto rolin dhe pronësinë vetëm për profilin tënd:

```sql
UPDATE profilet SET roli = 'shofer' WHERE github_id = 'ID_JOTE_GITHUB';
UPDATE udhetimet SET shofer_id = 'ID_JOTE_GITHUB' WHERE id = '2';
```

### Java 10 · Kërkesat në kohë reale

Udhëtari kërkon një vend te faqja e detajeve; kërkesa ruhet në tabelën
`kerkesat` në Neon. Shoferi pronar e sheh dhe e pranon pa Refresh, sepse të dy
ekranet rilexojnë `GET /api/udhetimet/[id]/gjendja` çdo 5 sekonda. Pranimi
(`POST /api/kerkesat/[id]/prano`) ndryshon statusin dhe ul vendet në një
deklaratë SQL: i njëjti pranim nuk numërohet dy herë dhe vendet nuk bëhen
negative. Udhëtimet fiktive `5` dhe `6` kanë nga 2 vende për provat; cakto
veten si pronar me komandat e komentuara te `schema-java10.sql`.

### Java 11 · Njoftimet

Kur shoferi pronar pranon një kërkesë, në të njëjtën deklaratë SQL krijohet
një njoftim personal për udhëtarin (tabela `njoftimet`, `schema-java11.sql`).
E njëjta përgjigje nuk krijon njoftim të dytë. Butoni **Njoftimet** tregon
numrin e të palexuarave dhe rilexon `GET /api/njoftimet` çdo 5 sekonda; një
njoftim i ri shfaq toast vetëm një herë. Hapja çon te `/kerkesat/[id]` dhe
`POST /api/njoftimet/[id]/lexuar` e shënon si të lexuar vetëm për marrësin.
Historia nuk fshihet. Web Push nuk është konfiguruar.

PWA (Progressive Web App – aplikacion web progresiv) ka manifest, ikonë dhe
service worker. Kur humbet lidhja, shfaqet faqja offline; faqet dinamike me
orare nuk ruhen si kopje të vjetruara. Për instalim në pajisje hape me HTTPS
(ose localhost) dhe përdor komandën e instalimit të shfletuesit.

### Publikimi me GitHub OAuth

Nëse e aktivizon në Vercel, krijo një OAuth App të veçantë për prodhim:

- Homepage URL: `https://rideshare-mobile-ten.vercel.app`
- Callback URL: `https://rideshare-mobile-ten.vercel.app/api/auth/callback/github`

Vendos `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` dhe
`DATABASE_URL` te Vercel Project Settings → Environment Variables. Përdor
`NEXTAUTH_URL=https://rideshare-mobile-ten.vercel.app` dhe një secret të
veçantë e të rastësishëm për prodhim. Callback-u i OAuth App lokal nuk
funksionon për domenin e publikuar. Mos i ruaj këto vlera në repository.

Raportet janë te [java-03.md](./java-03.md), [java-04.md](./java-04.md),
[java-05.md](./java-05.md), [java-08.md](./java-08.md),
[java-09.md](./java-09.md) dhe [java-10.md](./java-10.md), pranë README dhe
jashtë dosjes `aplikacioni/`.