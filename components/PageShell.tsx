import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PageShellProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}

/**
 * Shared layout for the public marketing / tools / content pages: Header, a
 * clean hero, the page body, and the Footer. Apple-style, crisp and minimal.
 */
export default function PageShell({ eyebrow, title, intro, back, children }: PageShellProps) {
  return (
    <div id="top" className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-engine px-5 sm:px-8">
        <section className="pt-12 sm:pt-16">
          {back && (
            <a
              href={back.href}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-muted transition-colors hover:text-navy"
            >
              <ArrowLeft size={15} /> {back.label}
            </a>
          )}
          <div className={`max-w-2xl ${back ? "mt-6" : ""}`}>
            {eyebrow && (
              <span className="inline-block rounded-full border border-hairline bg-white/60 px-3.5 py-1.5 text-[12.5px] font-medium tracking-wide text-navy-muted">
                {eyebrow}
              </span>
            )}
            <h1 className="mt-5 font-serif text-balance text-[32px] font-medium leading-[1.1] tracking-tight text-navy sm:text-[44px]">
              {title}
            </h1>
            {intro && (
              <p className="mt-4 text-[16px] leading-relaxed text-navy-muted sm:text-[17px]">
                {intro}
              </p>
            )}
          </div>
        </section>

        <div className="mt-10 pb-10">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
