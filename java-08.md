# RideShare — Java 8 · Vendtakimi

## Çfarë u ndërtua

Te faqja e detajeve të udhëtimit u shtua zgjedhja e vendtakimit. Përdoruesi
mund të:

- shkruajë një vendtakim manualisht;
- ta konfirmojë tekstin pasi pastrohet me `trim()`;
- përdorë vendndodhjen e telefonit vetëm pasi klikon butonin;
- shohë saktësinë e pozicionit në metra;
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

U provua që:

1. faqja e detajeve vazhdon të lexojë udhëtimin nga Neon në server;
2. vendtakimi fillestar shfaqet në fushën manuale;
3. një tekst i ri ruhet vetëm pas konfirmimit;
4. tekst bosh ose vetëm me hapësira shfaq mesazh gabimi;
5. suksesi i geolocation shfaq saktësinë në metra;
6. refuzimi i lejes e lë aktive zgjedhjen manuale;
7. timeout-i dhe mungesa e mbështetjes shfaqin mesazh dhe lejojnë provë të
   re.

`npm run typecheck` kaloi me sukses. Build-i lokal kërkon Node.js 20.9 ose më
të ri, ndërsa ky kompjuter ka Node.js 18.12.1. Deploy-i në Vercel përdor
 mjedisin e tij të Node.js.
