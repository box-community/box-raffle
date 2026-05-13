import {
  getTempUploaderConfig,
  toPublicBoxError,
} from "@/lib/box";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { folder, token } = await getTempUploaderConfig();

    return Response.json(
      {
        folderId: folder.id,
        folderName: folder.name,
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
