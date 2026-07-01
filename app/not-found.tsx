import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-engine flex-col items-start px-5 py-24 sm:px-8">
        <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          404
        </span>
        <h1 className="mt-3 text-[32px] font-semibold tracking-tight text-navy sm:text-[40px]">
          Page not found.
        </h1>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-navy-muted">
          The page you are looking for does not exist or has moved. Head back home to learn how
          capital partners participate in California trust deeds.
        </p>
        <a
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-[15px] font-medium text-white/95 transition-colors hover:bg-navy-soft"
        >
          Back to home
        </a>
      </main>
      <Footer />
    </div>
  );
}
