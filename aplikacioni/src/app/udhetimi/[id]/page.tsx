import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigimi } from "@/components/Navigimi";
import { gjejUdhetimin } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export default async function Detajet({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let udhetim;
  try {
    udhetim = await gjejUdhetimin(id);
  } catch (error) {
    console.error(`Nuk u lexua udhëtimi ${id} nga Neon.`, error);
    return (
      <main className="app-shell">
        <Navigimi />
        <section className="message-card">
          <p className="eyebrow">UDHËTIMI</p>
          <h1>Nuk u lidhëm me databazën.</h1>
          <p role="alert">Kontrollo Neon dhe provo përsëri.</p>
          <Link className="button button-primary" href="/">
            Kthehu te lista
          </Link>
        </section>
      </main>
    );
  }

  if (!udhetim) notFound();

  return (
    <main className="app-shell">
      <Navigimi />
      <Link className="back-link" href="/">
        ← Të gjitha udhëtimet
      </Link>
      <section className="detail-card">
        <p className="eyebrow eyebrow-dark">DETAJET E UDHËTIMIT</p>
        <div className="detail-route">
          <span aria-hidden="true" className="route-mark">
            ↗
          </span>
          <div>
            <h1>
              {udhetim.nisja} – {udhetim.destinacioni}
            </h1>
            <p>Udhëtim studentor drejt Kolegjit AAB</p>
          </div>
        </div>
        <div className="detail-facts">
          <div className="detail-fact">
            <span>Ora e nisjes</span>
            <strong>{udhetim.ora}</strong>
          </div>
          <div className="detail-fact">
            <span>Vende të lira</span>
            <strong>{udhetim.vende}</strong>
          </div>
          <div className="detail-fact">
            <span>Vendtakimi</span>
            <strong>{udhetim.vendtakimi}</strong>
          </div>
          <div className="detail-fact">
            <span>Destinacioni</span>
            <strong>{udhetim.destinacioni}</strong>
          </div>
        </div>
        {udhetim.vende > 0 ? (
          <Link className="button button-primary button-block" href={`/udhetimi/${id}/kerkesa`}>
            Kërko një vend <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <button className="button button-block" disabled>
            Nuk ka vende të lira
          </button>
        )}
        <p className="section-note">
          Kërkesa në këtë version është vetëm simulim dhe nuk i dërgohet shoferit.
        </p>
      </section>
    </main>
  );
}
