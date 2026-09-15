import { AppShell } from "@/components/app-shell";
import { PricingPageContent } from "@/components/pricing-page-content";
import {
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { pricingContinueCoachHref } from "@/lib/buyer-auth-entry";
import { hasBuyerPricingSession } from "@/lib/buyer-pricing-session";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const continueCoachHref = pricingContinueCoachHref(
    await hasBuyerPricingSession(),
  );

  return (
    <AppShell>
      <PricingPageContent continueCoachHref={continueCoachHref} />
    </AppShell>
  );
}
