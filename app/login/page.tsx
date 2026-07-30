import type { Metadata } from "next";
import Link from "next/link";
import { Shell, Card } from "@/components/ui";
import { AuthForm } from "@/components/forms/AuthForm";
import { supabasePublicConfigured } from "@/lib/env";
import { LOGIN_RESET_SUCCESS } from "@/lib/auth-reset";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const resetSuccess = sp.password_reset === "success";
  const initialMode = sp.reset === "1" ? "reset" : "signin";

  return (
    <Shell className="py-12">
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-2xl font-semibold text-navy">Sign in to Private Note Capital</h1>
        <p className="mt-2 text-sm text-navy-muted">
          Accounts let you save properties, track auctions, and manage your weekly watchlist. You can
          search the whole platform without one.
        </p>

        {resetSuccess ? (
          <div className="mt-4 rounded-lg border border-[#CBE5DB] bg-[#E5F0EC] px-3 py-2 text-sm text-positive">
            {LOGIN_RESET_SUCCESS}
          </div>
        ) : null}

        <div className="mt-6">
          {supabasePublicConfigured() ? (
            <AuthForm initialMode={initialMode} next="/saved" />
          ) : (
            <Card className="p-6 text-center text-sm text-navy-muted">Accounts are not enabled yet.</Card>
          )}
        </div>
        <p className="mt-4 text-sm text-navy-muted">
          <Link href="/search" className="text-accent hover:underline">Continue without an account →</Link>
        </p>
      </div>
    </Shell>
  );
}
