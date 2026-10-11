import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { BuyerAuthPreviewFallback } from "@/components/buyer-auth-preview-fallback";
import { clerkSignInRedirectProps } from "@/lib/buyer-auth-funnel";
import { isClerkConfigured, isDemoMode } from "@/lib/auth-config";
import { DEMO_CHOOSER_PATH } from "@/lib/demo-copy";

export default function SignInPage() {
  if (isDemoMode()) {
    redirect(DEMO_CHOOSER_PATH);
  }

  if (!isClerkConfigured()) {
    return (
      <AppShell>
        <BuyerAuthPreviewFallback mode="sign-in" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col px-5 py-8">
        <SignIn
          {...clerkSignInRedirectProps()}
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none",
            },
          }}
        />
      </div>
    </AppShell>
  );
}
