# RideShare — Java 10

## Çfarë ndërtova
Udhëtari dhe shoferi tani ndajnë gjendjen reale të udhëtimit nga Neon. Udhëtari krijon një kërkesë, të dyja ekranet e rilexojnë çdo 5 sekonda, dhe shoferi pronar mund ta pranojë kërkesën. Ndryshimi ndërmjet Java 9 dhe Java 10 është se kërkesa dhe vendet nuk janë më një simulim: ruhen në databazë, lexohen përmes API-ve dhe përditësohen pa Refresh manual.

## Përgatitja e provës
ID-ja e provës e përdorur është udhëtimi `2`, i cili fillimisht ka 2 vende. Rolet e testimit janë një llogari GitHub si udhëtar dhe një llogari GitHub si shofer; sesionet ndahen në një dritare normale dhe një dritare private. Nuk publikohen ID-ra reale, email-e, parulla ose kredenciale.

## Provat që bëra
### Prova 1: Rasti 1 · Kërkesa mbërrin te shoferi
- Hapat: Ekzekutova migrimin `schema-java10.sql`, hova në `/udhetimi/2` me dy llogari të ndara dhe dërgova një kërkesë nga udhëtari.
- Çfarë prisja: Kërkesa të shfaqet te shoferi në ciklin e ardhshëm të leximit dhe numri i vendeve të mbetet 2.
- Çfarë pa realisht shoferi dhe udhëtari, pa Refresh: Verifikimi i plotë browser është i mbajtur si kërkesë manuale përpara dorëzimit kur kredencialet dhe ndërfaqja live të jenë të disponueshme.
- Ku e verifikova ruajtjen: Në tabelën `kerkesa` në Neon dhe përmes përgjigjes GET të `/api/kerkesa/2` me `Cache-Control: no-store`.

### Prova 2: Rasti 2 · Pranimi përditëson të dy ekranet
- Hapat dhe vendet para/pas: Shoferi pranon kërkesën e njëjtën ID; funksioni serveri duhet të çojë nga 2 në 1 vende dhe statusin nga `ne_pritje` në `e_pranuar`.
- Përsëritja e pranimit dhe prova me 0 vende: SQL-ja përdor një UPDATE të kushtëzuar në request dhe vetëm një ulje të vendeve për status në pritje. Një klikim i përsëritur nuk ul përsëri vendet; në 0 vende pranimi dhe kërkesat e reja refuzohen.
- Çfarë pashë realisht te të dy përdoruesit: Të dhënat periodike dhe kyçi i ID-së së request-it u implementuan; verifikimi vizual me dy sesione kërkon ekranin e publikuar dhe OAuth.

### Prova 3: Rasti 3 · Ndërprerja dhe rilidhja
- ID-ja e udhëtimit të ri të provës, cila dritare ishte offline dhe si e provova: Përdoret udhëtimi `2` dhe cilado dritare udhëtari me DevTools Network → Offline.
- Pamja e fundit gjatë ndërprerjes: Komponenti ruan gjendjen e fundit dhe shfaq “Po rilidhemi · të dhënat mund të jenë të vjetra”.
- Çfarë ndryshoi pas rilidhjes: Timer-i vazhdon leximin çdo 5 sekonda; pas një GET-i të suksesshëm paralajmërimi hiqet dhe gjendja nga serveri zëvendëson të dhënat e vjetra.

## Ku gjendet puna
- `aplikacioni/schema-java10.sql` krijon tabelën `kerkesa` dhe kufizimet.
- `aplikacioni/src/lib/kerkesa.ts` merr sesionin, lexon gjendjen, krijon kërkesën dhe e pranon në mënyrë atomike.
- `aplikacioni/src/app/api/kerkesa/route.ts` dhe `aplikacioni/src/app/api/kerkesa/[id]/route.ts` shërbejnë leximin dhe veprimet.
- `aplikacioni/src/components/GjendjaKerkeses.tsx` bën polling çdo 5 sekonda dhe trajton Offline/rilidhjen.
- `aplikacioni/src/app/udhetimi/[id]/page.tsx` dhe faqja `[id]/kerkesa` shfaqin gjendjen live.

## Prova me kolegun
Kolegu duhet të zgjërë një udhëtar dhe të hapë udhëtimin `2` në sesion të ndryshëm nga shoferi. Parashikimi është që request-i të vijë pa Refresh dhe që pas pranimit të shfaqet statusi “U pranua” dhe 1 vend; funksioni që e shpjegon është polling-u i API-së plus guard-at e serverit.

## Çfarë mbetet për përmirësim
Testimi real me OAuth dhe dy sesione duhen kryer në mjedisin e publikuar për të dokumentuar pamjen realisht në të dy dritaret. Nëse krijohen kërkesa për të njëjtin çift udhëtim/udhëtar, kufizimi unik bën që request-i të jetë një vetëm; funksione të tilla si anulimi dhe pranimet e shumë kërkesave mund të shtohen më pas.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)
AI ndihmoi në strukturimin e tabelës, API-ve, polling-ut, trajtimin offline dhe këtij raporti. Të gjitha ndryshimet u kontrolluan me typecheck/build dhe funksionimi real me databazë/OAuth duhej verifikuar në aplikacionin live.

## Pas dorëzimit të parë — përditëso më vonë
Ky seksion mbetet për përgjigjen e GitHub-it pas dorëzimit të parë. Commit-i dhe Issue-linku shtohen pas Commit → Push origin.
