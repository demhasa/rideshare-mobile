import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";

export type Kerkese = {
  id: number;
  udhetimId: string;
  udhetariId: string;
  udhetari: string;
  status: "ne_pritje" | "e_pranuar";
};

async function sessionId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  return id && /^\d+$/.test(id) ? id : null;
}

export async function lexGjendjen(id: string) {
  const userId = await sessionId();
  const sql = getSql();
  const trips = await sql`
    SELECT id, vende, shofer_id
    FROM udhetimet WHERE id = ${id}
  `;
  if (trips.length === 0) return null;

  const trip = trips[0] as Record<string, unknown>;
  const seats = Number(trip.vende);
  const ownerId = typeof trip.shofer_id === "string" ? trip.shofer_id : null;
  const isOwner = Boolean(userId && ownerId === userId);

  const ownRows = userId ? await sql`
    SELECT k.id, k.udhetim_id, k.udhetari_id, k.status, p.emri
    FROM kerkesa k
    JOIN profilet p ON p.github_id = k.udhetari_id
    WHERE k.udhetim_id = ${id} AND k.udhetari_id = ${userId}
  ` : [];

  const driverRows = isOwner ? await sql`
    SELECT k.id, k.udhetim_id, k.udhetari_id, k.status, p.emri
    FROM kerkesa k
    JOIN profilet p ON p.github_id = k.udhetari_id
    WHERE k.udhetim_id = ${id}
    ORDER BY k.krijuar_me ASC
  ` : [];

  const map = (row: Record<string, unknown>): Kerkese => ({
    id: Number(row.id),
    udhetimId: String(row.udhetim_id),
    udhetariId: String(row.udhetari_id),
    udhetari: String(row.emri),
    status: row.status === "e_pranuar" ? "e_pranuar" : "ne_pritje",
  });

  return {
    tripId: id,
    vende: seats,
    userId,
    isOwner,
    own: ownRows.length ? map(ownRows[0] as Record<string, unknown>) : null,
    requests: driverRows.map((row) => map(row as Record<string, unknown>)),
  };
}

export async function krijoKerkese(id: string): Promise<"hyr" | "mungon" | "plot" | "ruajtur"> {
  const userId = await sessionId();
  if (!userId) return "hyr";
  const sql = getSql();

  await sql`INSERT INTO profilet (github_id, emri) VALUES (${userId}, 'Student') ON CONFLICT (github_id) DO NOTHING`;
  const tripRows = await sql`SELECT vende FROM udhetimet WHERE id = ${id}`;
  if (tripRows.length === 0) return "mungon";
  if (Number(tripRows[0].vende) <= 0) return "plot";

  await sql`
    INSERT INTO kerkesa (udhetim_id, udhetari_id)
    VALUES (${id}, ${userId})
    ON CONFLICT (udhetim_id, udhetari_id) DO NOTHING
  `;
  return "ruajtur";
}

export async function pranoKerkese(requestId: number): Promise<"hyr" | "ndaluar" | "mungon" | "plot" | "ruajtur"> {
  const userId = await sessionId();
  if (!userId) return "hyr";
  const sql = getSql();

  const existing = await sql`
    SELECT k.id, k.status, k.udhetim_id, u.shofer_id, u.vende
    FROM kerkesa k
    JOIN udhetimet u ON u.id = k.udhetim_id
    WHERE k.id = ${requestId}
  `;
  if (existing.length === 0) return "mungon";
  const row = existing[0] as Record<string, unknown>;
  if (row.shofer_id !== userId) return "ndaluar";
  if (row.status !== "ne_pritje") return "ruajtur";
  if (Number(row.vende) <= 0) return "plot";

  const result = await sql`
    WITH updated_trip AS (
      UPDATE udhetimet u
      SET vende = u.vende - 1
      FROM kerkesa k
      WHERE k.id = ${requestId}
        AND k.status = 'ne_pritje'
        AND k.udhetim_id = u.id
        AND u.shofer_id = ${userId}
        AND u.vende > 0
      RETURNING u.id
    ), updated_request AS (
      UPDATE kerkesa k
      SET status = 'e_pranuar', perditesuar_me = NOW()
      FROM updated_trip t
      WHERE k.id = ${requestId} AND k.udhetim_id = t.id
      RETURNING k.id
    )
    SELECT COUNT(*)::int AS u_pranuar FROM updated_request
  `;
  return Number((result[0] as Record<string, unknown>).u_pranuar) === 1 ? "ruajtur" : "mungon";
}
