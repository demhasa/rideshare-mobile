import { lexoUdhetimet } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await lexoUdhetimet();
    const trips = rows.map(({ id, nisja, destinacioni, ora, vendtakimi, vende }) => ({
      id,
      nisja,
      destinacioni,
      ora,
      vendtakimi,
      vende,
    }));
    return Response.json({ trips }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Nuk u lexua lista publike e udhëtimeve.", error);
    return Response.json(
      { error: "Lista nuk mund të lexohet tani." },
      { status: 503 },
    );
  }
}
