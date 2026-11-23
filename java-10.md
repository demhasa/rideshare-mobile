# RideShare — Java 10

## Çfarë ndërtova
Kërkesa për vend nuk është më simulim. Udhëtari i identifikuar me GitHub klikon
**Kërko një vend** te faqja e detajeve dhe kërkesa ruhet në tabelën e re
`kerkesat` në Neon me statusin `ne_pritje`. Shoferi pronar e sheh kërkesën te
i njëjti udhëtim dhe e pranon me **Prano kërkesën**. Të dy ekranet rilexojnë
gjendjen nga serveri çdo 5 sekonda, pa Refresh manual.

Ndryshimi ndaj javës 9: te preferimet gjendja i përkiste vetëm një përdoruesi
dhe UI-ja ishte optimiste. Këtu gjendja ndahet mes dy sesioneve, ndaj UI-ja nuk
ndryshon para konfirmimit të serverit dhe rregulli i pranimit jeton në SQL.

- Serveri e merr udhëtarin nga sesioni; shoferin pronar e njeh nga
  `udhetimet.shofer_id`. Shfletuesi dërgon vetëm ID-në e udhëtimit ose kërkesës.
- Shoferi pronar lexon të gjitha kërkesat e udhëtimit të vet; udhëtari lexon
  vetëm kërkesën e vet; vizitori sheh vetëm vendet.
- Leximi periodik nuk nis një lexim të dytë ndërsa i pari pret, anulohet me
  `AbortController` kur largohesh nga faqja, dhe injoron përgjigjet e nisura
  para një veprimi (dërgim/pranim), që një përgjigje e vjetër të mos e
  mbishkruajë gjendjen e re.
- Kur leximi dështon, mbahen vlerat e fundit dhe shfaqet **Po rilidhemi · të
  dhënat mund të jenë të vjetra**; veprimet bllokohen. Në ngjarjen `online`
  lexohet menjëherë dhe paralajmërimi hiqet vetëm pas përgjigjes së
  suksesshme.
- Pranimi ndryshon statusin dhe ul vendet në një deklaratë SQL (një
  transaksion): vetëm kërkesa `ne_pritje` kalon në `pranuar`, vendet ulen
  vetëm kur `vende > 0`, dhe `FOR UPDATE` radhit dy pranime të njëkohshme.

## Përgatitja e provës
- Udhëtimet fiktive: `5` (Ferizaj → AAB, 08:15) për Rastet 1–2 dhe `6`
  (Ferizaj → AAB, 09:30) për Rastin 3, secili me **2 vende**.
- Rolet: llogaria ime GitHub si shofer pronar i udhëtimeve 5 dhe 6, dhe një
  llogari e dytë GitHub si udhëtar (të dyja ekzistojnë te `profilet`).
- Sesionet: shoferi në një dritare normale, udhëtari në një dritare private,
  që të mos ndajnë cookie-n e sesionit.
- Migrimi `schema-java10.sql` u ekzekutua në Neon; leximi i udhëtimeve u
  verifikua (udhëtimet 5 dhe 6 kthehen me 2 vende).

## Provat që bëra
### Prova 1: Rasti 1 · Kërkesa mbërrin te shoferi
- Hapat: hap `/udhetimi/5` te të dy dritaret; udhëtari klikon **Kërko një
  vend**; shoferi pret leximin e radhës pa prekur Refresh.
- Çfarë prisja: te udhëtari **Në pritje** / **Kërkesa u dërgua**; te shoferi
  **KËRKESA E …** me **Në pritje** brenda ≤ 5 s; vendet mbeten 2.
- Çfarë pa realisht shoferi dhe udhëtari, pa Refresh: prova me dy llogari në
  shfletues ende nuk është kryer — kërkon hyrje me dy llogari GitHub. Kontrollet
  që u kryen: `GET /api/udhetimet/5/gjendja` pa sesion kthen `200`, rolin
  `vizitor`, `vende: 2` dhe `Cache-Control: private, no-store`;
  `POST /api/udhetimet/5/kerkesa` pa sesion kthen `401`.
- Ku e verifikova ruajtjen: tabela `kerkesat` në Neon; pas provës me dy
  llogari kontrollohet me
  `SELECT id, udhetar_id, statusi FROM kerkesat WHERE udhetim_id = '5';`

### Prova 2: Rasti 2 · Pranimi përditëson të dy ekranet
- Hapat dhe vendet para/pas: u testua funksioni i pranimit në server me të
  njëjtin SQL si në `pranoKerkesen`, brenda një transaksioni që u kthye mbrapsht
  (`ROLLBACK`): vende para = 2; pranimi i parë ndryshoi 1 rresht → vende = 1.
- Përsëritja e pranimit dhe prova me 0 vende: pranimi i dytë me të njëjtën ID
  kërkese ndryshoi 0 rreshta dhe vendet mbetën 1. Pranimi nga një llogari që
  nuk është pronare ndryshoi 0 rreshta. Me vende = 0, pranimi ndryshoi 0
  rreshta, vendet mbetën 0 dhe statusi mbeti `ne_pritje` (API kthen `409`).
- Çfarë pashë realisht te të dy përdoruesit: prova vizuale në dy dritare ende
  nuk është kryer; pritet **U pranua** dhe 1 vend te të dy pas leximit të
  radhës.

### Prova 3: Rasti 3 · Ndërprerja dhe rilidhja
- ID-ja e udhëtimit të ri të provës, cila dritare ishte offline dhe si e
  provova: udhëtimi `6` (2 vende). Plani: vetëm dritarja e udhëtarit kalon në
  DevTools → Network → Offline; shoferi mbetet online dhe pranon.
- Pamja e fundit gjatë ndërprerjes: ende pa u provuar në shfletues. Kodi mban
  vlerat e fundit (2 vende, Në pritje) dhe shfaq **Po rilidhemi**; butonat
  bllokohen.
- Çfarë ndryshoi pas rilidhjes: ende pa u provuar; pas kthimit në
  No throttling, ngjarja `online` nis një lexim të menjëhershëm dhe pritet
  **U pranua** me 1 vend.

## Ku gjendet puna
- `aplikacioni/schema-java10.sql` — tabela `kerkesat` (UNIQUE për udhëtim +
  udhëtar) dhe udhëtimet fiktive 5 e 6.
- `aplikacioni/src/lib/kerkesat.ts` — `lexoGjendjen` (vetëm lexim),
  `dergoKerkesen` dhe `pranoKerkesen` (statusi + vendet në një deklaratë).
- `aplikacioni/src/app/api/udhetimet/[id]/gjendja/route.ts` — rruga e leximit.
- `aplikacioni/src/app/api/udhetimet/[id]/kerkesa/route.ts` — ruajtja e kërkesës.
- `aplikacioni/src/app/api/kerkesat/[id]/prano/route.ts` — veprimi i pranimit.
- `aplikacioni/src/components/GjendjaUdhetimit.tsx` — leximi çdo 5 s,
  anulimi, offline dhe rilidhja.
- `aplikacioni/src/app/udhetimi/[id]/page.tsx` — leximi i parë në server.
- Demonstrimi: https://rideshare-mobile-ten.vercel.app (pasi të ekzekutohet
  `schema-java10.sql` në databazën e prodhimit).

## Prova me kolegun
Ende pa u kryer. Do të shënoj vlerën që zgjedh kolegu, parashikimin tim para
veprimit, çfarë ndodhi dhe funksionin që e shpjegon (p.sh. `pranoKerkesen`
për pranimin e përsëritur).

## Çfarë mbetet për përmirësim
Përditësimi me timer vonon deri në 5 sekonda dhe bën kërkesa edhe kur nuk ka
ndryshime; hapi i ardhshëm është një version numerik nga serveri ose
Server-Sent Events. Refuzimi dhe anulimi i kërkesës nuk janë implementuar.
Provat në dy dritare me dy llogari GitHub duhen kryer dhe shënuar më sipër.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)
AI (Claude Code) ndihmoi në shkrimin e skemës, funksioneve të serverit,
komponentit me lexim periodik dhe këtij raporti. Verifikimi: `npm run
typecheck` dhe `npm run build` kaluan; rregulli i pranimit u testua në Neon
brenda një transaksioni të kthyer mbrapsht; rrugët API u provuan pa sesion me
`curl`. Provat me dy llogari në shfletues mbeten për t'u kryer nga unë.

## Pas dorëzimit të parë — përditëso më vonë
Ky seksion plotësohet pasi të krijohet Issue-ja dhe të vijë komenti i
kontrolluesit.
