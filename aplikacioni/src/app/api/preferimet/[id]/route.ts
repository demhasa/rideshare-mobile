import { ruajPreferim } from "@/lib/preferimet";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "Udhëtimi nuk është i vlefshëm." }, { status: 400 });
  }

  try {
    const result = await ruajPreferim(id);
    if (result === "hyr") {
      return Response.json(
        { error: "Hyr në llogari para se të ruash preferimin." },
        { status: 401 },
      );
    }
    if (result === "mungon") {
      return Response.json({ error: "Udhëtimi nuk u gjet." }, { status: 404 });
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(`Nuk u ruajt preferimi për udhëtimin ${id}.`, error);
    return Response.json(
      { error: "Preferimi nuk u ruajt. Provo përsëri." },
      { status: 503 },
    );
  }
}
