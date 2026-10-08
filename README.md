# rideshare-mobile

## RideShare — Java 4

Projekt mësimor Next.js për listën e udhëtimeve, detajet dhe një kërkesë të
simuluar. Lista dhe detajet lexohen nga PostgreSQL në Neon. Të gjitha të
dhënat janë fiktive; aplikacioni nuk bën rezervime reale.

### Projekti live

Mund ta kontrollosh aplikacionin këtu: [rideshare-mobile-ten.vercel.app](https://rideshare-mobile-ten.vercel.app/).

### Nisja e aplikacionit

Instalo Node.js dhe npm, pastaj nga dosja `aplikacioni/` ekzekuto:

```bash
npm install
npm run dev
```

Para nisjes, krijo `aplikacioni/.env.local` me variablën `DATABASE_URL` nga
Neon. Ekzekuto [schema.sql](./aplikacioni/schema.sql) në Neon SQL Editor.
Mos dërgo `.env.local` në GitHub; ai tashmë përjashtohet nga `.gitignore`.

Hap adresën që shfaq terminali (zakonisht `http://localhost:3000`). Raportet
janë te [java-03.md](./java-03.md) dhe [java-04.md](./java-04.md), pranë
README dhe jashtë dosjes `aplikacioni/`.