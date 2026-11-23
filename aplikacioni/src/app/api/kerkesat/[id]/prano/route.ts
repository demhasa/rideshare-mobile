import { pranoKerkesen } from "@/lib/kerkesat";

export const dynamic = "force-dynamic";

const PA_CACHE = { "Cache-Control": "no-store" };

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "Kërkesa nuk është e vlefshme." }, { status: 400 });
  }

  try {
    const result = await pranoKerkesen(id);
    if (result === "hyr") {
      return Response.json(
        { error: "Hyr në llogari para se të pranosh kërkesën." },
        { status: 401 },
      );
    }
    if (result === "ndaluar") {
      return Response.json(
        { error: "Vetëm shoferi pronar mund ta pranojë këtë kërkesë." },
        { status: 403 },
      );
    }
    if (result === "plot") {
      return Response.json(
        { error: "Nuk ka vende të lira. Kërkesa nuk u pranua." },
        { status: 409 },
      );
    }
    return Response.json(result, { headers: PA_CACHE });
  } catch (error) {
    console.error(`Nuk u pranua kërkesa ${id}.`, error);
    return Response.json(
      { error: "Pranimi nuk u ruajt. Provo përsëri." },
      { status: 503 },
    );
  }
}
