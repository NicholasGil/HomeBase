import { SignIn } from "@clerk/nextjs";

import { AppShell } from "@/components/app-shell";
import { BuyerAuthPreviewFallback } from "@/components/buyer-auth-preview-fallback";
import { clerkSignInRedirectProps } from "@/lib/buyer-auth-funnel";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignInPage() {
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
