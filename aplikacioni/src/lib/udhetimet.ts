import "server-only";
import { getSql } from "./db";

export type Udhetim = {
  id: string;
  nisja: string;
  destinacioni: string;
  ora: string;
  vendtakimi: string;
  vende: number;
};

function mapUdhetim(row: Record<string, unknown>): Udhetim {
  const { id, nisja, destinacioni, ora, vendtakimi, vende } = row;
  if (
    typeof id !== "string" ||
    typeof nisja !== "string" ||
    typeof destinacioni !== "string" ||
    typeof ora !== "string" ||
    typeof vendtakimi !== "string" ||
    typeof vende !== "number" ||
    !Number.isInteger(vende) ||
    vende < 0
  ) {
    throw new Error("Databaza ktheu një udhëtim me të dhëna të pavlefshme.");
  }

  return { id, nisja, destinacioni, ora, vendtakimi, vende };
}

export async function lexoUdhetimet(): Promise<Udhetim[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, nisja, destinacioni, ora, vendtakimi, vende
    FROM udhetimet ORDER BY id
  `;
  return rows.map(mapUdhetim);
}

export async function gjejUdhetimin(id: string): Promise<Udhetim | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, nisja, destinacioni, ora, vendtakimi, vende
    FROM udhetimet WHERE id = ${id}
  `;
  return rows.length > 0 ? mapUdhetim(rows[0]) : undefined;
}
