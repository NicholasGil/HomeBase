import Link from "next/link";

import { endTestSessionFromForm } from "@/app/actions/test-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProfileSettings({
  name,
  role,
  email,
  phone,
  eyebrow,
  fixtureSignOut,
  backHref,
  backLabel,
}: {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  eyebrow?: string;
  fixtureSignOut?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="space-y-6" data-testid="profile-settings">
      {backHref ? (
        <Link href={backHref} className="text-sm underline" data-testid="profile-back">
          {backLabel ?? "Back"}
        </Link>
      ) : null}
      {eyebrow ? <Badge variant="sage">{eyebrow}</Badge> : null}
      <div className="space-y-2">
        <h1 className="text-h1 font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Display only. These fields come from the fixture session. This page
          does not change a Clerk account.
        </p>
      </div>
      <div className="overflow-hidden rounded-[16px] bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/6">
        <dl className="divide-y divide-border/70">
          <ProfileField label="Name" value={name} />
          <ProfileField label="Role" value={role} />
          {email ? <ProfileField label="Email" value={email} /> : null}
          {phone ? <ProfileField label="Phone" value={phone} /> : null}
        </dl>
      </div>
      {fixtureSignOut ? (
        <form action={endTestSessionFromForm}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-6 py-4 sm:grid-cols-[8rem_1fr] sm:items-baseline">
      <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
