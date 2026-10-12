import { TenSecondHeroGrid } from "@/components/ten-second-hero";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";

/** Live UI slice from seed data — not a marketing mock. */
export function MarketingCoachPreview() {
  const view = seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
  const alex = view.propertyAddress
    ? `${view.propertyAddress.line1}, ${view.propertyAddress.city}`
    : "Sample purchase";

  return (
    <section
      aria-label="Coach preview"
      data-testid="marketing-coach-preview"
      className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md"
    >
      <div className="border-b border-border/70 bg-muted/20 px-4 py-2">
        <p className="text-small font-medium text-muted-foreground">
          Sample coach view · {alex}
        </p>
      </div>
      <div className="pointer-events-none select-none p-4 lg:p-5">
        <TenSecondHeroGrid
          view={view}
          buyerName="Alex Rivera"
          journeyOrientation="responsive"
          variant="coach"
        />
      </div>
    </section>
  );
}
