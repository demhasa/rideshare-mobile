import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigimi } from "@/components/Navigimi";
import { gjejUdhetimin } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export default async function Kerkesa({
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
          <p className="eyebrow">KËRKESA PËR VEND</p>
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
      <Link className="back-link" href={`/udhetimi/${id}`}>
        ← Kthehu te detajet
      </Link>
      {udhetim.vende > 0 ? (
        <section className="message-card">
          <span aria-hidden="true" className="message-icon">
            ✓
          </span>
          <p className="eyebrow">SIMULIM · NË PRITJE</p>
          <h1>Kërkesa u përgatit.</h1>
          <p>
            Kjo është vetëm provë për udhëtimin nga {udhetim.nisja}; kërkesa nuk
            është dërguar te shoferi dhe nuk është ruajtur.
          </p>
          <Link className="button button-primary" href={`/udhetimi/${id}`}>
            Kthehu te udhëtimi
          </Link>
        </section>
      ) : (
        <section className="message-card">
          <p className="eyebrow">UDHËTIMI I PLOTË</p>
          <h1>Nuk ka vende të lira.</h1>
          <p>Ky udhëtim nuk pranon më kërkesa për vende.</p>
          <Link className="button button-secondary" href={`/udhetimi/${id}`}>
            Kthehu te detajet
          </Link>
        </section>
      )}
    </main>
  );
}
