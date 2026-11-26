import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";

export type Njoftim = {
  id: string;
  kerkesaId: string;
  lloji: "pranuar";
  teksti: string;
  udhetimi: string;
  krijuarMe: string;
  lexuarMe: string | null;
};

export type ListaNjoftimeve = {
  njoftimet: Njoftim[];
  palexuara: number;
  lexuarMe: string;
};

/** Detajet e kërkesës që hapen nga njoftimi. */
export type DetajetKerkeses = {
  id: string;
  statusi: "ne_pritje" | "pranuar";
  udhetimId: string;
  nisja: string;
  destinacioni: string;
  ora: string;
  vende: number;
  shoferi: string;
  udhetari: string;
};

function eshteId(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

export async function githubIdNgaSesioni(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  return eshteId(id) ? id : null;
}

function iso(value: unknown): string {
  const data = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(data.getTime())) throw new Error("Databaza ktheu një datë të pavlefshme.");
  return data.toISOString();
}

function mapNjoftim(row: Record<string, unknown>): Njoftim {
  const { id, kerkesa_id, lloji, shoferi, nisja, destinacioni, ora, krijuar_me, lexuar_me } = row;
  if (
    !eshteId(id) ||
    !eshteId(kerkesa_id) ||
    lloji !== "pranuar" ||
    typeof nisja !== "string" ||
    typeof destinacioni !== "string" ||
    typeof ora !== "string"
  ) {
    throw new Error("Databaza ktheu një njoftim të pavlefshëm.");
  }
  const emri = typeof shoferi === "string" && shoferi ? shoferi : "Shoferi";
  return {
    id,
    kerkesaId: kerkesa_id,
    lloji,
    teksti: `${emri} e pranoi kërkesën tënde`,
    udhetimi: `${nisja} – ${destinacioni} · ${ora}`,
    krijuarMe: iso(krijuar_me),
    lexuarMe: lexuar_me === null || lexuar_me === undefined ? null : iso(lexuar_me),
  };
}

/**
 * Vetëm lexim: kthen njoftimet e përdoruesit të sesionit. Nuk krijon dhe nuk
 * shënon asgjë; njoftimet e udhëtarëve të tjerë nuk kthehen kurrë.
 */
export async function lexoNjoftimet(uneId: string): Promise<ListaNjoftimeve> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      n.id::text AS id,
      n.kerkesa_id::text AS kerkesa_id,
      n.lloji,
      n.krijuar_me,
      n.lexuar_me,
      u.nisja,
      u.destinacioni,
      u.ora,
      s.emri AS shoferi
    FROM njoftimet n
    JOIN kerkesat k ON k.id = n.kerkesa_id
    JOIN udhetimet u ON u.id = k.udhetim_id
    LEFT JOIN profilet s ON s.github_id = u.shofer_id
    WHERE n.marres_id = ${uneId}
    ORDER BY n.krijuar_me DESC, n.id DESC
    LIMIT 50
  `;
  const njoftimet = rows.map((row) => mapNjoftim(row as Record<string, unknown>));
  return {
    njoftimet,
    palexuara: njoftimet.filter((n) => n.lexuarMe === null).length,
    lexuarMe: new Date().toISOString(),
  };
}

/**
 * Shënon si të lexuar vetëm njoftimin e marrësit të sesionit dhe vetëm për
 * kërkesën me të cilën është lidhur. ID-ja e njoftimit vetë nuk është leje.
 * Leximi i përsëritur mban kohën e parë dhe nuk prek kërkesën ose vendet.
 */
export async function shenoSiTeLexuar(
  njoftimId: string,
  kerkesaId: string | null,
): Promise<{ id: string; lexuarMe: string } | "hyr" | "mungon"> {
  const uneId = await githubIdNgaSesioni();
  if (!uneId) return "hyr";
  if (!eshteId(njoftimId) || (kerkesaId !== null && !eshteId(kerkesaId))) return "mungon";

  const sql = getSql();
  const rows = await sql`
    UPDATE njoftimet
    SET lexuar_me = COALESCE(lexuar_me, NOW())
    WHERE id = ${njoftimId}
      AND marres_id = ${uneId}
      AND (${kerkesaId}::bigint IS NULL OR kerkesa_id = ${kerkesaId}::bigint)
    RETURNING id::text AS id, lexuar_me
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return "mungon";
  return { id: String(row.id), lexuarMe: iso(row.lexuar_me) };
}

/**
 * Kërkesa hapet vetëm nëse ky sesion është udhëtari i saj ose shoferi pronar
 * i udhëtimit. Përndryshe kthehet null, njësoj si kur kërkesa nuk ekziston.
 */
export async function lexoKerkesen(
  kerkesaId: string,
  uneId: string,
): Promise<DetajetKerkeses | null> {
  if (!eshteId(kerkesaId)) return null;
  const sql = getSql();
  const rows = await sql`
    SELECT
      k.id::text AS id,
      k.statusi,
      u.id AS udhetim_id,
      u.nisja,
      u.destinacioni,
      u.ora,
      u.vende,
      s.emri AS shoferi,
      p.emri AS udhetari
    FROM kerkesat k
    JOIN udhetimet u ON u.id = k.udhetim_id
    JOIN profilet p ON p.github_id = k.udhetar_id
    LEFT JOIN profilet s ON s.github_id = u.shofer_id
    WHERE k.id = ${kerkesaId}
      AND (k.udhetar_id = ${uneId} OR u.shofer_id = ${uneId})
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const vende = Number(row.vende);
  if (
    (row.statusi !== "ne_pritje" && row.statusi !== "pranuar") ||
    !Number.isInteger(vende) ||
    vende < 0
  ) {
    throw new Error("Databaza ktheu një kërkesë të pavlefshme.");
  }
  return {
    id: String(row.id),
    statusi: row.statusi,
    udhetimId: String(row.udhetim_id),
    nisja: String(row.nisja),
    destinacioni: String(row.destinacioni),
    ora: String(row.ora),
    vende,
    shoferi: typeof row.shoferi === "string" ? row.shoferi : "Shoferi",
    udhetari: String(row.udhetari),
  };
}
