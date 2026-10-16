import Link from "next/link";
import type { Udhetim } from "@/lib/udhetimet";

export function KartaUdhetimi({ udhetim }: { udhetim: Udhetim }) {
  const kaVende = udhetim.vende > 0;

  return (
    <article className="trip-card">
      <div className="trip-card-top">
        <span aria-hidden="true" className="route-mark">
          ↗
        </span>
        <span className={`seat-badge${kaVende ? "" : " seat-badge-full"}`}>
          {kaVende ? `${udhetim.vende} vende të lira` : "I plotë"}
        </span>
      </div>
      <h3>{udhetim.nisja}</h3>
      <p className="trip-destination">Drejt {udhetim.destinacioni}</p>
      <div className="trip-meta">
        <span>
          <strong aria-hidden="true">◷</strong> {udhetim.ora}
        </span>
        <span>↗ {udhetim.vendtakimi}</span>
      </div>
      <Link className="button button-secondary button-block" href={`/udhetimi/${udhetim.id}`}>
        Shiko udhëtimin <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
