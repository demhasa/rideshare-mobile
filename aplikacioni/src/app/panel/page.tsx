import type { Metadata } from "next";
import Link from "next/link";
import Hyrja from "@/components/Hyrja";
import { Navigimi } from "@/components/Navigimi";
import { profiliIm } from "@/lib/lejet";
import { ruajOren } from "./actions";

export const metadata: Metadata = { title: "Paneli im" };
export const dynamic = "force-dynamic";

const mesazhet = {
  hyr: "Hyr në llogari para se të ndryshosh udhëtimin.",
  ndaluar: "Nuk ke leje për këtë udhëtim. Ora nuk ndryshoi.",
  fushe: "Shkruaj një orë të vlefshme. ID duhet të jetë numerike.",
  ruajtur: "Ora u ruajt. Kontrollo listën dhe detajet e udhëtimit.",
  databaza: "Nuk u lidhëm me databazën. Kontrollo Neon dhe provo përsëri.",
} as const;

type ResultCode = keyof typeof mesazhet;

function eshteKodRezultati(value: string): value is ResultCode {
  return Object.hasOwn(mesazhet, value);
}

export default async function Panel({
  searchParams,
}: {
  searchParams: Promise<{ m?: string | string[] }>;
}) {
  const { m } = await searchParams;
  const result = typeof m === "string" && eshteKodRezultati(m) ? m : null;
  const oauthGati = Boolean(
    process.env.GITHUB_ID &&
      process.env.GITHUB_SECRET &&
      process.env.NEXTAUTH_SECRET &&
      process.env.NEXTAUTH_URL,
  );

  let profil;
  let gabimDatabaze = false;
  try {
    profil = await profiliIm();
  } catch (error) {
    console.error("Nuk u lexua profili i përdoruesit nga Neon.", error);
    gabimDatabaze = true;
  }

  return (
    <main className="app-shell">
      <Navigimi />
      <section className="panel-card">
        <div className="panel-intro">
          <div>
            <p className="eyebrow">LLOGARIA JOTE</p>
            <h1>Paneli im</h1>
            <p>Hyrja identifikon përdoruesin; Neon përcakton rolin dhe pronësinë.</p>
          </div>
          {profil && <span className="role-badge">{profil.roli}</span>}
        </div>

        {result && (
          <p
            className={`notice${result === "ruajtur" ? "" : " notice-error"}`}
            role={result === "ruajtur" ? "status" : "alert"}
          >
            {mesazhet[result]}
          </p>
        )}

        {gabimDatabaze ? (
          <p className="notice notice-error" role="alert">
            {mesazhet.databaza}
          </p>
        ) : profil ? (
          <>
            <div className="identity-box">
              <strong>Përshëndetje, {profil.emri}.</strong>
              <span>
                ID GitHub: <code>{profil.id}</code>
              </span>
              <span>
                Roli caktohet në Neon; nuk mund të ndryshohet nga formulari.
              </span>
            </div>
            <Hyrja brenda oauthGati={oauthGati} />

            {profil.roli === "shofer" ? (
              <form action={ruajOren} className="edit-form">
                <h2>Ndrysho orën e udhëtimit tënd</h2>
                <input name="id" type="hidden" value="2" />
                <label htmlFor="ora">Ora e re për udhëtimin ID 2</label>
                <input
                  autoComplete="off"
                  id="ora"
                  name="ora"
                  required
                  type="time"
                  defaultValue="08:15"
                />
                <p>
                  Serveri kontrollon rolin dhe pronësinë në çdo ruajtje; nuk
                  mbështetet te ID-ja e fshehur në formular.
                </p>
                <button className="button button-primary" type="submit">
                  Ruaj orën
                </button>
              </form>
            ) : (
              <p className="helper-copy">
                Si udhëtar mund t’i shohësh udhëtimet, por nuk mund të ndryshosh
                orën e shoferit.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="helper-copy">
              Udhëtimet janë publike. Hyr me GitHub për të parë profilin tënd
              dhe lejet e tij.
            </p>
            <Hyrja brenda={false} oauthGati={oauthGati} />
          </>
        )}

        <Link className="back-link" href="/">
          ← Kthehu te udhëtimet
        </Link>
        <p className="helper-copy">
          Kërkesa për vend mbetet simulim; ky panel demonstron vetëm hyrjen dhe
          ndryshimin e autorizuar të orarit.
        </p>
      </section>
    </main>
  );
}
