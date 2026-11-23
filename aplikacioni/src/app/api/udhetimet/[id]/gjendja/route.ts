import { lexoGjendjen } from "@/lib/kerkesat";

export const dynamic = "force-dynamic";

// Gjendja është personale (varet nga sesioni): nuk ruhet në asnjë cache.
const PA_CACHE = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json(
      { error: "Udhëtimi nuk është i vlefshëm." },
      { status: 400, headers: PA_CACHE },
    );
  }

  try {
    const gjendja = await lexoGjendjen(id);
    if (!gjendja) {
      return Response.json(
        { error: "Udhëtimi nuk u gjet." },
        { status: 404, headers: PA_CACHE },
      );
    }
    return Response.json(gjendja, { headers: PA_CACHE });
  } catch (error) {
    console.error(`Nuk u lexua gjendja e udhëtimit ${id}.`, error);
    return Response.json(
      { error: "Gjendja nuk mund të lexohet tani." },
      { status: 503, headers: PA_CACHE },
    );
  }
}
