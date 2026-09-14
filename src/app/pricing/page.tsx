import { AppShell } from "@/components/app-shell";
import { PricingPageContent } from "@/components/pricing-page-content";
import {
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  return (
    <AppShell>
      <PricingPageContent />
    </AppShell>
  );
}
