import { timingSafeEqual } from "node:crypto";

export function getSecretAuthorizationError(request) {
  const secret = process.env.SECRET;

  if (!secret) {
    return {
      status: 503,
      message: "Protected endpoint is not configured.",
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

export function secretProtectedJsonResponse(authError) {
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

function secretsMatch(provided, expected) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
