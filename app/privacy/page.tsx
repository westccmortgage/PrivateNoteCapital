import type { Metadata } from "next";
import { Shell } from "@/components/ui";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Private Note Capital handles lead information, saved-property activity, and preferences.",
};

export default function PrivacyPage() {
  return (
    <Shell className="py-10">
      <article className="mx-auto max-w-2xl text-[15px] leading-relaxed text-navy-soft">
        <h1 className="font-serif text-3xl font-semibold text-navy">Privacy Policy</h1>
        <p className="mt-2 text-sm text-navy-muted">Operated by {COMPANY.legalName} (NMLS {COMPANY.nmls}).</p>

        <Sec title="Information we collect">
          We collect information you provide directly — your name, email, phone, investor experience,
          financing preferences, and any notes — when you register, save a property, subscribe to the
          weekly watchlist, or request a deal review or financing. We also record which properties you
          save and the search preferences you set.
        </Sec>
        <Sec title="Saved-property activity & search preferences">
          When you have an account, your saved properties, auction-tracking selections, and watchlist
          criteria are stored so we can show them back to you and send the alerts you asked for. You can
          remove saved properties and unsubscribe at any time.
        </Sec>
        <Sec title="Email alerts">
          We send the weekly watchlist and related alerts only after you explicitly opt in. Every alert
          email includes an unsubscribe option. We do not sell your email address.
        </Sec>
        <Sec title="How we use your information">
          To operate the platform, respond to your requests, evaluate financing inquiries, and improve
          the service. Lead and financing-request information may be shared with {COMPANY.shortName} and
          its licensed capital sources for the purpose of following up on your request.
        </Sec>
        <Sec title="Tracking & analytics">
          We may use privacy-respecting analytics and campaign parameters (UTM tags) to understand how
          visitors reach the site. We attach these parameters to your inquiry so we can attribute and
          respond to it appropriately.
        </Sec>
        <Sec title="Third-party & affiliate links">
          Property pages may link to official county or auction-operator sources, and the site may
          contain affiliate links to data providers. Those third-party sites have their own privacy
          practices, which we do not control.
        </Sec>
        <Sec title="Financing requests">
          Information submitted in a financing request is used to review the opportunity. Submitting a
          request is not an application for a specific loan and does not by itself trigger a credit pull.
        </Sec>
        <Sec title="Data retention & security">
          We retain lead and account information for as long as needed to provide the service and meet
          legal obligations. Access to stored data is restricted, and sensitive operations are performed
          server-side. No method of transmission or storage is perfectly secure.
        </Sec>
        <Sec title="Your choices">
          You can request access to, correction of, or deletion of your information, and you can
          unsubscribe from alerts at any time, by contacting us.
        </Sec>
        <Sec title="Contact">
          {COMPANY.legalName}, {COMPANY.mailingAddress}. Email {COMPANY.email}. Phone {COMPANY.phoneOffice}.
        </Sec>
      </article>
    </Shell>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-1">{children}</p>
    </section>
  );
}
