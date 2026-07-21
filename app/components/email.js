import {
  RAFFLE_SUCCESS_TITLE,
  SuccessDetails,
} from "@/app/components/success-content";

export function EmailTemplate({ sharedLink }) {
  return (
    <div style={styles.body}>
      <h1 style={styles.heading}>{RAFFLE_SUCCESS_TITLE}</h1>
      <SuccessDetails sharedLink={sharedLink} isEmail />
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: "#f4f1eb",
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
};
