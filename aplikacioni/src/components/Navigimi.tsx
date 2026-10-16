import Link from "next/link";

export function Navigimi() {
  return (
    <header className="topbar">
      <Link aria-label="RideShare, faqja kryesore" className="brand" href="/">
        <span aria-hidden="true" className="brand-mark">
          R
        </span>
        <span className="brand-copy">
          <strong>RideShare</strong>
          <small>Komuniteti AAB</small>
        </span>
      </Link>
      <Link className="nav-link" href="/panel">
        Paneli im <span aria-hidden="true">↗</span>
      </Link>
    </header>
  );
}
