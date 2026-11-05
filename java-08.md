# RideShare — Java 8 · Vendtakimi

## Çfarë u ndërtua

Te faqja e detajeve të udhëtimit u shtua zgjedhja e vendtakimit. Përdoruesi
mund të:

- shkruajë një vendtakim manualisht;
- ta konfirmojë tekstin pasi pastrohet me `trim()`;
- përdorë vendndodhjen e telefonit vetëm pasi klikon butonin;
- shohë saktësinë e pozicionit në metra;
- shohë koordinatat `latitude, longitude` të kthyera nga pajisja;
- hapë koordinatat në Google Maps në një skedë të re;
- vazhdojë me zgjedhje manuale kur leja refuzohet, vendndodhja nuk është e
  disponueshme ose kërkesa përfundon me timeout.

Gjendja e tekstit në fushë mbahet e ndarë nga vendtakimi i konfirmuar. Prandaj,
ndryshimi i fushës pa klikuar butonin nuk e ndryshon zgjedhjen e konfirmuar.
Kërkesa për vendndodhje nuk nis gjatë renderimit të faqes, por vetëm pas
klikimit të përdoruesit.

## Skedarët kryesorë

- `aplikacioni/src/components/Vendtakimi.tsx` — komponenti klient për
  vendtakimin manual dhe geolocation.
- `aplikacioni/src/app/udhetimi/[id]/page.tsx` — përdorimi i komponentit në
  detajet e udhëtimit.
- `aplikacioni/src/app/globals.css` — stilet e komponentit, në përputhje me
  dizajnin ekzistues.

## Provat

### Prova 1

- **Hapat:** Hapa `https://rideshare-mobile-ten.vercel.app/udhetimi/2` dhe
  vëzhgova faqen para se të klikoja butonin e vendndodhjes. Pastaj shkrova
  `Biblioteka e qytetit` në fushën e vendtakimit dhe klikova **Konfirmo në
  telefon**.
- **Pritshmëria:** Faqja të hapet pa kërkuar leje për vendndodhjen. Teksti i
  ri të mos bëhet vendtakim i konfirmuar vetëm nga shkrimi, por të pranohet
  pas klikimit të butonit.
- **Çfarë pashë realisht:** Në hapje nuk u shfaq kërkesë lejeje dhe fusha
  kishte vlerën fillestare `Te stacioni kryesor`. Pas klikimit u shfaq
  `Vendtakimi i konfirmuar: Biblioteka e qytetit`.

### Prova 2

- **Hapat:** Në të njëjtën faqe klikova **Përdor vendndodhjen time** me
  geolocation të simuluar si të refuzuar. Pastaj e përsërita klikimin me
  gabimin e simuluar `timeout` (kërkesë që mbaron pas pritjes).
- **Pritshmëria:** Refuzimi të shfaqë udhëzim për vendtakim manual dhe të
  mbajë aktive fushën manuale. Timeout-i të shfaqë mesazh për skadimin dhe
  të lejojë provë të re ose shkrim manual.
- **Çfarë pashë realisht:** Për refuzimin u shfaq
  `Leja u refuzua. Shkruaj vendtakimin vetë.` Për timeout-in u shfaq
  `Kërkesa për vendndodhje skadoi. Provo përsëri ose shkruaj vendtakimin.`;
  në të dy rastet fusha dhe butoni manual mbetën të përdorshëm.

### Prova 3

- **Hapat:** Klikova **Përdor vendndodhjen time** me një përgjigje të
  simuluar të suksesshme të pajisjes dhe kontrollova tekstin e shfaqur në
  faqe dhe URL-në e lidhjes së hartës.
- **Pritshmëria:** Dëshmia të përmbajë vetëm saktësinë dhe koordinatat e
  kthyera nga geolocation, pa çelësa, token-a, fjalëkalime ose të dhëna të
  tjera sekrete të aplikacionit.
- **Çfarë pashë realisht:** UI shfaqi `Pozicioni u mor.`, `Saktësia: 12 m`
  dhe `Koordinatat: 42.662900, 21.165500`, si dhe një lidhje të kufizuar
  te Google Maps me këto koordinata. Nuk u shfaqën `DATABASE_URL`,
  `NEXTAUTH_SECRET`, token-a apo sekrete të tjera në tekstin e faqes.

### Prova me një hyrje të re

- **Hyrja që provova:** `Biblioteka e qytetit` në fushën **Shkruaj
  vendtakimin** te `/udhetimi/2`.
- **Parashikimi im para klikimit:** Vetëm shkrimi nuk duhet të ndryshojë
  vendtakimin e konfirmuar; pas klikimit te **Konfirmo në telefon** duhet të
  shfaqet teksti i ri i pastruar.
- **Çfarë pashë realisht:** Para klikimit u shfaq ende
  `Vendtakimi i konfirmuar: Te stacioni kryesor`. Pas klikimit u shfaq
  `Vendtakimi i konfirmuar: Biblioteka e qytetit`.
- **Skedari dhe funksioni që e shpjegojnë:** Në
  [`aplikacioni/src/components/Vendtakimi.tsx`](./aplikacioni/src/components/Vendtakimi.tsx),
  funksioni `konfirmoVendtakimin` përdor `trim()`, kontrollon tekstin bosh
  dhe vetëm pastaj thërret `setVendtakimi(vlera)`.
- **Çfarë kuptova ose korrigjova:** Kuptova se teksti i shkruar dhe
  vendtakimi i konfirmuar janë dy gjendje të ndara. Nuk bëra korrigjim në
  kod, sepse sjellja e vëzhguar përputhej me pritshmërinë.

`npm run typecheck` kaloi me sukses. Build-i lokal kërkon Node.js 20.9 ose më
të ri, ndërsa ky kompjuter ka Node.js 18.12.1. Deploy-i në Vercel përdor
 mjedisin e tij të Node.js.
