import Link from "next/link";
import { Navigimi } from "@/components/Navigimi";
import { ShenimiLexuar } from "@/components/ShenimiLexuar";
import { githubIdNgaSesioni, lexoKerkesen, type DetajetKerkeses } from "@/lib/njoftimet";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kërkesa" };

function Mesazh({ titulli, teksti }: { titulli: string; teksti: string }) {
  return (
    <main className="app-shell">
      <Navigimi />
      <section className="message-card">
        <p className="eyebrow">KËRKESA</p>
        <h1>{titulli}</h1>
        <p role="alert">{teksti}</p>
        <Link className="button button-primary" href="/njoftimet">
          Kthehu te njoftimet
        </Link>
      </section>
    </main>
  );
}

export default async function Kerkesa({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { njoftim } = await searchParams;
  const njoftimId = typeof njoftim === "string" && /^\d+$/.test(njoftim) ? njoftim : null;

  const uneId = await githubIdNgaSesioni();
  if (!uneId) {
    return <Mesazh titulli="Hyr për të parë kërkesën." teksti="Kërkesa është personale." />;
  }

  // Serveri kontrollon që ky sesion është udhëtari ose shoferi pronar.
  let kerkesa: DetajetKerkeses | null;
  try {
    kerkesa = await lexoKerkesen(id, uneId);
  } catch (error) {
    console.error(`Nuk u lexua kërkesa ${id}.`, error);
    return <Mesazh titulli="Nuk u lidhëm me databazën." teksti="Provo përsëri pas pak." />;
  }
  if (!kerkesa) {
    return (
      <Mesazh
        titulli="Kërkesa nuk u gjet."
        teksti="Kjo kërkesë nuk ekziston ose nuk ke leje ta shohësh."
      />
    );
  }

  return (
    <main className="app-shell">
      <Navigimi />
      <Link className="back-link" href="/njoftimet">
        ← Kthehu te njoftimet
      </Link>
      <section className="detail-card">
        <p className="eyebrow eyebrow-dark">KËRKESA K-{kerkesa.id}</p>
        <div className="detail-route">
          <span aria-hidden="true" className="route-mark">
            ↗
          </span>
          <div>
            <h1>
              {kerkesa.nisja} – {kerkesa.destinacioni}
            </h1>
            <p>
              Shoferi: {kerkesa.shoferi} · Udhëtari: {kerkesa.udhetari}
            </p>
          </div>
        </div>
        <div className="detail-facts">
          <div className="detail-fact">
            <span>Statusi i kërkesës</span>
            <strong>
              <span className={`sync-badge sync-badge-${kerkesa.statusi}`}>
                {kerkesa.statusi === "pranuar" ? "U pranua" : "Në pritje"}
              </span>
            </strong>
          </div>
          <div className="detail-fact">
            <span>Ora e nisjes</span>
            <strong>{kerkesa.ora}</strong>
          </div>
          <div className="detail-fact">
            <span>Vende të lira</span>
            <strong>{kerkesa.vende}</strong>
          </div>
        </div>
        <div className="sync-box">
          {njoftimId && <ShenimiLexuar kerkesaId={kerkesa.id} njoftimId={njoftimId} />}
          <p className="section-note">
            Leximi i njoftimit dhe statusi i kërkesës janë dy gjendje të ndara.
          </p>
          <Link className="button button-secondary" href={`/udhetimi/${kerkesa.udhetimId}#kerkesa`}>
            Hap udhëtimin
          </Link>
        </div>
      </section>
    </main>
  );
}
