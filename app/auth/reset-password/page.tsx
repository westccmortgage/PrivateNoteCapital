"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Card, Button, Field } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  validateNewPassword,
  recoveryPageState,
  PASSWORD_MIN,
  RESET_LINK_INVALID,
} from "@/lib/auth-reset";

type View = "loading" | "form" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const supabase = getBrowserSupabase();

  // Determine whether a valid recovery session is present.
  useEffect(() => {
    const hasError =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("error") != null;

    if (!supabase) {
      setView("invalid");
      return;
    }

    let settled = false;
    const resolve = (hasSession: boolean) => {
      if (settled) return;
      settled = true;
      setView(recoveryPageState({ error: hasError, hasSession }));
    };

    // Fallback for hash-token (implicit) links: the client emits PASSWORD_RECOVERY
    // once it detects the recovery token in the URL.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) resolve(true);
    });

    // Primary path (PKCE): the /auth/callback route already exchanged the code and
    // set the session cookies, so getUser() succeeds here.
    supabase.auth.getUser().then(({ data }) => {
      // Give the auth-state listener a brief chance first; otherwise decide now.
      setTimeout(() => resolve(Boolean(data.user)), 400);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // prevent duplicate submissions
    setErr(null);
    const v = validateNewPassword(password, confirm);
    if (!v.ok) {
      setErr(v.error ?? "Please check your password.");
      return;
    }
    if (!supabase) {
      setView("invalid");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // Do not surface raw Supabase errors.
        setErr("We couldn't update your password. The reset link may have expired.");
        setBusy(false);
        return;
      }
      // End the recovery session, then send them to sign in fresh.
      await supabase.auth.signOut();
      router.push("/login?password_reset=success");
    } catch {
      setErr("Something went wrong. Please request a new reset link.");
      setBusy(false);
    }
  }

  return (
    <Shell className="py-12">
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-2xl font-semibold text-navy">Set a new password</h1>

        {view === "loading" ? (
          <Card className="mt-6 p-6 text-center text-sm text-navy-muted">Checking your reset link…</Card>
        ) : view === "invalid" ? (
          <Card className="mt-6 p-6">
            <p className="text-navy">{RESET_LINK_INVALID}</p>
            <div className="mt-4">
              <Button href="/login?reset=1" full>Request a new reset link</Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <Field label="New password" required hint={`(${PASSWORD_MIN}+ characters)`}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN}
              />
            </Field>
            <Field label="Confirm new password" required>
              <PasswordInput
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN}
              />
            </Field>

            <p className="text-xs text-navy-muted">
              Use at least {PASSWORD_MIN} characters. Both fields must match.
            </p>

            {err ? <p className="text-sm text-warn">{err}</p> : null}

            <Button type="submit" disabled={busy} full>
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </div>
    </Shell>
  );
}
