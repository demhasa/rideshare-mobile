export default function Offline() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a aria-label="RideShare, provo faqen kryesore" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            R
          </span>
          <span className="brand-copy">
            <strong>RideShare</strong>
            <small>Komuniteti AAB</small>
          </span>
        </a>
        <span className="role-badge">Jashtë linje</span>
      </header>
      <section className="message-card">
        <span aria-hidden="true" className="message-icon">
          ○
        </span>
        <p className="eyebrow">PA LIDHJE INTERNETI</p>
        <h1>Nuk je online për momentin.</h1>
        <p>
          Udhëtimet kërkojnë lidhje me databazën. Kur të rikthehet interneti,
          rifresko faqen për të parë oraret e fundit.
        </p>
        <a className="button button-primary" href="/">
          Provo përsëri
        </a>
      </section>
    </main>
  );
}
