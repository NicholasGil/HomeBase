import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav?: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            HomeBase
          </Link>
          <div className="flex items-center gap-2">
            {nav}
            <Link href="/agent" className={cn(buttonVariants({ variant: "ghost" }))}>
              Command center
            </Link>
            <Link href="/search" className={cn(buttonVariants({ variant: "ghost" }))}>
              Search
            </Link>
            <Link href="/tours" className={cn(buttonVariants({ variant: "ghost" }))}>
              Tours
            </Link>
            <Link href="/offers" className={cn(buttonVariants({ variant: "ghost" }))}>
              Offers
            </Link>
            <Link href="/sign" className={cn(buttonVariants({ variant: "ghost" }))}>
              Sign
            </Link>
            <Link href="/identity" className={cn(buttonVariants({ variant: "ghost" }))}>
              Identity
            </Link>
            <Link href="/vendor" className={cn(buttonVariants({ variant: "ghost" }))}>
              Vendor portal
            </Link>
            <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
              Home
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
