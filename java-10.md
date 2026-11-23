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
  (Ferizaj → AAB, 09:30) për Rastin 3, secili me **2 vende** në fillim.
- Rolet: llogaria ime GitHub si shofer pronar i udhëtimeve 5 dhe 6, dhe një
  llogari e dytë GitHub si udhëtar. Të dhënat e udhëtimeve janë fiktive; ID-të
  e llogarive dhe kredencialet nuk publikohen këtu.
- Sesionet: shoferi në një dritare normale, udhëtari në një dritare private,
  që të mos ndajnë cookie-n e sesionit. Të dyja hapën të njëjtën adresë.
- Migrimi `schema-java10.sql` u ekzekutua në Neon para provave.

## Provat që bëra
### Prova 1: Rasti 1 · Kërkesa mbërrin te shoferi
- Hapat: hapa `/udhetimi/5` në të dy dritaret. Të dyja treguan **Vende të
  lira 2**; shoferi **Ende pa kërkesë**, udhëtari **Pa kërkesë** dhe butonin
  **Kërko një vend**. Udhëtari klikoi **Kërko një vend**; shoferi nuk preku
  Refresh.
- Çfarë prisja: udhëtari sheh **Në pritje**; shoferi e sheh kërkesën pas
  leximit të radhës; vendet mbeten 2.
- Çfarë pa realisht shoferi dhe udhëtari, pa Refresh: udhëtari pa menjëherë
  pas konfirmimit të serverit **Në pritje** dhe butonin e çaktivizuar
  **Kërkesa u dërgua**. Brenda 5 sekondave, pa Refresh, te shoferi u shfaq
  **KËRKESA E …** me statusin **Në pritje** dhe butonin **Prano kërkesën**.
  Vendet mbetën 2 te të dy.
- Ku e verifikova ruajtjen: te DevTools → Network pashë thirrjen
  `POST /api/udhetimet/5/kerkesa` me `200` dhe leximet periodike
  `GET /api/udhetimet/5/gjendja`. Rifreskimi i faqes së udhëtarit e mbajti
  statusin **Në pritje**, pra kërkesa ishte ruajtur në Neon dhe jo vetëm në
  ekran (`SELECT id, statusi FROM kerkesat WHERE udhetim_id = '5';`).

### Prova 2: Rasti 2 · Pranimi përditëson të dy ekranet
- Hapat dhe vendet para/pas: te shoferi klikova **Prano kërkesën**. Gjatë
  dërgimit butoni tregoi **Po ruhet…**, pastaj **Pranimi u ruajt**. Vendet
  ranë nga **2** në **1** te shoferi pas konfirmimit të serverit.
- Përsëritja e pranimit dhe prova me 0 vende: funksioni i pranimit në server
  u thirr dy herë me të njëjtën ID kërkese brenda një transaksioni të kthyer
  mbrapsht: pranimi i parë ndryshoi 1 rresht (2 → 1 vend), i dyti 0 rreshta
  dhe vendet mbetën 1. Pranimi nga një llogari jo-pronare ndryshoi 0 rreshta.
  Me vende = 0, pranimi ndryshoi 0 rreshta, vendet mbetën 0, statusi mbeti
  `ne_pritje` dhe API kthen `409` me **Nuk ka vende të lira. Kërkesa nuk u
  pranua.** Vendet nuk u bënë negative.
- Çfarë pashë realisht te të dy përdoruesit: shoferi pa **U pranua** dhe 1
  vend menjëherë pas konfirmimit; udhëtari, pa Refresh, pas leximit të radhës
  pa **U pranua**, butonin **Vendi u konfirmua** dhe **Vende të lira 1**. Të
  dy ekranet treguan të njëjtin rezultat.

### Prova 3: Rasti 3 · Ndërprerja dhe rilidhja
- ID-ja e udhëtimit të ri të provës, cila dritare ishte offline dhe si e
  provova: udhëtimi `6` me 2 vende. Udhëtari dërgoi një kërkesë të re
  (**Në pritje**). Vetëm në dritaren e udhëtarit kalova DevTools → Network →
  Offline; dritarja e shoferit mbeti online. Wi-Fi i kompjuterit nuk u
  ndërpre.
- Pamja e fundit gjatë ndërprerjes: udhëtari mbajti vlerat e fundit —
  **Vende të lira 2** dhe **Në pritje** — me paralajmërimin **Po rilidhemi ·
  të dhënat mund të jenë të vjetra** dhe **Veprimet që kërkojnë rrjet janë të
  bllokuara**. Numri i vendeve nuk u kthye në zero. Ndërkohë shoferi pranoi
  kërkesën dhe pa 1 vend, pra pamja e udhëtarit ishte e vjetër krahasuar me
  serverin.
- Çfarë ndryshoi pas rilidhjes: e ktheva Network në No throttling. Pa Refresh
  manual, pas leximit të suksesshëm paralajmërimi u hoq dhe udhëtari pa
  **U pranua**, **Vendi u konfirmua** dhe **Vende të lira 1**.

## Ku gjendet puna
- `aplikacioni/schema-java10.sql` — tabela `kerkesat` (UNIQUE për udhëtim +
  udhëtar) dhe udhëtimet fiktive 5 e 6.
- `aplikacioni/src/lib/kerkesat.ts` — `lexoGjendjen` (vetëm lexim),
  `dergoKerkesen` dhe `pranoKerkesen` (statusi + vendet në një deklaratë).
- `aplikacioni/src/app/api/udhetimet/[id]/gjendja/route.ts` — rruga e leximit
  (`Cache-Control: private, no-store`).
- `aplikacioni/src/app/api/udhetimet/[id]/kerkesa/route.ts` — ruajtja e kërkesës.
- `aplikacioni/src/app/api/kerkesat/[id]/prano/route.ts` — veprimi i pranimit.
- `aplikacioni/src/components/GjendjaUdhetimit.tsx` — leximi çdo 5 s,
  anulimi, offline dhe rilidhja.
- `aplikacioni/src/app/udhetimi/[id]/page.tsx` — leximi i parë në server.
- Demonstrimi: https://rideshare-mobile-ten.vercel.app

## Prova me kolegun
Kolegu zgjodhi të provonte pranimin e përsëritur te i njëjti udhëtim, duke
hapur faqen e shoferit në dy skeda dhe duke klikuar **Prano kërkesën** në të
dyja para se ndonjëra të rifreskohej. Parashikimi im: vetëm pranimi i parë
ul vendet; i dyti kthen gjendjen ekzistuese pa ndryshuar numrin. Vëzhgimi:
vendet ranë vetëm një herë (2 → 1); skeda e dytë shfaqi **Kjo kërkesë ishte
pranuar më parë; vendet nuk u ulën përsëri.** Funksioni që e shpjegon është
`pranoKerkesen` te `aplikacioni/src/lib/kerkesat.ts`: kushti
`statusi = 'ne_pritje'` me `FOR UPDATE` lejon vetëm një kalim në `pranuar`.

## Çfarë mbetet për përmirësim
Përditësimi me timer vonon deri në 5 sekonda dhe bën kërkesa edhe kur nuk ka
ndryshime; hapi i ardhshëm është një version numerik nga serveri ose
Server-Sent Events. Refuzimi dhe anulimi i kërkesës nuk janë implementuar,
ndaj një kërkesë e pranuar nuk mund të lirojë vendin.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)
AI (Claude Code) ndihmoi në shkrimin e skemës, funksioneve të serverit,
komponentit me lexim periodik dhe këtij raporti. E provova vetë: `npm run
typecheck` dhe `npm run build` kaluan; rregulli i pranimit u testua në Neon
brenda një transaksioni të kthyer mbrapsht; tri rastet i kalova me dy llogari
në dy dritare (normale dhe private) dhe me DevTools → Network → Offline.

## Pas dorëzimit të parë — përditëso më vonë
Ky seksion plotësohet pasi të krijohet Issue-ja dhe të vijë komenti i
kontrolluesit.
