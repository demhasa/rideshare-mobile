import { dergoKerkesen } from "@/lib/kerkesat";

export const dynamic = "force-dynamic";

const PA_CACHE = { "Cache-Control": "no-store" };

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "Udhëtimi nuk është i vlefshëm." }, { status: 400 });
  }

  try {
    const result = await dergoKerkesen(id);
    if (result === "hyr") {
      return Response.json(
        { error: "Hyr në llogari para se të kërkosh një vend." },
        { status: 401 },
      );
    }
    if (result === "mungon") {
      return Response.json({ error: "Udhëtimi nuk u gjet." }, { status: 404 });
    }
    if (result === "pronar") {
      return Response.json(
        { error: "Nuk mund të kërkosh vend në udhëtimin tënd." },
        { status: 403 },
      );
    }
    if (result === "plot") {
      return Response.json({ error: "Nuk ka më vende të lira." }, { status: 409 });
    }
    return Response.json(result, { headers: PA_CACHE });
  } catch (error) {
    console.error(`Nuk u ruajt kërkesa për udhëtimin ${id}.`, error);
    return Response.json(
      { error: "Kërkesa nuk u dërgua. Provo përsëri." },
      { status: 503 },
    );
  }
}
