# RideShare — Java 11: Njoftimet dhe angazhimi

Plotëso fushat e modelit me vëzhgimet e tua. Përdor vetëm të dhëna fiktive në raport.

## Çfarë shtova ndaj javës 10
- I ri: pranimi i kërkesës nga shoferi pronar krijon një **njoftim personal**
  për udhëtarin në tabelën e re `njoftimet` (`id`, `marres_id`, `kerkesa_id`,
  `lloji`, `krijuar_me`, `lexuar_me`). Marrësin e vendos serveri nga
  `kerkesat.udhetar_id`; telefoni nuk dërgon marrës.
- Pranimi dhe njoftimi ruhen në **të njëjtën deklaratë SQL** (një CTE që
  ul vendet, ndryshon statusin dhe fut njoftimin). Kjo është një transaksion
  atomik në Postgres: ose ruhen të dyja, ose asnjëra. `UNIQUE (kerkesa_id,
  lloji)` + `ON CONFLICT DO NOTHING` nuk lejon njoftim të dytë për të njëjtën
  përgjigje.
- `GET /api/njoftimet` vetëm lexon njoftimet e përdoruesit të sesionit dhe
  numrin e të palexuarave; nuk krijon asgjë.
- `POST /api/njoftimet/[id]/lexuar?kerkesa=…` shënon si të lexuar vetëm nëse
  sesioni është marrësi dhe njoftimi i përket asaj kërkese
  (`COALESCE(lexuar_me, NOW())`, pra leximi i përsëritur mban kohën e parë).
- Butoni **Njoftimet** me numrin e të palexuarave te shiriti i sipërm, faqja
  `/njoftimet` (historia) dhe faqja `/kerkesat/[id]` (detajet e kërkesës, që
  serveri i tregon vetëm udhëtarit të saj ose shoferit pronar).
- Toast-i shfaqet vetëm një herë për çdo ID të re gjatë sesionit të hapur;
  leximi i parë (ose pas Refresh) e ngarkon historinë pa alarme.
- Ripërdorur nga java 10: leximi periodik çdo 5 s me `AbortController`,
  mbrojtja nga përgjigjet e vjetruara (brezi), ngjarjet `online`/`offline`/
  `visibilitychange`, dhe deklarata atomike e pranimit me `FOR UPDATE`.
- Web Push nuk u konfigurua (nuk ka VAPID, as service worker për push).

## Përgatitja
- Udhëtime fiktive: `5` dhe `6` nga java 10, plus `7` (Ferizaj → AAB, 10:45,
  2 vende) i shtuar te `schema-java11.sql` për Rastin 3.
- Migrimi `schema-java11.sql` u ekzekutua në Neon (tabela `njoftimet` ekziston,
  0 rreshta në fillim).
- Sesionet: shoferi pronar në dritare normale, udhëtari në dritare private, që
  të mos ndajnë cookie-n e sesionit. ID-të e llogarive nuk publikohen këtu.
- Përveç kësaj, rregullat e serverit u provuan në Neon brenda një transaksioni
  që u kthye mbrapsht (`ROLLBACK`), me tre profile fiktive (shofer, udhëtar,
  një udhëtar tjetër) dhe udhëtimin `7`.

### Prova 1: Rasti 1 · Përgjigjja bëhet njoftim
- Hapat dhe përgjigjja e shoferit: në provën SQL me `ROLLBACK`: u krijua kërkesa
  fiktive `3` (`ne_pritje`) për udhëtimin `7`; shoferi pronar e pranoi me të
  njëjtën deklaratë që përdor `pranoKerkesen`. Pranimi ndryshoi 1 rresht dhe
  vendet ranë 2 → 1. Prova në dy dritare të shfletuesit ende nuk është bërë.
- Çfarë prisja te udhëtari: 1 njoftim i palexuar, i lidhur me kërkesën e
  pranuar, dhe badge **1** te **Njoftimet** pa Refresh brenda 5 sekondave.
- ID-ja e njoftimit, numri i palexuar dhe çfarë pashë realisht: në SQL u krijua
  saktësisht 1 njoftim për kërkesën `3`, me `marres_id` = udhëtari i kërkesës
  dhe `lexuar_me = NULL`. Pranimi i dytë i së njëjtës kërkesë ndryshoi 0
  rreshta dhe nuk shtoi njoftim. Badge-in dhe toast-in në shfletues ende nuk i
  kam vëzhguar.
- Cila kërkesë u hap dhe çfarë mbeti pas Refresh: ende pa provuar në
  shfletues; njoftimi ruhet në Neon, ndaj pritet të mbetet pas Refresh.

### Prova 2: Rasti 2 · Hapja dhe shënimi si i lexuar
- ID-ja e njoftimit dhe cila kërkesë u hap realisht: në SQL, shënimi u provua
  për njoftimin e kërkesës `3`. Hapja e faqes `/kerkesat/3?njoftim=…` në
  shfletues ende nuk është provuar.
- Numri i palexuar para/pas konfirmimit nga serveri: në SQL 1 → 0 pas
  shënimit nga marrësi. Shënimi i dytë ktheu të njëjtën `lexuar_me` (koha e
  parë nuk ndryshoi). Statusi mbeti `pranuar` dhe vendet mbetën 1: leximi nuk
  prek kërkesën as vendet. Në UI numri ulet vetëm pasi `POST …/lexuar` kthen
  sukses.
- Çfarë mbeti në histori pas kthimit te lista dhe Refresh: njoftimi nuk
  fshihet; vetëm `lexuar_me` plotësohet. Ende pa e vëzhguar në shfletues.
- Nëse provova dështimin e shënimit: çfarë ndodhi dhe si e riprovova: në SQL,
  shënimi nga një udhëtar tjetër ndryshoi 0 rreshta, dhe shënimi me ID-në e
  një kërkese tjetër ndryshoi 0 rreshta (API kthen `404`). Në UI, kur shënimi
  dështon shfaqet **Leximi nuk u ruajt. Njoftimi … mbetet i palexuar.** me
  butonin **Provo përsëri**. Dështimin e rrjetit në shfletues nuk e provova.

### Prova 3: Rasti 3 · Rilidhja pa njoftime të dyfishta
- ID-ja e kërkesës tjetër, dritarja offline dhe hapat: planifikuar me
  udhëtimin `7`: udhëtari dërgon kërkesë, kalon vetëm dritaren e vet në
  DevTools → Network → Offline, shoferi pranon, udhëtari kthehet në No
  throttling. Ende nuk është bërë.
- Çfarë prisja pas rilidhjes dhe pas dy leximeve të tjera: një toast i vetëm
  pas leximit të parë të suksesshëm, numri 1, dhe asnjë toast tjetër në dy
  leximet pasuese (ID-ja tashmë është te lista e ID-ve të njohura).
- Numri i rekordeve, ID-ja e njoftimit dhe alarmet që pashë realisht: në SQL,
  dy pranime të së njëjtës kërkesë dhanë 1 rekord. Toast-et pas rilidhjes ende
  nuk i kam vëzhguar.

## Prova me një hyrje tjetër
- Ende pa u bërë me kolegun. Parashikimi im: nëse kolegu hap
  `/kerkesat/<id>?njoftim=<id>` të një njoftimi që nuk është i tiji, faqja
  thotë **Kërkesa nuk u gjet** dhe njoftimi nuk shënohet. Skedari që e
  kontrollon: `aplikacioni/src/lib/njoftimet.ts` (`lexoKerkesen`,
  `shenoSiTeLexuar`). Në SQL, profili fiktiv i tretë kishte 0 njoftime dhe
  nuk mundi të shënonte njoftimin e tjetrit.

## Ku gjendet kodi dhe çfarë mbetet
- `aplikacioni/schema-java11.sql`: tabela `njoftimet` dhe udhëtimi fiktiv `7`.
- `aplikacioni/src/lib/kerkesat.ts`: `pranoKerkesen` krijon edhe njoftimin
  në të njëjtën deklaratë.
- `aplikacioni/src/lib/njoftimet.ts`: `lexoNjoftimet`, `shenoSiTeLexuar`,
  `lexoKerkesen`.
- `aplikacioni/src/app/api/njoftimet/route.ts`: rruga e leximit (`private, no-store`).
- `aplikacioni/src/app/api/njoftimet/[id]/lexuar/route.ts`: shënimi si i lexuar.
- `aplikacioni/src/components/Njoftimet.tsx`: leximi periodik, numri, toast-i
  një herë për ID.
- `aplikacioni/src/components/ListaNjoftimeve.tsx`, `aplikacioni/src/app/njoftimet/page.tsx`: historia.
- `aplikacioni/src/app/kerkesat/[id]/page.tsx`, `aplikacioni/src/components/ShenimiLexuar.tsx`:
  hapja e kërkesës dhe shënimi pas konfirmimit.
- Kufizime reale: njoftimet krijohen vetëm për pranimin (refuzimi nuk ekziston
  në projekt). Pranimet e javës 10 para migrimit nuk kanë njoftim. Lista e
  ID-ve të njohura mbahet vetëm në memorie, ndaj pas Refresh një njoftim i ri
  që mbërriti ndërkohë shfaqet në listë dhe në numër, por pa toast. Leximi me
  timer vonon deri në 5 s dhe vazhdon edhe kur s'ka ndryshime. Lista kthen
  50 njoftimet e fundit, pra numri i palexuar llogaritet vetëm mbi to.

## Zgjerime opsionale
Për bazën nuk kërkohet Web Push ose refuzim i kërkesës. Nëse i realizove, shëno çfarë provove; përndryshe ky seksion mund të mbetet kështu.

## Ndihma nga AI (Artificial Intelligence — inteligjencë artificiale)
- AI (Claude Code) shkroi skemën, funksionet e serverit, rrugët API, komponentët
  dhe këtë raport. U verifikua: `npm run typecheck` dhe `npm run build` kaluan;
  rregullat e pranimit, njoftimit dhe shënimit u provuan në Neon brenda një
  transaksioni me `ROLLBACK`. Provat në dy dritare të shfletuesit dhe me
  kolegun duhet t'i bëj vetë dhe t'i shënoj më sipër.

## Pas dorëzimit të parë — përditëso më vonë
Ky seksion mund të mbetet kështu në dorëzimin e parë. Pas përgjigjes, shto linkun e Issue-t, commit-in e kontrolluar dhe çfarë duhet korrigjuar. GREEN teknik nuk provon funksionimin. Java 11 është për feedback dhe progres, pa pikë shtesë laboratori.
