import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FixtureLoginPrompt() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        A seeded buyer has to sign in before the dashboard shows a transaction.
        Clerk is not configured here, so use the fixture login.
      </p>
      <Link href="/test-login" className={cn(buttonVariants({ size: "lg" }))}>
        Fixture sign in
      </Link>
    </div>
  );
}
