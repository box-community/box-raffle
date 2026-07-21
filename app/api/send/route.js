import { EmailTemplate } from "@/app/components/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const validationError = validatePayload(body);

    if (validationError) {
      return Response.json({ message: validationError }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { message: "RESEND_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const fileId = body.fileId.trim();
    const recipient = body.to.trim();
    const sharedLink = getSafeBoxSharedLink(body.sharedLink);
    const { data, error } = await resend.emails.send(
      {
        from:
          process.env.RESEND_FROM_EMAIL ||
          "Box Raffle <onboarding@resend.dev>",
        to: [recipient],
        subject: "Raffle entry submitted 🤞",
        react: EmailTemplate({ sharedLink }),
      },
      {
        idempotencyKey: `raffle-entry-${fileId}`,
      },
    );

    if (error) {
      return Response.json(
        { message: error.message || "Unable to send confirmation email." },
        { status: 502 },
      );
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { message: error?.message || "Unable to send confirmation email." },
      { status: 500 },
    );
  }
}

function validatePayload(body) {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }

  if (!body.fileId || typeof body.fileId !== "string") {
    return "A Box file ID is required.";
  }

  if (!/^\d+$/.test(body.fileId.trim())) {
    return "Enter a valid Box file ID.";
  }

  if (!body.to || typeof body.to !== "string") {
    return "A recipient email address is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to.trim())) {
    return "Enter a valid recipient email address.";
  }

  if (!getSafeBoxSharedLink(body.sharedLink)) {
    return "A valid Box shared link is required.";
  }

  return "";
}

function getSafeBoxSharedLink(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  try {
    const url = new URL(value);
    const isBoxHost =
      url.hostname === "box.com" || url.hostname.endsWith(".box.com");

    return url.protocol === "https:" && isBoxHost ? url.toString() : "";
  } catch {
    return "";
  }
}
