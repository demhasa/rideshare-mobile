import Link from "next/link";
import { KartaUdhetimi } from "@/components/KartaUdhetimi";
import { Navigimi } from "@/components/Navigimi";
import { lexoUdhetimet, type Udhetim } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export default async function Home() {
  let udhetimet: Udhetim[];
  try {
    udhetimet = await lexoUdhetimet();
  } catch (error) {
    console.error("Nuk u lexuan udhëtimet nga Neon.", error);
    return (
      <main className="app-shell">
        <Navigimi />
        <section className="message-card">
          <p className="eyebrow">UDHËTIME PËR AAB</p>
          <h1>Nuk u lidhëm me databazën.</h1>
          <p role="alert">
            Kontrollo lidhjen me Neon dhe provo sërish pas pak.
          </p>
          <Link className="button button-primary" href="/">
            Provo përsëri
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Navigimi />
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">PËR STUDENTËT E AAB</p>
          <h1>Rruga drejt kampusit fillon bashkë.</h1>
          <p>
            Gjej udhëtim me studentë të tjerë dhe shiko orarin, nisjen e vendet
            e lira në një vend.
          </p>
          <a className="hero-link" href="#udhetimet">
            Shiko udhëtimet <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section aria-labelledby="udhetimet-heading" id="udhetimet">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow-dark">LISTA E SOTME</p>
            <h2 id="udhetimet-heading">Udhëtimet në dispozicion</h2>
            <p>Orari dhe vendet lexohen drejtpërdrejt nga databaza.</p>
          </div>
          <Link className="nav-link" href="/panel">
            Hyr në panel <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {udhetimet.length === 0 ? (
          <p className="empty-state">Nuk ka udhëtime për momentin.</p>
        ) : (
          <div className="trip-list">
            {udhetimet.map((udhetim) => (
              <KartaUdhetimi key={udhetim.id} udhetim={udhetim} />
            ))}
          </div>
        )}
      </section>
      <footer className="site-footer">
        <span>RideShare · Komuniteti studentor AAB</span>
        <span>Të dhëna fiktive për ushtrime · rezervimi nuk është aktiv</span>
      </footer>
    </main>
  );
}
