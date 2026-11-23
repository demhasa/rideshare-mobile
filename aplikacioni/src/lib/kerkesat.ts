import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";
import { profiliIm } from "./lejet";

export type StatusiKerkeses = "ne_pritje" | "pranuar";

export type Kerkesa = {
  id: string;
  statusi: StatusiKerkeses;
  udhetari: string;
};

/**
 * Pamja që ky sesion ka të drejtë të shohë për një udhëtim.
 * - shoferi pronar sheh të gjitha kërkesat e udhëtimit të vet;
 * - udhëtari sheh vetëm kërkesën e vet;
 * - vizitori pa hyrje sheh vetëm vendet e lira.
 */
export type GjendjaUdhetimit = {
  udhetimId: string;
  vende: number;
  roli: "shofer" | "udhetar" | "vizitor";
  kerkesaIme: Kerkesa | null;
  kerkesat: Kerkesa[];
  lexuarMe: string;
};

export type RezultatiDergimit =
  | GjendjaUdhetimit
  | "hyr"
  | "mungon"
  | "pronar"
  | "plot";

export type RezultatiPranimit =
  | { rezultati: "pranuar" | "pranuar_me_pare"; gjendja: GjendjaUdhetimit }
  | "hyr"
  | "ndaluar"
  | "plot";

function eshteId(value: string | undefined | null): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

function lexoVende(value: unknown): number {
  const numer = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numer) || numer < 0) {
    throw new Error("Databaza ktheu një numër të pavlefshëm vendesh.");
  }
  return numer;
}

function mapKerkese(row: Record<string, unknown>): Kerkesa {
  const { id, statusi, udhetari } = row;
  if (
    (typeof id !== "string" && typeof id !== "number") ||
    (statusi !== "ne_pritje" && statusi !== "pranuar") ||
    typeof udhetari !== "string"
  ) {
    throw new Error("Databaza ktheu një kërkesë të pavlefshme.");
  }
  return { id: String(id), statusi, udhetari };
}

async function githubIdNgaSesioni(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  return eshteId(id) ? id : null;
}

/** Vetëm lexim: nuk krijon, nuk pranon dhe nuk ndryshon asgjë. */
export async function lexoGjendjen(
  udhetimId: string,
  githubId?: string | null,
): Promise<GjendjaUdhetimit | null> {
  const uneId = githubId === undefined ? await githubIdNgaSesioni() : githubId;
  const sql = getSql();

  const udhetimet = await sql`
    SELECT
      u.vende,
      (u.shofer_id IS NOT NULL AND u.shofer_id = ${uneId} AND p.roli = 'shofer')
        AS jam_pronar
    FROM udhetimet u
    LEFT JOIN profilet p ON p.github_id = u.shofer_id
    WHERE u.id = ${udhetimId}
  `;
  const udhetimi = udhetimet[0] as Record<string, unknown> | undefined;
  if (!udhetimi) return null;

  const gjendja: GjendjaUdhetimit = {
    udhetimId,
    vende: lexoVende(udhetimi.vende),
    roli: !uneId ? "vizitor" : udhetimi.jam_pronar === true ? "shofer" : "udhetar",
    kerkesaIme: null,
    kerkesat: [],
    lexuarMe: new Date().toISOString(),
  };

  if (gjendja.roli === "shofer") {
    const rows = await sql`
      SELECT k.id::text AS id, k.statusi, p.emri AS udhetari
      FROM kerkesat k
      JOIN profilet p ON p.github_id = k.udhetar_id
      WHERE k.udhetim_id = ${udhetimId}
      ORDER BY k.krijuar_me, k.id
    `;
    gjendja.kerkesat = rows.map((row) => mapKerkese(row as Record<string, unknown>));
  } else if (gjendja.roli === "udhetar") {
    const rows = await sql`
      SELECT k.id::text AS id, k.statusi, p.emri AS udhetari
      FROM kerkesat k
      JOIN profilet p ON p.github_id = k.udhetar_id
      WHERE k.udhetim_id = ${udhetimId} AND k.udhetar_id = ${uneId}
    `;
    gjendja.kerkesaIme = rows[0] ? mapKerkese(rows[0] as Record<string, unknown>) : null;
  }

  return gjendja;
}

/**
 * Udhëtari i identifikuar kërkon një vend. Identiteti merret nga sesioni.
 * Kërkesa e dytë për të njëjtin udhëtim nuk krijon kopje (UNIQUE + ON CONFLICT).
 */
export async function dergoKerkesen(udhetimId: string): Promise<RezultatiDergimit> {
  const profil = await profiliIm();
  if (!profil) return "hyr";

  const sql = getSql();
  const udhetimet = await sql`
    SELECT vende, shofer_id FROM udhetimet WHERE id = ${udhetimId}
  `;
  const udhetimi = udhetimet[0] as Record<string, unknown> | undefined;
  if (!udhetimi) return "mungon";
  if (udhetimi.shofer_id === profil.id) return "pronar";

  await sql`
    INSERT INTO kerkesat (udhetim_id, udhetar_id)
    SELECT id, ${profil.id}
    FROM udhetimet
    WHERE id = ${udhetimId} AND vende > 0
    ON CONFLICT (udhetim_id, udhetar_id) DO NOTHING
  `;

  const gjendja = await lexoGjendjen(udhetimId, profil.id);
  if (!gjendja) return "mungon";
  // Nuk u krijua kërkesë dhe nuk ka ndonjë të mëparshme: udhëtimi është plot.
  if (!gjendja.kerkesaIme) return "plot";
  return gjendja;
}

/**
 * Shoferi pronar pranon një kërkesë. Statusi dhe vendet ndryshojnë në një
 * deklaratë të vetme SQL (një transaksion):
 * - vetëm kërkesa "ne_pritje" kalon në "pranuar", prandaj pranimi i dytë
 *   nuk e ul numrin përsëri;
 * - vendet ulen vetëm kur vende > 0, prandaj nuk bëhen negative;
 * - FOR UPDATE bën që dy pranime të njëkohshme të radhiten.
 */
export async function pranoKerkesen(kerkesaId: string): Promise<RezultatiPranimit> {
  const profil = await profiliIm();
  if (!profil) return "hyr";
  if (profil.roli !== "shofer") return "ndaluar";

  const sql = getSql();
  const ndryshuar = await sql`
    WITH kerkesa AS (
      SELECT k.id, k.udhetim_id
      FROM kerkesat k
      JOIN udhetimet u ON u.id = k.udhetim_id
      WHERE k.id = ${kerkesaId}
        AND k.statusi = 'ne_pritje'
        AND u.shofer_id = ${profil.id}
      FOR UPDATE OF k
    ),
    vendi AS (
      UPDATE udhetimet
      SET vende = vende - 1
      WHERE id = (SELECT udhetim_id FROM kerkesa) AND vende > 0
      RETURNING id
    )
    UPDATE kerkesat
    SET statusi = 'pranuar', pranuar_me = NOW()
    WHERE id = (SELECT id FROM kerkesa)
      AND EXISTS (SELECT 1 FROM vendi)
    RETURNING udhetim_id
  `;

  if (ndryshuar.length === 1) {
    const udhetimId = String((ndryshuar[0] as Record<string, unknown>).udhetim_id);
    const gjendja = await lexoGjendjen(udhetimId, profil.id);
    if (!gjendja) return "ndaluar";
    return { rezultati: "pranuar", gjendja };
  }

  // Asnjë ndryshim: gjej arsyen pa ndryshuar asgjë.
  const rows = await sql`
    SELECT k.statusi, k.udhetim_id, u.vende
    FROM kerkesat k
    JOIN udhetimet u ON u.id = k.udhetim_id
    WHERE k.id = ${kerkesaId} AND u.shofer_id = ${profil.id}
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return "ndaluar";
  if (row.statusi === "pranuar") {
    const gjendja = await lexoGjendjen(String(row.udhetim_id), profil.id);
    if (!gjendja) return "ndaluar";
    return { rezultati: "pranuar_me_pare", gjendja };
  }
  return "plot";
}
