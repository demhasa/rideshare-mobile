import { lexGjendjen, krijoKerkese, pranoKerkese } from "@/lib/kerkesa";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const state = await lexGjendjen(id);
    if (!state) return Response.json({ error: "UDHETIM_MUNGON" }, { status: 404 });
    return Response.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Nuk u lexua gjendja e kërkesës.", error);
    return Response.json({ error: "SHERBYTORI" }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json() as { kerkesaId?: number; veprim?: string };
    if (body.veprim === "prano" && body.kerkesaId) {
      const result = await pranoKerkese(body.kerkesaId);
      const status = result === "hyr" ? 401 : result === "ndaluar" ? 403 : result === "mungon" ? 404 : result === "plot" ? 409 : 200;
      return Response.json(result === "ruajtur" ? { ok: true } : { error: result }, { status });
    }
    const result = await krijoKerkese(id);
    if (result === "hyr") return Response.json({ error: result }, { status: 401 });
    if (result === "mungon") return Response.json({ error: result }, { status: 404 });
    if (result === "plot") return Response.json({ error: result }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Nuk u krye veprimi i kërkesës.", error);
    return Response.json({ error: "SHERBYTORI" }, { status: 503 });
  }
}
