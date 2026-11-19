"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RequestRow = {
  id: number;
  udhetari: string;
  status: "ne_pritje" | "e_pranuar";
};

type StateRow = {
  vende: number;
  userId: string | null;
  isOwner: boolean;
  own: RequestRow | null;
  requests: RequestRow[];
};

export function GjendjaKerkeses({ tripId, initialSeats }: { tripId: string; initialSeats: number }) {
  const [state, setState] = useState<StateRow>({ vende: initialSeats, userId: null, isOwner: false, own: null, requests: [] });
  const [offline, setOffline] = useState(false);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await fetch(`/api/kerkesa/${encodeURIComponent(tripId)}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      if (!response.ok) throw new Error("Leximi dështoi");
      const data = await response.json() as StateRow;
      setState(data);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      loadingRef.current = false;
    }
  }, [tripId]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function createRequest() {
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/kerkesa/${encodeURIComponent(tripId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      if (response.status === 401) setMessage("Hyr me GitHub për të dërguar kërkesën.");
      else if (response.status === 409) setMessage("Ky udhëtim nuk ka vende të lira.");
      else if (!response.ok) setMessage("Kërkesa nuk u ruajt. Provo përsëri.");
      else setMessage("Kërkesa u ruajt në pritje.");
      await load();
    } catch {
      setMessage("Nuk u lidhëm me serverin. Provo përsëri.");
    } finally {
      setSending(false);
    }
  }

  async function acceptRequest(requestId: number) {
    setAccepting(requestId);
    setMessage(null);
    try {
      const response = await fetch(`/api/kerkesa/${encodeURIComponent(tripId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ veprim: "prano", kerkesaId: requestId }),
        cache: "no-store",
      });
      if (response.status === 409) setMessage("Nuk ka më vende të lira.");
      else if (response.status === 403) setMessage("Vetëm shoferi pronar mund ta pranojë kërkesën.");
      else if (!response.ok) setMessage("Pranimi nuk u ruajt. Provo përsëri.");
      else setMessage("Pranimi u konfirmua nga serveri.");
      await load();
    } catch {
      setMessage("Nuk u lidhëm me serverin. Provo përsëri.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <section className="sync-card" aria-live="polite">
      <div className="sync-heading">
        <div>
          <p className="eyebrow eyebrow-dark">GJENDJA LIVE</p>
          <h2>Vende të lira: {state.vende}</h2>
        </div>
        {offline && <span className="offline-badge">Po rilidhemi · të dhënat mund të jenë të vjetra</span>}
      </div>

      {state.isOwner ? (
        <div className="request-list">
          <h3>Kërkesat për udhëtimin</h3>
          {state.requests.length === 0 ? (
            <p className="helper-copy">Nuk ka kërkesa ende.</p>
          ) : state.requests.map((request) => (
            <div className="request-row" key={request.id}>
              <div>
                <strong>{request.udhetari}</strong>
                <span>{request.status === "e_pranuar" ? "U pranua" : "Në pritje"}</span>
              </div>
              {request.status === "ne_pritje" ? (
                <button
                  className="button button-primary"
                  type="button"
                  disabled={accepting !== null || state.vende <= 0}
                  onClick={() => void acceptRequest(request.id)}
                >
                  {accepting === request.id ? "Po pranohet…" : "Prano"}
                </button>
              ) : (
                <button className="button" type="button" disabled>Pranuar</button>
              )}
            </div>
          ))}
        </div>
      ) : state.own ? (
        <div className="own-request">
          <strong>Kërkesa jote:</strong>{" "}
          {state.own.status === "e_pranuar" ? "U pranua" : "Në pritje"}
        </div>
      ) : state.userId ? (
        <button className="button button-primary" type="button" disabled={sending || state.vende <= 0} onClick={() => void createRequest()}>
          {sending ? "Po ruhet…" : state.vende <= 0 ? "Nuk ka vende të lira" : "Dërgo kërkesën"}
        </button>
      ) : (
        <p className="helper-copy">Hyr me GitHub për të dërguar një kërkesë.</p>
      )}
      {message && <p className="helper-copy" role="status">{message}</p>}
    </section>
  );
}
