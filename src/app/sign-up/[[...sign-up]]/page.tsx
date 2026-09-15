import { SignUp } from "@clerk/nextjs";

import { AppShell } from "@/components/app-shell";
import { BuyerAuthPreviewFallback } from "@/components/buyer-auth-preview-fallback";
import { clerkSignUpRedirectProps } from "@/lib/buyer-auth-funnel";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <AppShell>
        <BuyerAuthPreviewFallback mode="sign-up" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col px-5 py-8">
        <SignUp
          {...clerkSignUpRedirectProps()}
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
