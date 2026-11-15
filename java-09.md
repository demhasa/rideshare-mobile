# RideShare — Java 9 · Udhëtimet e preferuara

## Çfarë ndërtova

Shtova ruajtjen e një udhëtimi te të preferuarat për përdoruesin e identifikuar
me GitHub. Klikimi ndryshon pamjen menjëherë në `Po ruhet…`, ndërsa gjendja
quhet e konfirmuar vetëm pasi API-ja kthen sukses. Në gabim ylli dhe numri
rikthehen dhe shfaqet `Provo përsëri`. Klikimet e përsëritura gjatë pritjes
çaktivizohen.

Ruajtja është idempotente: tabela `preferimet` ka çelësin primar të përbërë
nga `github_id` dhe `udhetim_id`, ndërsa `ON CONFLICT DO NOTHING` e bën një
ruajtje të dytë pa krijuar kopje. Identiteti merret nga sesioni në server, jo
nga të dhënat e dërguara nga shfletuesi.

## Provat

### Prova 1 — Ruajtje, sukses dhe rifreskim

Hapa një udhëtim pasi hyra me GitHub, klikova **Ruaj udhëtimin**, prita
konfirmimin e serverit dhe rifreskova faqen. Pamja tregoi **I ruajtur** dhe
numri `1`. Në Neon kontrollova `preferimet` me:

```sql
SELECT github_id, udhetim_id
FROM preferimet
WHERE github_id = 'ID_JOTE_GITHUB' AND udhetim_id = '2';
```

U shfaq një rresht për çiftin e përdoruesit dhe udhëtimit.

### Prova 2 — Refuzim dhe rikthim

Në zhvillim simulova një përgjigje jo të suksesshme të endpoint-it para
shkrimit në databazë. Gjatë pritjes pamja kaloi përkohësisht në **Po ruhet…**;
pas refuzimit ylli u kthye bosh, numri u kthye në `0` dhe u shfaq mesazhi
**Preferimi nuk u ruajt. Provo përsëri.** Pas provës e çaktivizova simulimin.

### Prova 3 — Pa kopje

Klikova disa herë gjatë pritjes dhe kontrollova UI-në dhe databazën. Vetëm
kërkesa e parë vazhdoi; butoni u çaktivizua gjatë pritjes. Pas përfundimit,
çifti `(github_id, udhetim_id)` ekzistoi vetëm një herë dhe numri mbeti `1`.

## Skedarët dhe kufizimet

- `aplikacioni/src/components/Preferimi.tsx` — gjendja optimiste, pritja dhe rollback-u.
- `aplikacioni/src/app/api/preferimet/[id]/route.ts` — endpoint-i i mbrojtur.
- `aplikacioni/src/lib/preferimet.ts` — sesioni, ruajtja idempotente dhe leximi.
- `aplikacioni/schema-java09.sql` — tabela dhe kufizimi unik.
- `aplikacioni/src/app/udhetimi/[id]/page.tsx` — lidhja me pamjen e detajit.

Heqja e preferimit nuk u kërkua dhe nuk u implementua. Nëse përdoruesi nuk
është i identifikuar, serveri kthen `401` dhe UI-ja rikthehet pa ruajtje.
Nuk u ruajtën kredenciale, `.env.local` ose të dhëna personale në repository.

## Ndihma nga AI dhe verifikimi

AI ndihmoi në strukturimin e endpoint-it, kufizimit SQL, gjendjes optimiste
dhe raportit. `npm run typecheck` u ekzekutua pas ndryshimeve; provat e
sjelljes dhe kontrolli i rreshtit në Neon u kryen sipas hapave më sipër.
