import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/notify";
import { sendLeadToGRCRM } from "@/lib/grcrm-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InvestorBody {
  name?: string;
  email?: string;
  phone?: string;
  capitalRange?: string;
  lienPreference?: string;
  timeline?: string;
  message?: string;
  consentGiven?: boolean;
}

/**
 * Capital-partner (investor) intake. Consent-gated. Forwarded to GRCRM tagged
 * INVESTOR and emailed, so no interested partner is ever lost. Nothing here is
 * an offer of securities.
 */
export async function POST(request: Request) {
  let body: InvestorBody;
  try {
    body = (await request.json()) as InvestorBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();

  if (!name || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json(
      { error: "Please add your name and a valid email." },
      { status: 400 },
    );
  }
  if (body.consentGiven !== true) {
    return NextResponse.json(
      { error: "Please check the consent box so a representative can contact you." },
      { status: 400 },
    );
  }

  const leadMessage = [
    `[INVESTOR] Capital-partner inquiry from PrivateNoteCapital.com`,
    ``,
    `Capital to deploy: ${body.capitalRange?.trim() || "—"}`,
    `Lien preference:   ${body.lienPreference?.trim() || "—"}`,
    `Timeline:          ${body.timeline?.trim() || "—"}`,
    ``,
    `Notes: ${body.message?.trim() || "(none)"}`,
  ].join("\n");

  const grcrm = await sendLeadToGRCRM({ name, email, phone, message: leadMessage });
  const emailResult = await sendNotificationEmail(
    `New capital-partner inquiry — ${name}`,
    [
      `New INVESTOR / capital-partner inquiry from PrivateNoteCapital.com`,
      ``,
      `Name:  ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      leadMessage.split("\n").slice(2).join("\n"),
    ].join("\n"),
    email, // reply-to → answer the lead directly
  );

  return NextResponse.json(
    {
      ok: true,
      forwarded: grcrm.sent,
      emailed: emailResult.sent,
      message:
        "Thanks — a representative will reach out with information. This is not an offer of securities.",
    },
    { status: 200 },
  );
}
