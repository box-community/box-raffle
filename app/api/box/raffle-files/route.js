import { deleteAllRaffleFolderFiles, toPublicBoxError } from "@/lib/box";
import {
  getSecretAuthorizationError,
  secretProtectedJsonResponse,
} from "@/lib/secret-auth";

export const dynamic = "force-dynamic";

export async function DELETE(request) {
  const authError = getSecretAuthorizationError(request);

  if (authError) {
    return secretProtectedJsonResponse(authError);
  }

  try {
    await deleteAllRaffleFolderFiles();

    return Response.json(
      { success: true },
      {
        status: 200,
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
