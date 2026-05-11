import Link from "next/link";
import { listRaffleFolderFiles, toPublicBoxError } from "@/lib/box";
import EntriesTableClient from "./entries-table-client";

export const dynamic = "force-dynamic";

export default async function EntriesPage() {
  let rows = [];
  let error = null;

  try {
    rows = await listRaffleFolderFiles();
  } catch (e) {
    error = toPublicBoxError(e);
  }

  return (
    <main className="page entries-page">
      <section className="shell entries-shell">
        <header className="header">
          <p className="kicker">Box raffle intake</p>
          <h1>Raffle entries</h1>
          <p className="lede">
            Files in the configured Raffle folder, with first and last name from
            global metadata (properties template).
          </p>
          <p className="entries-nav">
            <Link href="/">← Back to entry form</Link>
          </p>
        </header>

        {error ? (
          <div className="entries-error" role="alert">
            {error.message}
          </div>
        ) : (
          <EntriesTableClient rows={rows} />
        )}
      </section>
    </main>
  );
}
