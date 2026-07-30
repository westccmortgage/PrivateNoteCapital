import type { Metadata } from "next";
import { Shell, Kicker } from "@/components/ui";
import { SimpleInquiryForm } from "@/components/forms/SimpleInquiryForm";

export const metadata: Metadata = {
  title: "Request a Consultation",
  description: "Book a deal review or consultation with the Private Note Capital team.",
};

export default function ReviewPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <Kicker>Private Debt · Consultation</Kicker>
        <h1 className="font-serif text-3xl font-semibold text-navy">Request a consultation</h1>
        <p className="mt-2 text-navy-muted">
          Tell us briefly about your deal or what you&apos;d like to discuss, and a licensed
          professional will follow up. This is not a commitment of any kind.
        </p>
        <div className="mt-6">
          <SimpleInquiryForm
            endpoint="/api/private-debt"
            requestType="book_review"
            messageLabel="Tell us briefly about your deal"
            messagePlaceholder="Property, scenario, position, timeline…"
            submitLabel="Request consultation"
            successText="Thanks — we received your request and will reach out shortly."
          />
        </div>
      </div>
    </Shell>
  );
}
