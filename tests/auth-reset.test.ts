import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  passwordInputType,
  validateNewPassword,
  siteOrigin,
  buildResetRedirect,
  sanitizeNextPath,
  recoveryPageState,
  RESET_LINK_SENT,
  RESET_LINK_INVALID,
  LOGIN_RESET_SUCCESS,
  PASSWORD_MIN,
} from "@/lib/auth-reset";

// --- Password visibility toggle (scenarios 1,2,3) ---
test("password type: hidden by default, revealed when toggled", () => {
  assert.equal(passwordInputType(false), "password"); // default hidden (1) / re-hide (3)
  assert.equal(passwordInputType(true), "text"); // shown after toggle (2)
});

// --- PasswordInput implementation guarantees: hidden by default + non-submitting
//     toggle with accessible labels (1,4). Verified by static analysis of the
//     component source (avoids a DOM/JSX runtime in the node test harness). ---
test("PasswordInput: default-hidden, type=button toggle, a11y labels", () => {
  const src = readFileSync("components/PasswordInput.tsx", "utf8");
  assert.match(src, /useState\(false\)/); // visibility hidden by default (1)
  assert.match(src, /passwordInputType\(visible\)/); // input type derives from visibility
  assert.match(src, /type="button"/); // toggle never submits the form (4)
  assert.match(src, /aria-label=\{visible \? "Hide password" : "Show password"\}/); // a11y
  // Value is a controlled prop, never persisted to storage.
  assert.ok(!/localStorage|sessionStorage/.test(src));
});

// --- Reset request targets /auth/reset-password via /auth/callback (7) ---
test("buildResetRedirect points at the callback then the reset page", () => {
  const url = buildResetRedirect("https://privatenotecapital.com");
  assert.ok(url.startsWith("https://privatenotecapital.com/auth/callback?next="));
  assert.ok(decodeURIComponent(url).includes("/auth/reset-password"));
});

// --- Production origin, never localhost (4/redirect requirement) ---
test("siteOrigin prefers NEXT_PUBLIC_SITE_URL and never falls back to localhost", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://privatenotecapital.com/";
  assert.equal(siteOrigin(), "https://privatenotecapital.com"); // trailing slash trimmed
  delete process.env.NEXT_PUBLIC_SITE_URL;
  // No window in node → falls back to the canonical production URL, never localhost.
  const fallback = siteOrigin();
  assert.ok(!fallback.includes("localhost"));
  assert.equal(fallback, "https://privatenotecapital.com");
  if (prev !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prev;
});

// --- Callback safety: next path is sanitized to an internal path ---
test("sanitizeNextPath only allows internal single-slash paths", () => {
  assert.equal(sanitizeNextPath("/auth/reset-password"), "/auth/reset-password");
  assert.equal(sanitizeNextPath("//evil.com"), "/");
  assert.equal(sanitizeNextPath("https://evil.com"), "/");
  assert.equal(sanitizeNextPath(null), "/");
  assert.equal(sanitizeNextPath("/saved"), "/saved");
});

// --- Privacy-safe reset message: no email enumeration (8) ---
test("reset request message never reveals whether an email exists", () => {
  assert.match(RESET_LINK_SENT, /if an account exists/i);
  assert.ok(!/we (just )?sent|does not exist|no account/i.test(RESET_LINK_SENT));
});

// --- Recovery page state (9,14,15) ---
test("recoveryPageState: session→form, error/no-session→invalid", () => {
  assert.equal(recoveryPageState({ hasSession: true }), "form"); // valid session (9)
  assert.equal(recoveryPageState({ error: true }), "invalid"); // expired/used link (14)
  assert.equal(recoveryPageState({ hasSession: false }), "invalid"); // missing session (15)
});

// --- New-password validation (10,11,12) ---
test("validateNewPassword: length + match rules", () => {
  assert.equal(validateNewPassword("short", "short").ok, false); // < 8 (11)
  assert.equal(validateNewPassword("longenough1", "different1").ok, false); // mismatch (10)
  assert.equal(validateNewPassword("longenough1", "longenough1").ok, true); // valid → allows updateUser (12)
  assert.equal(PASSWORD_MIN, 8);
});

// --- Login success + invalid-link copy (17,18) ---
test("login shows the reset-success message; invalid-link copy is safe", () => {
  assert.match(LOGIN_RESET_SUCCESS, /your password has been reset/i);
  assert.match(RESET_LINK_INVALID, /invalid or has expired/i);
});

// --- No password/token/code is logged in the auth surfaces (16) ---
test("auth reset files never log passwords, tokens, or codes", () => {
  const files = [
    "components/PasswordInput.tsx",
    "app/auth/reset-password/page.tsx",
    "app/auth/callback/route.ts",
    "lib/auth-reset.ts",
  ];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/console\.\w+\([^)]*(password|token|code)/i.test(src), `${f} must not log secrets`);
    // These surfaces should not log at all.
    assert.ok(!/console\./.test(src), `${f} should contain no console statements`);
  }
});

// --- Reset page behavior guarantees (12,13,17) ---
test("reset page: duplicate-submit guard, updateUser, sign-out + success redirect", () => {
  const src = readFileSync("app/auth/reset-password/page.tsx", "utf8");
  assert.match(src, /if \(busy\) return/); // duplicate submission prevented (13)
  assert.match(src, /updateUser\(\{ password \}\)/); // changes the password (12)
  assert.match(src, /signOut\(\)/); // end the recovery session
  assert.match(src, /\/login\?password_reset=success/); // success redirect (17)
  assert.ok(!/localStorage|sessionStorage/.test(src)); // no password persistence
});

// --- Callback route: PKCE exchange + safe failure, no logging (5) ---
test("callback route: exchanges code, safe invalid redirect, no logging", () => {
  const src = readFileSync("app/auth/callback/route.ts", "utf8");
  assert.match(src, /exchangeCodeForSession\(code\)/); // PKCE exchange
  assert.match(src, /reset-password\?error=invalid/); // safe failure destination
  assert.ok(!/console\./.test(src)); // never log codes/tokens
});

// --- Modules import cleanly (registration/sign-in paths intact) (5,6) ---
test("auth modules load without error", async () => {
  const authForm = await import("@/components/forms/AuthForm");
  assert.equal(typeof authForm.AuthForm, "function");
});
