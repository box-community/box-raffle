import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="page success-page">
      <section className="shell success-shell" aria-labelledby="success-title">
        <header className="header">
          <img src="/box-devs.png" alt="Box Devs logo" className="logo" width={200} />
          <h1 id="success-title">Entry submitted</h1>
          <p className="lede">
            Your file has been renamed, tagged with your raffle metadata, and moved into the Raffle folder.
          </p>
        </header>

        <div className="success-panel">
          <p>Be back at the Box booth for the live drawing on <b>Thursday at 2:20pm!</b></p>
        </div>
      </section>
    </main>
  );
}
