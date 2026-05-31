import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="page success-page">
      <section className="shell success-shell" aria-labelledby="success-title">
        <header className="header">
          <img src="/box-devs.png" alt="Box Devs logo" className="logo" width={200} />
          <h1 id="success-title">Entry submitted</h1>
          <p className="lede">
            Your file has been tagged with your raffle metadata in the Raffle folder.
          </p>
        </header>

        <div className="success-panel">
          <p>The source code for this app is available on <a href="https://github.com/box-community/box-raffle" target="_blank">GitHub</a>.</p>
        </div>
      </section>
    </main>
  );
}
