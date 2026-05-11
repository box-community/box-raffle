import "./globals.css";

export const metadata = {
  title: "Box Raffle",
  description: "Upload raffle files to Box and store entrant metadata.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn01.boxcdn.net/platform/elements/26.0.0/en-US/uploader.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
