import {
  formatRaffleEntriesCsv,
  listRaffleFolderFilesForCsvExport,
  toPublicBoxError,
} from "@/lib/box";
import {
  getSecretAuthorizationError,
  secretProtectedJsonResponse,
} from "@/lib/secret-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = getSecretAuthorizationError(request);

  if (authError) {
    return secretProtectedJsonResponse(authError);
  }

  try {
    const rows = await listRaffleFolderFilesForCsvExport();
    const csv = formatRaffleEntriesCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="raffle-entries.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const publicError = toPublicBoxError(error);

    return Response.json(publicError, {
      status: publicError.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
