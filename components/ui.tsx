// Presentational primitives shared across pages. All server-safe (no hooks),
// so they can render in Server Components.
import Link from "next/link";
import type { ReactNode } from "react";

export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-shell px-5 sm:px-6 ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-12 sm:py-16 ${className}`}>
      <Shell>{children}</Shell>
    </section>
  );
}

// Labels above headings are retired site-wide: the heading carries its own weight.
// The component stays so existing pages compile; it renders nothing.
export function Kicker(_props: { children?: ReactNode }) {
  return null;
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-serif text-[28px] font-extrabold leading-[1.08] tracking-display text-navy sm:text-[40px] ${className}`}>
      {children}
    </h2>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "quiet" | "signal";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  full?: boolean;
};

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none";
const BTN_VARIANT: Record<string, string> = {
  primary: "bg-accent text-white hover:bg-accent-ink",
  ghost: "border-2 border-navy bg-transparent text-navy hover:bg-navy hover:text-white",
  quiet: "text-accent underline decoration-2 hover:text-accent-ink",
  signal: "bg-signal text-signal-ink hover:bg-signal-hover",
};
const BTN_SIZE: Record<string, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3.5 text-[16px]",
};

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  full,
}: ButtonProps) {
  const cls = `${BTN_BASE} ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${full ? "w-full" : ""} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-hairline bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-hairlineStrong bg-surface/60 px-6 py-12 text-center">
      <p className="font-serif text-xl font-bold text-navy">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm text-navy-muted">{children}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "positive" | "warn";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-canvas text-navy-muted border-hairlineStrong",
    accent: "bg-accent-soft text-accent-ink border-transparent",
    positive: "bg-accent-soft text-positive border-transparent",
    warn: "bg-[#FBEFD6] text-warn border-transparent",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-navy">
        {label} {required ? <span className="text-warn">*</span> : null}
        {hint ? <span className="ml-1 font-normal text-navy-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-hairlineStrong bg-surface px-3.5 py-3 text-[16px] text-navy placeholder:text-[#6F8077] hover:border-navy-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";
