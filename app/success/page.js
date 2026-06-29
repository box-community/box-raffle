import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="page success-page">
      <section className="shell success-shell" aria-labelledby="success-title">
        <header className="header">
          <img src="/box-devs.png" alt="Box Devs logo" className="logo" width={200} />
          <h1 id="success-title">Entry submitted</h1>
          <p className="lede">
            Raffle drawing will be held on July 2nd at 12:50pm PST. Remember, you MUST be present to win!
          </p>
          <p><a target="_blank" href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=AIEWF%3A%20Xbox%20Raffle%20at%20Box%20Booth&dates=20260702T125000/20260702T131000&ctz=America%2FLos_Angeles&details=Join%20us%20for%20the%20live%20drawing%20for%20an%20Xbox%21%20Remember%2C%20you%20MUST%20be%20present%20to%20win.">Add to calendar</a></p>
        </header>

        <div className="success-panel">
          <p>The source code for this app is available on <a href="https://github.com/box-community/box-raffle" target="_blank">GitHub</a>.</p>
        </div>
      </section>
    </main>
  );
}
