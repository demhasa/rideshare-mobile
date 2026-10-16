import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";

export type Profil = {
  id: string;
  emri: string;
  roli: "udhetar" | "shofer";
};

function eshteProfil(value: unknown): value is Profil {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    /^\d+$/.test(row.id) &&
    typeof row.emri === "string" &&
    (row.roli === "udhetar" || row.roli === "shofer")
  );
}

export async function profiliIm(): Promise<Profil | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || !/^\d+$/.test(id)) return null;

  const sql = getSql();
  await sql`
    INSERT INTO profilet (github_id, emri)
    VALUES (${id}, ${session.user.name ?? "Student"})
    ON CONFLICT (github_id) DO NOTHING
  `;
  const rows = await sql`
    SELECT github_id AS id, emri, roli
    FROM profilet
    WHERE github_id = ${id}
  `;
  const profile = rows[0];

  if (!eshteProfil(profile)) {
    throw new Error("Profili i përdoruesit në databazë është i pavlefshëm.");
  }

  return profile;
}

export async function ndryshoOren(
  id: string,
  ora: string,
): Promise<"hyr" | "ndaluar" | "fushe" | "ruajtur"> {
  const profil = await profiliIm();
  if (!profil) return "hyr";
  if (profil.roli !== "shofer") return "ndaluar";
  if (!/^\d+$/.test(id) || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(ora)) {
    return "fushe";
  }

  const sql = getSql();
  const rows = await sql`
    UPDATE udhetimet
    SET ora = ${ora}
    WHERE id = ${id}
      AND shofer_id = ${profil.id}
      AND EXISTS (
        SELECT 1
        FROM profilet
        WHERE github_id = ${profil.id} AND roli = 'shofer'
      )
    RETURNING id
  `;

  return rows.length === 1 ? "ruajtur" : "ndaluar";
}
