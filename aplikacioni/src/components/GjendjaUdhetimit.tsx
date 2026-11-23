"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVALI_MS = 5000;

type Kerkesa = {
  id: string;
  statusi: "ne_pritje" | "pranuar";
  udhetari: string;
};

export type GjendjaUdhetimit = {
  udhetimId: string;
  vende: number;
  roli: "shofer" | "udhetar" | "vizitor";
  kerkesaIme: Kerkesa | null;
  kerkesat: Kerkesa[];
  lexuarMe: string;
};

type Mesazhi = { tekst: string; gabim: boolean } | null;

function eshteGjendje(value: unknown): value is GjendjaUdhetimit {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.udhetimId === "string" &&
    typeof v.vende === "number" &&
    Number.isInteger(v.vende) &&
    v.vende >= 0 &&
    (v.roli === "shofer" || v.roli === "udhetar" || v.roli === "vizitor") &&
    Array.isArray(v.kerkesat) &&
    typeof v.lexuarMe === "string"
  );
}

function teksti(statusi: Kerkesa["statusi"]) {
  return statusi === "pranuar" ? "U pranua" : "Në pritje";
}

function ora(iso: string) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime())
    ? ""
    : data.toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function GjendjaUdhetimit({
  udhetimId,
  fillimisht,
}: {
  udhetimId: string;
  fillimisht: GjendjaUdhetimit | null;
}) {
  // Vlerat e fundit të njohura; nuk fshihen kur leximi dështon.
  const [gjendja, setGjendja] = useState<GjendjaUdhetimit | null>(fillimisht);
  const [poRilidhemi, setPoRilidhemi] = useState(fillimisht === null);
  const [veprimi, setVeprimi] = useState<string | null>(null);
  const [mesazhi, setMesazhi] = useState<Mesazhi>(null);
  // Ora shfaqet vetëm në shfletues, që serveri dhe klienti të renderojnë njësoj.
  const [montuar, setMontuar] = useState(false);

  // Leximi që është ende në pritje (vetëm një në të njëjtën kohë).
  const leximiRef = useRef<AbortController | null>(null);
  // Rritet në çdo veprim; përgjigjet e leximeve të nisura më herët injorohen.
  const breziRef = useRef(0);

  const lexo = useCallback(async () => {
    if (leximiRef.current) return;
    const controller = new AbortController();
    leximiRef.current = controller;
    const brezi = breziRef.current;

    try {
      const response = await fetch(`/api/udhetimet/${udhetimId}/gjendja`, {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok || !eshteGjendje(data)) {
        throw new Error("Leximi i gjendjes dështoi.");
      }
      // Përgjigje e vjetruar: një veprim ndodhi ndërkohë.
      if (brezi !== breziRef.current || controller.signal.aborted) return;
      setGjendja(data);
      // Paralajmërimi hiqet vetëm pas një përgjigjeje të suksesshme.
      setPoRilidhemi(false);
    } catch {
      if (controller.signal.aborted) return;
      setPoRilidhemi(true);
    } finally {
      if (leximiRef.current === controller) leximiRef.current = null;
    }
  }, [udhetimId]);

  const anuloLeximin = useCallback(() => {
    leximiRef.current?.abort();
    leximiRef.current = null;
  }, []);

  // Përditësimi periodik: leximi i radhës planifikohet pasi mbaron i pari.
  useEffect(() => setMontuar(true), []);

  useEffect(() => {
    let aktiv = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cikli = async () => {
      await lexo();
      if (aktiv) timer = setTimeout(cikli, INTERVALI_MS);
    };
    timer = setTimeout(cikli, fillimisht ? INTERVALI_MS : 0);

    const neRilidhje = () => {
      anuloLeximin();
      void lexo();
    };
    const neShkeputje = () => setPoRilidhemi(true);
    const neDukje = () => {
      if (document.visibilityState === "visible") void lexo();
    };
    window.addEventListener("online", neRilidhje);
    window.addEventListener("offline", neShkeputje);
    document.addEventListener("visibilitychange", neDukje);

    return () => {
      aktiv = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", neRilidhje);
      window.removeEventListener("offline", neShkeputje);
      document.removeEventListener("visibilitychange", neDukje);
      anuloLeximin();
    };
  }, [lexo, anuloLeximin, fillimisht]);

  async function dergo(url: string, celesi: string, sukses: (data: Record<string, unknown>) => string) {
    if (veprimi || poRilidhemi) return;
    breziRef.current += 1;
    anuloLeximin();
    setVeprimi(celesi);
    setMesazhi(null);

    try {
      const response = await fetch(url, { method: "POST", credentials: "same-origin" });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setMesazhi({
          tekst: typeof data.error === "string" ? data.error : "Veprimi nuk u ruajt.",
          gabim: true,
        });
        // Gjendja mund të ketë ndryshuar në server (p.sh. vendet mbaruan).
        void lexo();
        return;
      }
      const e_re = eshteGjendje(data.gjendja) ? data.gjendja : data;
      if (eshteGjendje(e_re)) {
        setGjendja(e_re);
        setPoRilidhemi(false);
      }
      setMesazhi({ tekst: sukses(data), gabim: false });
    } catch {
      setPoRilidhemi(true);
      setMesazhi({ tekst: "Nuk u lidhëm me serverin. Veprimi nuk u konfirmua.", gabim: true });
    } finally {
      setVeprimi(null);
    }
  }

  function kerkoVend() {
    void dergo(`/api/udhetimet/${udhetimId}/kerkesa`, "dergo", () => "Kërkesa u dërgua te shoferi.");
  }

  function prano(kerkesaId: string) {
    void dergo(`/api/kerkesat/${kerkesaId}/prano`, kerkesaId, (data) =>
      data.rezultati === "pranuar_me_pare"
        ? "Kjo kërkesë ishte pranuar më parë; vendet nuk u ulën përsëri."
        : "Pranimi u ruajt.",
    );
  }

  const bllokuar = poRilidhemi || veprimi !== null;

  return (
    <section className="sync-box" id="kerkesa">
      <div className="sync-facts">
        <div className="detail-fact">
          <span>Vende të lira</span>
          <strong className="sync-seats">{gjendja ? gjendja.vende : "–"}</strong>
        </div>
        <div className="detail-fact">
          <span>Roli në këtë udhëtim</span>
          <strong>
            {gjendja?.roli === "shofer"
              ? "Shofer pronar"
              : gjendja?.roli === "udhetar"
                ? "Udhëtar"
                : gjendja
                  ? "Vizitor"
                  : "–"}
          </strong>
        </div>
      </div>

      {gjendja?.roli === "shofer" && (
        <div className="sync-requests">
          {gjendja.kerkesat.length === 0 ? (
            <div className="sync-request">
              <div>
                <p className="eyebrow eyebrow-dark">KËRKESAT</p>
                <strong>Ende pa kërkesë</strong>
              </div>
              <span className="sync-badge">Pa kërkesë</span>
            </div>
          ) : (
            gjendja.kerkesat.map((kerkesa) => (
              <div className="sync-request" key={kerkesa.id}>
                <div>
                  <p className="eyebrow eyebrow-dark">
                    KËRKESA E {kerkesa.udhetari.toUpperCase()}
                  </p>
                  <span className={`sync-badge sync-badge-${kerkesa.statusi}`}>
                    {teksti(kerkesa.statusi)}
                  </span>
                </div>
                <button
                  className="button button-primary"
                  disabled={bllokuar || kerkesa.statusi === "pranuar"}
                  onClick={() => prano(kerkesa.id)}
                  type="button"
                >
                  {veprimi === kerkesa.id
                    ? "Po ruhet…"
                    : kerkesa.statusi === "pranuar"
                      ? "Pranimi u ruajt"
                      : "Prano kërkesën"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {gjendja?.roli === "udhetar" && (
        <div className="sync-requests">
          <div className="sync-request">
            <div>
              <p className="eyebrow eyebrow-dark">KËRKESA IME</p>
              <span
                className={`sync-badge${gjendja.kerkesaIme ? ` sync-badge-${gjendja.kerkesaIme.statusi}` : ""}`}
              >
                {gjendja.kerkesaIme ? teksti(gjendja.kerkesaIme.statusi) : "Pa kërkesë"}
              </span>
            </div>
            <button
              className="button button-primary"
              disabled={bllokuar || gjendja.kerkesaIme !== null || gjendja.vende === 0}
              onClick={kerkoVend}
              type="button"
            >
              {veprimi === "dergo"
                ? "Po dërgohet…"
                : gjendja.kerkesaIme?.statusi === "pranuar"
                  ? "Vendi u konfirmua"
                  : gjendja.kerkesaIme
                    ? "Kërkesa u dërgua"
                    : gjendja.vende === 0
                      ? "Nuk ka vende të lira"
                      : "Kërko një vend"}
            </button>
          </div>
        </div>
      )}

      {gjendja?.roli === "vizitor" && (
        <div className="sync-request">
          <p className="helper-copy">Hyr me GitHub për të kërkuar një vend.</p>
          <Link className="button button-secondary" href="/panel">
            Hyr
          </Link>
        </div>
      )}

      {mesazhi && (
        <p
          className={`notice${mesazhi.gabim ? " notice-error" : ""}`}
          role={mesazhi.gabim ? "alert" : "status"}
        >
          {mesazhi.tekst}
        </p>
      )}

      {poRilidhemi ? (
        <p className="notice notice-error sync-offline" role="alert">
          <strong>Po rilidhemi · të dhënat mund të jenë të vjetra</strong>
          <br />
          Veprimet që kërkojnë rrjet janë të bllokuara.
          {gjendja && montuar && <> Leximi i fundit i suksesshëm: {ora(gjendja.lexuarMe)}.</>}
        </p>
      ) : (
        <p className="section-note">
          Gjendja u lexua nga serveri{gjendja && montuar ? ` në ${ora(gjendja.lexuarMe)}` : ""} ·
          Përditësim automatik çdo 5 sekonda
        </p>
      )}
    </section>
  );
}
