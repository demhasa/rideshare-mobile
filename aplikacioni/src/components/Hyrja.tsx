"use client";

import { signIn, signOut } from "next-auth/react";

export default function Hyrja({
  brenda,
  oauthGati,
}: {
  brenda: boolean;
  oauthGati: boolean;
}) {
  if (!brenda && !oauthGati) {
    return (
      <p className="notice notice-error" role="alert">
        Hyrja me GitHub nuk është konfiguruar ende. Plotëso vlerat OAuth në
        `.env.local` dhe rinis aplikacionin.
      </p>
    );
  }

  return brenda ? (
    <button
      className="button button-secondary"
      onClick={() => signOut({ callbackUrl: "/panel" })}
      type="button"
    >
      Dil nga llogaria
    </button>
  ) : (
    <button
      className="button button-primary"
      onClick={() => signIn("github", { callbackUrl: "/panel" })}
      type="button"
    >
      Hyr me GitHub
    </button>
  );
}
