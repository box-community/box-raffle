import { CALENDAR_HREF } from "@/app/components/email";
import {
  RAFFLE_SUCCESS_TITLE,
  SuccessDetails,
} from "@/app/components/success-content";

export default async function SuccessPage({ searchParams }) {
  const params = await searchParams;
  const sharedLink = getSafeSharedLink(params?.sharedLink);

  return (
    <main className="page success-page">
      <section className="shell success-shell" aria-labelledby="success-title">
        <header className="header">
          <img src="/box-devs.png" alt="Box Devs logo" className="logo" width={200} />
          <h1 id="success-title">{RAFFLE_SUCCESS_TITLE}</h1>
          <p className="lede">
            Raffle drawing will be held on Friday, Sept 25 at 1:00pm at the Box Booth. Remember, you MUST be present to win!
          </p>
          <p>
            <a target="_blank" rel="noreferrer" href={CALENDAR_HREF}>
              Add to calendar
            </a>
          </p>
        </header>

        <SuccessDetails sharedLink={sharedLink} />
      </section>
    </main>
  );
}

function getSafeSharedLink(value) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return "";
  }

  try {
    const url = new URL(candidate);
    const isBoxHost =
      url.hostname === "box.com" || url.hostname.endsWith(".box.com");

    return url.protocol === "https:" && isBoxHost ? url.toString() : "";
  } catch {
    return "";
  }
}
