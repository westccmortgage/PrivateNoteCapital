import { redirect } from "next/navigation";
import { Shell, Card } from "@/components/ui";
import { getCurrentUser, isAdmin } from "@/lib/supabase/server";
import { supabasePublicConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

// Server-side gate for every /admin route. No admin UI renders unless the
// signed-in user is in admin_users (checked with the service role).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!supabasePublicConfigured()) {
    return (
      <Shell className="py-16">
        <Card className="p-8 text-center text-sm text-navy-muted">
          Admin tools require the Supabase backend to be configured.
        </Card>
      </Shell>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!(await isAdmin())) {
    return (
      <Shell className="py-16">
        <Card className="p-8 text-center">
          <p className="font-serif text-lg text-navy">Restricted</p>
          <p className="mt-2 text-sm text-navy-muted">This area is limited to administrators.</p>
        </Card>
      </Shell>
    );
  }

  return <>{children}</>;
}
