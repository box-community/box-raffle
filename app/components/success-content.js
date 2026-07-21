export const RAFFLE_SUCCESS_TITLE = "Raffle entry submitted 🤞";

const SOURCE_CODE_URL = "https://github.com/box-community/box-raffle";

export function SuccessDetails({ sharedLink, isEmail = false }) {
  return (
    <div
      className={isEmail ? undefined : "success-panel"}
      style={isEmail ? styles.panel : undefined}
    >
      {sharedLink ? (
        <>
          <p style={isEmail ? styles.paragraph : undefined}>
            Your selfie is available at{" "}
            <a
              className={isEmail ? undefined : "shared-link-url"}
              href={sharedLink}
              target="_blank"
              rel="noreferrer"
              style={isEmail ? styles.link : undefined}
            >
              {sharedLink}
            </a>
            .
          </p>
          <div
            className={isEmail ? undefined : "success-actions"}
            style={isEmail ? styles.actions : undefined}
          >
            <a
              className={isEmail ? undefined : "submit-button success-link-button"}
              href={sharedLink}
              target="_blank"
              rel="noreferrer"
              style={isEmail ? styles.button : undefined}
            >
              Download your selfie
            </a>
          </div>
        </>
      ) : null}
      <p style={isEmail ? styles.paragraph : undefined}>
        The source code for this app is available on{" "}
        <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
    </div>
  );
}

const styles = {
  actions: {
    margin: "20px 0",
  },
  button: {
    backgroundColor: "#0061d5",
    borderRadius: "7px",
    color: "#ffffff",
    display: "inline-block",
    fontWeight: "700",
    padding: "14px 22px",
    textDecoration: "none",
  },
  link: {
    overflowWrap: "anywhere",
  },
  panel: {
    backgroundColor: "#ffffff",
    border: "1px solid #d8d1c7",
    borderRadius: "8px",
    padding: "28px",
  },
  paragraph: {
    color: "#5f6675",
    lineHeight: "1.6",
  },
};
