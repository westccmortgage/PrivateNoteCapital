import Link from "next/link";
import { toQueryString, PAGE_SIZE, type SearchFilter } from "@/lib/search";

// Server-rendered, shareable pagination (prev/next preserve all query params).
export function Pagination({ filter, total }: { filter: SearchFilter; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const page = Math.min(filter.page, pages);
  const prevQs = toQueryString({ ...filter, page: page - 1 });
  const nextQs = toQueryString({ ...filter, page: page + 1 });

  return (
    <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
      {page > 1 ? (
        <Link href={`/search?${prevQs}`} className="rounded-lg border border-hairlineStrong bg-surface px-4 py-2 text-sm font-semibold text-navy hover:border-navy-muted">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-navy-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={`/search?${nextQs}`} className="rounded-lg border border-hairlineStrong bg-surface px-4 py-2 text-sm font-semibold text-navy hover:border-navy-muted">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
