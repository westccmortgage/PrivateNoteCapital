import Link from "next/link";
import { Shell } from "@/components/ui";

export default function NotFound() {
  return (
    <Shell className="py-24 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-navy">Page not found</h1>
      <p className="mt-2 text-navy-muted">The page you&apos;re looking for isn&apos;t here.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-lg bg-accent px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-accent-ink">
          Home
        </Link>
        <Link href="/search" className="rounded-lg border border-hairlineStrong bg-surface px-5 py-2.5 text-[15px] font-semibold text-navy hover:border-navy-muted">
          Search properties
        </Link>
      </div>
    </Shell>
  );
}
