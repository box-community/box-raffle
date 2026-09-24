import {
  RAFFLE_SUCCESS_TITLE,
  SuccessDetails,
} from "@/app/components/success-content";

const CALENDAR_HREF =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=AIEWF%3A%20Xbox%20Raffle%20at%20Box%20Booth&dates=20260925T130000/20260925T132000&ctz=America%2FLos_Angeles&details=Join%20us%20for%20the%20live%20drawing%20for%20an%20Xbox%21%20Remember%2C%20you%20MUST%20be%20present%20to%20win.";

export function EmailTemplate({ sharedLink }) {
  return (
    <div style={styles.body}>
      <h1 style={styles.heading}>{RAFFLE_SUCCESS_TITLE}</h1>
      <p style={styles.lede}>
        Raffle drawing will be held on Friday, Sept 25 at 1:00pm at the Box
        Booth. Remember, you MUST be present to win!
      </p>
      <p style={styles.paragraph}>
        <a href={CALENDAR_HREF} target="_blank" rel="noreferrer">
          Add to calendar
        </a>
      </p>
      <SuccessDetails sharedLink={sharedLink} isEmail />
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: "#fff",
    color: "#18202f",
    fontFamily: "Arial, sans-serif",
    margin: "0 auto",
    maxWidth: "720px",
    padding: "40px 20px",
  },
  heading: {
    fontSize: "36px",
    lineHeight: "1.1",
    margin: "0 0 24px",
  },
  lede: {
    color: "#5f6675",
    fontSize: "18px",
    lineHeight: "1.5",
    margin: "0 0 12px",
  },
  paragraph: {
    color: "#5f6675",
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
};
