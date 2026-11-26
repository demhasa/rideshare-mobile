"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const INTERVALI_MS = 5000;
const TOAST_MS = 7000;

export type Njoftim = {
  id: string;
  kerkesaId: string;
  lloji: "pranuar";
  teksti: string;
  udhetimi: string;
  krijuarMe: string;
  lexuarMe: string | null;
};

type ListaNjoftimeve = {
  njoftimet: Njoftim[];
  palexuara: number;
  lexuarMe: string;
};

type Statusi = "ngarkim" | "hyr" | "gati" | "offline";

type Konteksti = {
  lista: ListaNjoftimeve | null;
  statusi: Statusi;
  /** Kthen true vetëm pasi serveri e konfirmon leximin. */
  shenoLexuar: (njoftimId: string, kerkesaId: string) => Promise<boolean>;
};

const NjoftimetContext = createContext<Konteksti | null>(null);

export function useNjoftimet(): Konteksti {
  const ctx = useContext(NjoftimetContext);
  if (!ctx) throw new Error("useNjoftimet duhet brenda <NjoftimetProvider>.");
  return ctx;
}

export function lidhjaNjoftimit(n: Pick<Njoftim, "id" | "kerkesaId">) {
  return `/kerkesat/${n.kerkesaId}?njoftim=${n.id}`;
}

function eshteNjoftim(value: unknown): value is Njoftim {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.kerkesaId === "string" &&
    v.lloji === "pranuar" &&
    typeof v.teksti === "string" &&
    typeof v.udhetimi === "string" &&
    typeof v.krijuarMe === "string" &&
    (v.lexuarMe === null || typeof v.lexuarMe === "string")
  );
}

function eshteLista(value: unknown): value is ListaNjoftimeve {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.njoftimet) &&
    v.njoftimet.every(eshteNjoftim) &&
    typeof v.palexuara === "number" &&
    typeof v.lexuarMe === "string"
  );
}

export function NjoftimetProvider({ children }: { children: React.ReactNode }) {
  const [lista, setLista] = useState<ListaNjoftimeve | null>(null);
  const [statusi, setStatusi] = useState<Statusi>("ngarkim");
  const [toastet, setToastet] = useState<Njoftim[]>([]);

  // ID-të që ky sesion i ka parë tashmë. null = ende pa leximin e parë:
  // historia e parë (ose pas Refresh) nuk trajtohet si alarm i ri.
  const teNjohuraRef = useRef<Set<string> | null>(null);
  const leximiRef = useRef<AbortController | null>(null);
  // Rritet pas çdo shënimi; përgjigjet e leximeve të nisura më herët injorohen.
  const breziRef = useRef(0);
  const ndalurRef = useRef(false);

  const pranoListen = useCallback((data: ListaNjoftimeve) => {
    const teNjohura = teNjohuraRef.current;
    if (teNjohura === null) {
      teNjohuraRef.current = new Set(data.njoftimet.map((n) => n.id));
    } else {
      const teReja = data.njoftimet.filter((n) => !teNjohura.has(n.id));
      for (const n of teReja) teNjohura.add(n.id);
      const paLexuar = teReja.filter((n) => n.lexuarMe === null);
      if (paLexuar.length > 0) setToastet((t) => [...paLexuar, ...t].slice(0, 3));
    }
    setLista(data);
  }, []);

  const lexo = useCallback(async () => {
    if (leximiRef.current || ndalurRef.current) return;
    const controller = new AbortController();
    leximiRef.current = controller;
    const brezi = breziRef.current;

    try {
      const response = await fetch("/api/njoftimet", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (response.status === 401) {
        // Vizitor pa hyrje: nuk ka njoftime; hyrja e rifreskon faqen.
        ndalurRef.current = true;
        setStatusi("hyr");
        return;
      }
      const data: unknown = await response.json();
      if (!response.ok || !eshteLista(data)) throw new Error("Leximi i njoftimeve dështoi.");
      if (brezi !== breziRef.current || controller.signal.aborted) return;
      pranoListen(data);
      setStatusi("gati");
    } catch {
      if (controller.signal.aborted) return;
      setStatusi((s) => (s === "hyr" ? s : "offline"));
    } finally {
      if (leximiRef.current === controller) leximiRef.current = null;
    }
  }, [pranoListen]);

  const anuloLeximin = useCallback(() => {
    leximiRef.current?.abort();
    leximiRef.current = null;
  }, []);

  useEffect(() => {
    let aktiv = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cikli = async () => {
      await lexo();
      if (aktiv && !ndalurRef.current) timer = setTimeout(cikli, INTERVALI_MS);
    };
    timer = setTimeout(cikli, 0);

    const neRilidhje = () => {
      anuloLeximin();
      void lexo();
    };
    const neShkeputje = () => setStatusi((s) => (s === "hyr" ? s : "offline"));
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
  }, [lexo, anuloLeximin]);

  const shenoLexuar = useCallback(
    async (njoftimId: string, kerkesaId: string) => {
      try {
        const response = await fetch(
          `/api/njoftimet/${encodeURIComponent(njoftimId)}/lexuar?kerkesa=${encodeURIComponent(kerkesaId)}`,
          { method: "POST", credentials: "same-origin" },
        );
        const data = (await response.json()) as Record<string, unknown>;
        if (!response.ok || typeof data.lexuarMe !== "string") return false;
        const lexuarMe = data.lexuarMe;
        // Numri ulet vetëm tani, pas konfirmimit nga serveri.
        breziRef.current += 1;
        anuloLeximin();
        teNjohuraRef.current?.add(njoftimId);
        setToastet((t) => t.filter((n) => n.id !== njoftimId));
        setLista((l) => {
          if (!l) return l;
          const njoftimet = l.njoftimet.map((n) =>
            n.id === njoftimId ? { ...n, lexuarMe: n.lexuarMe ?? lexuarMe } : n,
          );
          return {
            ...l,
            njoftimet,
            palexuara: njoftimet.filter((n) => n.lexuarMe === null).length,
          };
        });
        void lexo();
        return true;
      } catch {
        return false;
      }
    },
    [anuloLeximin, lexo],
  );

  // Toast-i zhduket vetë; njoftimi mbetet në listë.
  useEffect(() => {
    if (toastet.length === 0) return;
    const timer = setTimeout(() => setToastet((t) => t.slice(0, -1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toastet]);

  const vlera = useMemo(() => ({ lista, statusi, shenoLexuar }), [lista, statusi, shenoLexuar]);

  return (
    <NjoftimetContext.Provider value={vlera}>
      {children}
      {toastet.length > 0 && (
        <div aria-live="polite" className="toast-stack" role="status">
          {toastet.map((n) => (
            <div className="toast" key={n.id}>
              <div>
                <strong>{n.teksti}</strong>
                <span>{n.udhetimi}</span>
              </div>
              <div className="toast-actions">
                <Link
                  className="button button-primary"
                  href={lidhjaNjoftimit(n)}
                  onClick={() => setToastet((t) => t.filter((x) => x.id !== n.id))}
                >
                  Hape
                </Link>
                <button
                  aria-label="Mbyll njoftimin"
                  className="toast-close"
                  onClick={() => setToastet((t) => t.filter((x) => x.id !== n.id))}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </NjoftimetContext.Provider>
  );
}

/** Butoni te shiriti i sipërm: numri i njoftimeve pa kohë leximi. */
export function KambanaNjoftimeve() {
  const { lista, statusi } = useNjoftimet();
  if (statusi === "hyr" || lista === null) return null;
  const numri = lista.palexuara;
  return (
    <Link
      aria-label={`Njoftimet, ${numri} të palexuara`}
      className="nav-link bell-link"
      href="/njoftimet"
    >
      Njoftimet
      {numri > 0 && <span className="bell-count">{numri}</span>}
    </Link>
  );
}
