import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/notify";
import { sendLeadToGRCRM } from "@/lib/grcrm-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BookBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export async function POST(request: Request) {
  let body: BookBody;
  try {
    body = (await request.json()) as BookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json(
      { error: "Please add your name and a valid email." },
      { status: 400 },
    );
  }

  const leadBody = [
    `New "Book a deal review" request from CADeed.com`,
    ``,
    `Name:  ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "—"}`,
    ``,
    `Message:`,
    message || "(none)",
  ].join("\n");

  const grcrm = await sendLeadToGRCRM({ name, email, phone, message: leadBody });
  const result = await sendNotificationEmail(
    `New deal-review request — ${name}`,
    leadBody,
    email, // reply-to → answer the lead directly
  );

  return NextResponse.json(
    {
      ok: true,
      forwarded: grcrm.sent,
      emailed: result.sent,
      message: "Thanks — we received your request and will reach out shortly.",
    },
    { status: 200 },
  );
}
