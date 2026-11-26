import { shenoSiTeLexuar } from "@/lib/njoftimet";

export const dynamic = "force-dynamic";

const PA_CACHE = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const kerkesa = new URL(request.url).searchParams.get("kerkesa");
  if (!/^\d+$/.test(id) || (kerkesa !== null && !/^\d+$/.test(kerkesa))) {
    return Response.json(
      { error: "Njoftimi nuk është i vlefshëm." },
      { status: 400, headers: PA_CACHE },
    );
  }

  try {
    const result = await shenoSiTeLexuar(id, kerkesa);
    if (result === "hyr") {
      return Response.json(
        { error: "Hyr në llogari për të hapur njoftimin." },
        { status: 401, headers: PA_CACHE },
      );
    }
    if (result === "mungon") {
      // E njëjta përgjigje kur njoftimi nuk ekziston ose i përket dikujt tjetër.
      return Response.json(
        { error: "Njoftimi nuk u gjet." },
        { status: 404, headers: PA_CACHE },
      );
    }
    return Response.json(result, { headers: PA_CACHE });
  } catch (error) {
    console.error(`Nuk u shënua si i lexuar njoftimi ${id}.`, error);
    return Response.json(
      { error: "Leximi nuk u ruajt. Njoftimi mbetet i palexuar; provo përsëri." },
      { status: 503, headers: PA_CACHE },
    );
  }
}
