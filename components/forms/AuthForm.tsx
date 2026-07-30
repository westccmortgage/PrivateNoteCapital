"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { buildResetRedirect, RESET_LINK_SENT } from "@/lib/auth-reset";

type Mode = "signin" | "register" | "reset";

// Email/password auth backed by Supabase Auth. Supports register, sign-in, and
// password reset (if the Supabase project has email enabled). `compact` renders
// the inline version used by Save/Track prompts.
export function AuthForm({
  initialMode = "signin",
  compact = false,
  onSignedIn,
  next = "/saved",
}: {
  initialMode?: Mode;
  compact?: boolean;
  onSignedIn?: () => void;
  next?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const supabase = getBrowserSupabase();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!supabase) {
      setErr("Accounts are not enabled yet. Please check back soon.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. If email verification is on, confirm via the link we sent.");
        const { data } = await supabase.auth.getUser();
        if (data.user) onSignedIn ? onSignedIn() : router.push(next);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSignedIn ? onSignedIn() : router.push(next);
      } else {
        // Password recovery: land on our server callback, which exchanges the
        // PKCE code and forwards to /auth/reset-password. Use the production
        // origin (never localhost) via buildResetRedirect().
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: buildResetRedirect() });
        // Privacy-safe: never reveal whether the email exists. Show the same
        // message regardless of the result.
        setMsg(RESET_LINK_SENT);
      }
    } catch {
      // Do not surface raw Supabase errors. For reset, still show the neutral
      // message so we never leak account existence.
      if (mode === "reset") setMsg(RESET_LINK_SENT);
      else setErr("Something went wrong. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
      <Field label="Email" required>
        <input type="email" required autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {mode !== "reset" ? (
        <Field label="Password" required hint={mode === "register" ? "(8+ characters)" : undefined}>
          <PasswordInput
            required
            minLength={8}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={setPassword}
          />
        </Field>
      ) : null}

      {err ? <p className="text-sm text-warn">{err}</p> : null}
      {msg ? <p className="text-sm text-positive">{msg}</p> : null}

      <Button type="submit" disabled={busy} full>
        {busy ? "Working…" : mode === "register" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
      </Button>

      <div className="flex flex-wrap justify-between gap-2 text-sm text-navy-muted">
        {mode !== "register" ? (
          <button type="button" className="text-accent hover:underline" onClick={() => setMode("register")}>Create an account</button>
        ) : (
          <button type="button" className="text-accent hover:underline" onClick={() => setMode("signin")}>Have an account? Sign in</button>
        )}
        {mode !== "reset" ? (
          <button type="button" className="hover:underline" onClick={() => setMode("reset")}>Forgot password?</button>
        ) : (
          <button type="button" className="hover:underline" onClick={() => setMode("signin")}>Back to sign in</button>
        )}
      </div>
    </form>
  );
}
