import { githubIdNgaSesioni, lexoNjoftimet } from "@/lib/njoftimet";

export const dynamic = "force-dynamic";

// Njoftimet janë personale (varen nga sesioni): nuk ruhen në asnjë cache.
const PA_CACHE = { "Cache-Control": "private, no-store", Vary: "Cookie" };

/** Vetëm lexim: kjo rrugë nuk krijon dhe nuk shënon njoftime. */
export async function GET() {
  try {
    const uneId = await githubIdNgaSesioni();
    if (!uneId) {
      return Response.json(
        { error: "Hyr në llogari për të parë njoftimet." },
        { status: 401, headers: PA_CACHE },
      );
    }
    return Response.json(await lexoNjoftimet(uneId), { headers: PA_CACHE });
  } catch (error) {
    console.error("Nuk u lexuan njoftimet.", error);
    return Response.json(
      { error: "Njoftimet nuk mund të lexohen tani." },
      { status: 503, headers: PA_CACHE },
    );
  }
}
