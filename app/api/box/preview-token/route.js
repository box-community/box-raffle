import { issuePreviewTokenForRaffleFile, toPublicBoxError } from "@/lib/box";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return Response.json(
      { message: "Query parameter fileId is required." },
      { status: 400 },
    );
  }

  try {
    const token = await issuePreviewTokenForRaffleFile(fileId);

    return Response.json(
      {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
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
