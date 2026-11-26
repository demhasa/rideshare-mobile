"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lidhjaNjoftimit, useNjoftimet } from "./Njoftimet";

function koha(iso: string) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime())
    ? ""
    : data.toLocaleString("sq-AL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function ListaNjoftimeve() {
  const { lista, statusi } = useNjoftimet();
  // Ora shfaqet vetëm në shfletues, që serveri dhe klienti të renderojnë njësoj.
  const [montuar, setMontuar] = useState(false);
  useEffect(() => setMontuar(true), []);

  if (lista === null) {
    return (
      <p className={`notice${statusi === "offline" ? " notice-error" : ""}`} role="status">
        {statusi === "offline"
          ? "Njoftimet nuk u lexuan. Po provojmë përsëri…"
          : "Po lexohen njoftimet…"}
      </p>
    );
  }

  return (
    <div className="notification-list">
      <p className="section-note">
        <strong>{lista.palexuara}</strong> të palexuara · {lista.njoftimet.length} gjithsej
      </p>

      {lista.njoftimet.length === 0 ? (
        <div className="empty-state">
          Ende pa njoftime. Kur shoferi pranon kërkesën tënde, njoftimi shfaqet këtu.
        </div>
      ) : (
        lista.njoftimet.map((n) => (
          <Link
            className={`notification-item${n.lexuarMe === null ? " notification-unread" : ""}`}
            href={lidhjaNjoftimit(n)}
            key={n.id}
          >
            <div>
              <p className="eyebrow eyebrow-dark">
                NJOFTIMI N-{n.id} · KËRKESA K-{n.kerkesaId}
              </p>
              <strong>{n.teksti}</strong>
              <span>{n.udhetimi}</span>
            </div>
            <div className="notification-meta">
              <span className={`sync-badge${n.lexuarMe === null ? " sync-badge-ne_pritje" : ""}`}>
                {n.lexuarMe === null ? "E palexuar" : "E lexuar"}
              </span>
              {montuar && <small>{koha(n.krijuarMe)}</small>}
            </div>
          </Link>
        ))
      )}

      {statusi === "offline" ? (
        <p className="notice notice-error sync-offline" role="alert">
          <strong>Po rilidhemi · njoftimet mund të jenë të vjetra</strong>
        </p>
      ) : (
        <p className="section-note">
          Lista u lexua nga serveri{montuar ? ` në ${koha(lista.lexuarMe)}` : ""} · Përditësim
          automatik çdo 5 sekonda
        </p>
      )}
    </div>
  );
}
