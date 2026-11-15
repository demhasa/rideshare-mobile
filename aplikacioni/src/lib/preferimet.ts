import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";
import { profiliIm } from "./lejet";

export type GjendjaPreferimit = {
  ruajtur: boolean;
  numer: number;
};

function lexojNumer(value: unknown): number {
  const numer = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numer) || numer < 0) {
    throw new Error("Databaza ktheu një numër të pavlefshëm preferimesh.");
  }
  return numer;
}

export async function gjendjaPreferimit(
  udhetimId: string,
): Promise<GjendjaPreferimit> {
  const session = await getServerSession(authOptions);
  const githubId = session?.user?.id;
  if (!githubId || !/^\d+$/.test(githubId)) {
    return { ruajtur: false, numer: 0 };
  }

  const sql = getSql();
  const rows = await sql`
    SELECT
      EXISTS (
        SELECT 1
        FROM preferimet
        WHERE github_id = ${githubId} AND udhetim_id = ${udhetimId}
      ) AS ruajtur,
      COUNT(*)::int AS numer
    FROM preferimet
    WHERE github_id = ${githubId}
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row || typeof row.ruajtur !== "boolean") {
    throw new Error("Databaza ktheu gjendje të pavlefshme preferimi.");
  }

  return { ruajtur: row.ruajtur, numer: lexojNumer(row.numer) };
}

export async function ruajPreferim(
  udhetimId: string,
): Promise<GjendjaPreferimit | "hyr" | "mungon"> {
  const profil = await profiliIm();
  if (!profil) return "hyr";

  const sql = getSql();
  const udhetimi = await sql`
    SELECT 1 FROM udhetimet WHERE id = ${udhetimId}
  `;
  if (udhetimi.length === 0) return "mungon";

  await sql`
    INSERT INTO preferimet (github_id, udhetim_id)
    VALUES (${profil.id}, ${udhetimId})
    ON CONFLICT (github_id, udhetim_id) DO NOTHING
  `;

  return gjendjaPreferimit(udhetimId);
}
