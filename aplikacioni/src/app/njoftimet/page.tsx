import Link from "next/link";
import { ListaNjoftimeve } from "@/components/ListaNjoftimeve";
import { Navigimi } from "@/components/Navigimi";
import { githubIdNgaSesioni } from "@/lib/njoftimet";

export const dynamic = "force-dynamic";

export const metadata = { title: "Njoftimet" };

export default async function Njoftimet() {
  const uneId = await githubIdNgaSesioni();

  return (
    <main className="app-shell">
      <Navigimi />
      <Link className="back-link" href="/">
        ← Të gjitha udhëtimet
      </Link>
      <section className="detail-card">
        <p className="eyebrow eyebrow-dark">NJOFTIMET E MIA</p>
        <h1>Përgjigjet e shoferëve</h1>
        {uneId ? (
          <ListaNjoftimeve />
        ) : (
          <div className="sync-request">
            <p className="helper-copy">Hyr me GitHub për të parë njoftimet e tua.</p>
            <Link className="button button-secondary" href="/panel">
              Hyr
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
