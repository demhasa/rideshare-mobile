import { krijoKerkese, lexGjendjen } from "@/lib/kerkesa";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("udhetimId") ?? "";
  if (!id) return Response.json({ error: "UDHETIM_MUNGON" }, { status: 400 });
  try {
    const state = await lexGjendjen(id);
    if (!state) return Response.json({ error: "UDHETIM_MUNGON" }, { status: 404 });
    return Response.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Nuk u lexua gjendja e kërkesës.", error);
    return Response.json({ error: "SHERBYTORI" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { udhetimId?: string };
    const id = body.udhetimId;
    if (!id) return Response.json({ error: "UDHETIM_MUNGON" }, { status: 400 });
    const result = await krijoKerkese(id);
    if (result === "hyr") return Response.json({ error: result }, { status: 401 });
    if (result === "mungon") return Response.json({ error: result }, { status: 404 });
    if (result === "plot") return Response.json({ error: result }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Nuk u ruajt kërkesa.", error);
    return Response.json({ error: "SHERBYTORI" }, { status: 503 });
  }
}
