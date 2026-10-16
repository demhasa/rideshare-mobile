import Link from "next/link";
import { Navigimi } from "@/components/Navigimi";

export default function UdhetimiNukUGjet() {
  return (
    <main className="app-shell">
      <Navigimi />
      <section className="message-card">
        <p className="eyebrow">404 · UDHËTIMI</p>
        <h1>Udhëtimi nuk u gjet.</h1>
        <p>Kjo adresë nuk përputhet me një udhëtim në listë.</p>
        <Link className="button button-primary" href="/">
          Kthehu te lista
        </Link>
      </section>
    </main>
  );
}
