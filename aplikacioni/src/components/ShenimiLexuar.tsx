"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNjoftimet } from "./Njoftimet";

type Gjendja = "po_ruhet" | "ruajtur" | "deshtoi";

/**
 * Hapja e njoftimit: kërkon nga serveri ta shënojë si të lexuar. Suksesi
 * shfaqet vetëm pas konfirmimit; nëse dështon, njoftimi mbetet i palexuar.
 */
export function ShenimiLexuar({ njoftimId, kerkesaId }: { njoftimId: string; kerkesaId: string }) {
  const { shenoLexuar } = useNjoftimet();
  const [gjendja, setGjendja] = useState<Gjendja>("po_ruhet");
  const nisurRef = useRef(false);

  const provo = useCallback(async () => {
    setGjendja("po_ruhet");
    setGjendja((await shenoLexuar(njoftimId, kerkesaId)) ? "ruajtur" : "deshtoi");
  }, [shenoLexuar, njoftimId, kerkesaId]);

  useEffect(() => {
    if (nisurRef.current) return;
    nisurRef.current = true;
    void provo();
  }, [provo]);

  if (gjendja === "ruajtur") {
    return (
      <p className="notice" role="status">
        Njoftimi N-{njoftimId} u shënua si i lexuar. Mbetet në historinë e njoftimeve.
      </p>
    );
  }
  if (gjendja === "deshtoi") {
    return (
      <div className="notice notice-error read-retry" role="alert">
        <span>Leximi nuk u ruajt. Njoftimi N-{njoftimId} mbetet i palexuar.</span>
        <button className="button button-secondary" onClick={() => void provo()} type="button">
          Provo përsëri
        </button>
      </div>
    );
  }
  return (
    <p className="notice" role="status">
      Po shënohet si i lexuar…
    </p>
  );
}
