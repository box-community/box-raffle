import { applyRaffleMetadata, toPublicBoxError } from "@/lib/box";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const validationError = validatePayload(body);

    if (validationError) {
      return Response.json({ message: validationError }, { status: 400 });
    }

    const metadata = await applyRaffleMetadata(body.fileId, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
    });

    return Response.json({
      fileId: body.fileId,
      metadata,
    });
  } catch (error) {
    const publicError = toPublicBoxError(error);

    return Response.json(publicError, { status: publicError.status });
  }
}

function validatePayload(body) {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }

  if (!body.fileId || typeof body.fileId !== "string") {
    return "A Box file ID is required.";
  }

  if (!body.firstName || typeof body.firstName !== "string") {
    return "First name is required.";
  }

  if (!body.lastName || typeof body.lastName !== "string") {
    return "Last name is required.";
  }

  if (!body.email || typeof body.email !== "string") {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return "Enter a valid email address.";
  }

  return "";
}
