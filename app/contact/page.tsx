import type { Metadata } from "next";
import { Shell, Card } from "@/components/ui";
import { COMPANY, telHref } from "@/lib/company";
import { SimpleInquiryForm } from "@/components/forms/SimpleInquiryForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Private Note Capital team.",
};

export default function ContactPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-3xl font-semibold text-navy">Contact</h1>
        <p className="mt-2 text-navy-muted">
          Questions about a property, the auction calendar, or financing? Reach the team directly.
        </p>
        <Card className="mt-6 p-6">
          <dl className="flex flex-col gap-4 text-[15px]">
            <Row label="Company" value={`${COMPANY.legalName} · NMLS ${COMPANY.nmls}`} />
            <Row label="Office" value={<a className="text-accent hover:underline" href={telHref(COMPANY.phoneOffice)}>{COMPANY.phoneOffice}</a>} />
            <Row label="Direct" value={<a className="text-accent hover:underline" href={telHref(COMPANY.phoneDirect)}>{COMPANY.phoneDirect}</a>} />
            <Row label="Email" value={<a className="text-accent hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>} />
            <Row label="Mail" value={COMPANY.mailingAddress} />
          </dl>
        </Card>
        <p className="mt-4 text-sm text-navy-muted">
          To move on a specific opportunity, use <a className="text-accent hover:underline" href="/financing">Request financing</a> so
          your inquiry is connected to the property.
        </p>

        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-navy">Send a message</h2>
          <p className="mt-1 mb-4 text-sm text-navy-muted">We&apos;ll route it to the right person and reply shortly.</p>
          <SimpleInquiryForm
            endpoint="/api/contact"
            messageLabel="How can we help?"
            submitLabel="Send message"
            successText="Thanks — your message was received. We'll get back to you shortly."
          />
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <dt className="font-mono text-[11px] uppercase tracking-wide text-navy-muted">{label}</dt>
      <dd className="text-navy">{value}</dd>
    </div>
  );
}
