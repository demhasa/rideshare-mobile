# RideShare — Java 4 · Neon dhe PostgreSQL

## Çfarë ndërtova

Lista, detajet dhe faqja e kërkesës lexojnë udhëtimet nga Neon përmes
`@neondatabase/serverless`. Lidhja private ruhet në `DATABASE_URL` dhe
përdoret vetëm nga kodi i serverit. Kërkesa “Në pritje” mbetet simulim;
nuk ruhet rezervim real dhe nuk njoftohet shoferi.

## Provat që bëra

### Prova 1: Ndryshimi në databazë shfaqet në aplikacion

Kjo provë kërkon databazën time Neon dhe duhet bërë në SQL Editor:

```sql
UPDATE udhetimet SET ora = '08:25' WHERE id = '2';
```

Rifresko listën dhe `/udhetimi/2`; të dyja duhet të tregojnë `08:25`.
Pastaj rikthe orën në `08:15` në SQL Editor dhe rifresko të dyja faqet.
Kjo provë nuk është kryer nga ky mjedis.

### Prova 2: Lista bosh dhe rikthimi

Në `aplikacioni/src/lib/udhetimet.ts`, shto përkohësisht
`WHERE false` te pyetja brenda `lexoUdhetimet`. Faqja duhet të tregojë
“Nuk ka udhëtime për momentin.” Hiqe kushtin; duhet të kthehen tri kartat.
Prova manuale nuk është kryer nga ky mjedis.

### Prova 3: Lidhja mungon, rikthimi dhe siguria

Prova manuale nuk është kryer nga ky mjedis. Për ta bërë, riemërto përkohësisht
`DATABASE_URL` në `aplikacioni/.env.local`, rinis serverin dhe kontrollo
mesazhin “Nuk u lidhëm me databazën. Provo përsëri.” Rikthe emrin
`DATABASE_URL`, rinis serverin dhe kontrollo që të dhënat të shfaqen sërish.
`.env*` përjashtohet nga Git; mos publiko URL-në ose pamje të kredencialeve.

## Ku gjendet puna

- SQL: `aplikacioni/schema.sql`
- Lidhja private: `aplikacioni/src/lib/db.ts`
- Leximi dhe tipi i udhëtimeve: `aplikacioni/src/lib/udhetimet.ts`
- Faqet: `aplikacioni/src/app/page.tsx`,
  `aplikacioni/src/app/udhetimi/[id]/page.tsx` dhe
  `aplikacioni/src/app/udhetimi/[id]/kerkesa/page.tsx`
- Repository: https://github.com/demhasa/rideshare-mobile
- Aplikacioni Vercel: https://rideshare-mobile-ten.vercel.app/

## Çfarë mbetet për përmirësim

Duhet kryer verifikimi manual me databazën time Neon lokalisht dhe në Vercel.
Hapi i ardhshëm është ruajtja dhe konfirmimi real i kërkesës për vend;
aktualisht ky veprim mbetet simulim.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)

AI ndihmoi në lidhjen e faqeve me Neon dhe në përgatitjen e raportit.
U kontrolluan llojet me `npm run typecheck` dhe ndërtimi me `npm run build`;
provat që kërkojnë qasje në databazën time duhen bërë veçmas.
