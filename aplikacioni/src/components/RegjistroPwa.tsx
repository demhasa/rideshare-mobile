"use client";

import { useEffect } from "react";

export function RegjistroPwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Regjistrimi i service worker të RideShare dështoi.", error);
    });
  }, []);

  return null;
}
