"use client";

import { useState } from "react";

type PreferimiProps = {
  udhetimId: string;
  fillimishtRuajtur: boolean;
  fillimishtNumer: number;
};

export function Preferimi({
  udhetimId,
  fillimishtRuajtur,
  fillimishtNumer,
}: PreferimiProps) {
  const [ruajtur, setRuajtur] = useState(fillimishtRuajtur);
  const [numer, setNumer] = useState(fillimishtNumer);
  const [poRuhet, setPoRuhet] = useState(false);
  const [gabim, setGabim] = useState("");

  async function ruaj() {
    if (ruajtur || poRuhet) return;

    setGabim("");
    setRuajtur(true);
    setNumer((vlera) => vlera + 1);
    setPoRuhet(true);

    try {
      const response = await fetch(`/api/preferimet/${udhetimId}`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        ruajtur?: boolean;
        numer?: number;
        error?: string;
      };
      if (!response.ok || data.ruajtur !== true || typeof data.numer !== "number") {
        throw new Error(data.error ?? "Preferimi nuk u ruajt.");
      }
      setNumer(data.numer);
    } catch (error) {
      setRuajtur(false);
      setNumer((vlera) => Math.max(0, vlera - 1));
      setGabim(error instanceof Error ? error.message : "Preferimi nuk u ruajt.");
    } finally {
      setPoRuhet(false);
    }
  }

  return (
    <div className="favorite-box">
      <button
        aria-label={ruajtur ? "Udhëtimi është i ruajtur" : "Ruaj udhëtimin"}
        className={`favorite-button${ruajtur ? " favorite-button-saved" : ""}`}
        disabled={ruajtur || poRuhet}
        onClick={ruaj}
        type="button"
      >
        <span aria-hidden="true">{ruajtur ? "★" : "☆"}</span>{" "}
        {poRuhet ? "Po ruhet…" : ruajtur ? "I ruajtur" : "Ruaj udhëtimin"}
      </button>
      <strong className="favorite-count">Të preferuarat {numer}</strong>
      <span className="favorite-status" role={gabim ? "alert" : "status"}>
        {gabim || (poRuhet ? "Po presim konfirmimin e serverit." : ruajtur ? "U ruajt te të preferuarat." : "Nuk është te të preferuarat.")}
      </span>
      <small>Preferim personal · jo rezervim</small>
    </div>
  );
}
