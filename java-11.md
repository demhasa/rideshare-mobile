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
- Hapat dhe përgjigjja e shoferit: udhëtari dërgoi kërkesë te udhëtimi fiktiv
  (në pritje); shoferi pronar, në dritaren normale, klikoi **Prano kërkesën** dhe
  pa **Pranimi u ruajt**; vendet ranë me 1.
- Çfarë prisja te udhëtari: 1 njoftim i palexuar, i lidhur me atë kërkesë, pa
  Refresh manual.
- ID-ja e njoftimit, numri i palexuar dhe çfarë pashë realisht: te dritarja
  private e udhëtarit, brenda 5 sekondave, butoni **Njoftimet** tregoi **1**
  dhe u shfaq një toast **… e pranoi kërkesën tënde**. Në Neon kishte një
  rekord të vetëm për atë kërkesë me `lexuar_me = NULL`. Prova SQL me
  `ROLLBACK` konfirmoi se pranimi i dytë nuk shton rekord.
- Cila kërkesë u hap dhe çfarë mbeti pas Refresh: pas Refresh njoftimi mbeti në
  `/njoftimet` si i palexuar, pa toast të ri.

### Prova 2: Rasti 2 · Hapja dhe shënimi si i lexuar
- ID-ja e njoftimit dhe cila kërkesë u hap realisht: klikimi i njoftimit hapi
  `/kerkesat/<id>` të së njëjtës kërkesë, me statusin **U pranua** dhe vendet e
  mbetura.
- Numri i palexuar para/pas konfirmimit nga serveri: 1 para; pas mesazhit
  **Njoftimi … u shënua si i lexuar** numri u bë 0.
- Çfarë mbeti në histori pas kthimit te lista dhe Refresh: njoftimi mbeti në
  listë si **E lexuar**; numri mbeti 0 edhe pas Refresh.
- Nëse provova dështimin e shënimit: çfarë ndodhi dhe si e riprovova: Nuk e
  provova këtë skenar shtesë në shfletues. Në SQL, shënimi nga një udhëtar
  tjetër ose me kërkesë tjetër ndryshoi 0 rreshta.

### Prova 3: Rasti 3 · Rilidhja pa njoftime të dyfishta
- ID-ja e kërkesës tjetër, dritarja offline dhe hapat: kërkesë e re te udhëtimi
  `7`; vetëm dritarja e udhëtarit në DevTools → Network → Offline; shoferi
  pranoi; pastaj No throttling.
- Çfarë prisja pas rilidhjes dhe pas dy leximeve të tjera: një toast i vetëm,
  numri 1, pa toast në leximet pasuese.
- Numri i rekordeve, ID-ja e njoftimit dhe alarmet që pashë realisht: pas
  rilidhjes, pa Refresh, erdhi njoftimi i humbur me një toast; dy leximet e
  tjera e mbajtën numrin 1 pa toast të dytë; në Neon një rekord i vetëm për
  atë kërkesë.

## Prova me një hyrje tjetër
- Parashikimi im: një llogari tjetër që hap `/kerkesat/<id>?njoftim=<id>` të
  një njoftimi që nuk është i saj sheh **Kërkesa nuk u gjet** dhe njoftimi nuk
  shënohet. Vëzhgimi: kështu ndodhi. Skedari që e kontrollon:
  `aplikacioni/src/lib/njoftimet.ts` (`lexoKerkesen`, `shenoSiTeLexuar`).

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
  transaksioni me `ROLLBACK`. Tri rastet në dy dritare (normale dhe
  private) i provova vetë.

## Pas dorëzimit të parë — përditëso më vonë
Ky seksion mund të mbetet kështu në dorëzimin e parë. Pas përgjigjes, shto linkun e Issue-t, commit-in e kontrolluar dhe çfarë duhet korrigjuar. GREEN teknik nuk provon funksionimin. Java 11 është për feedback dhe progres, pa pikë shtesë laboratori.
