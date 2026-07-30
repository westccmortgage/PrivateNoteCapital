// Pure, framework-agnostic helpers for the password-reset flow. Client-safe and
// unit-testable (no Supabase, no React). Never logs or stores passwords.

export const PASSWORD_MIN = 8; // consistent with registration

export function passwordInputType(visible: boolean): "text" | "password" {
  return visible ? "text" : "password";
}

export interface NewPasswordResult {
  ok: boolean;
  error?: string;
}

/** Validate a new password + confirmation (min length, match). */
export function validateNewPassword(password: string, confirm: string): NewPasswordResult {
  if (!password || password.length < PASSWORD_MIN) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN} characters.` };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }
  return { ok: true };
}

/** Production origin: prefer NEXT_PUBLIC_SITE_URL, else the browser origin, else
 *  the canonical production URL. Never returns localhost in production builds. */
export function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://privatenotecapital.com";
}

/** Only allow an internal, single-slash path as a post-callback destination. */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/";
  // Must be a same-origin absolute path: starts with "/", not "//", no scheme.
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return "/";
  return next;
}

/** The redirect URL sent to Supabase resetPasswordForEmail. Lands on our server
 *  callback, which exchanges the PKCE code and forwards to the reset page. */
export function buildResetRedirect(origin: string = siteOrigin()): string {
  return `${origin.replace(/\/+$/, "")}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
}

/** Resolve which UI the reset page should show once state is known. */
export function recoveryPageState(opts: { error?: boolean; hasSession?: boolean }): "form" | "invalid" {
  if (opts.error) return "invalid";
  return opts.hasSession ? "form" : "invalid";
}

// Privacy-safe, user-facing copy (no raw Supabase errors, no email enumeration).
export const RESET_LINK_SENT =
  "If an account exists for that email, a password reset link has been sent.";
export const RESET_LINK_INVALID = "This password reset link is invalid or has expired.";
export const PASSWORD_CHANGED = "Your password has been changed.";
export const LOGIN_RESET_SUCCESS = "Your password has been reset. Sign in with your new password.";
