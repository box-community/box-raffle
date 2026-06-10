import { timingSafeEqual } from "node:crypto";
import {
  formatRaffleEntriesCsv,
  listRaffleFolderFiles,
  toPublicBoxError,
} from "@/lib/box";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authError = getAuthorizationError(request);

  if (authError) {
    return Response.json(
      { message: authError.message },
      {
        status: authError.status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const rows = await listRaffleFolderFiles();
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

function getAuthorizationError(request) {
  const secret = process.env.SECRET;

  if (!secret) {
    return {
      status: 503,
      message: "CSV export is not configured.",
    };
  }

  const providedSecret = request.headers.get("x-secret") || "";

  if (!secretsMatch(providedSecret, secret)) {
    return {
      status: 401,
      message: "Unauthorized.",
    };
  }

  return null;
}

function secretsMatch(provided, expected) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
