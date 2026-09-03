import { ArrowRight, FileText, Landmark, MapPinned, Route } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { transactionHref } from "@/components/buyer-dashboard-view";
import { Badge } from "@/components/ui/badge";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cardLiftClassName, tripHeadingClassName } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

type SummaryCard = {
  key: "tours" | "offers" | "vault" | "transaction";
  href: string;
  label: string;
  title: string;
  detail: string;
  /** The spelled-out action, so the card reads as a door and not a stat. */
  cta: string;
  badge?: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
};

function mentions(title: string | undefined, words: string[]) {
  const lower = title?.toLowerCase() ?? "";
  return words.some((word) => lower.includes(word));
}

/*
  Each card is a one-line pointer to the route that owns the full surface.
  Details come from the ten-second view only, so the dashboard never loads
  tours, offers, or documents to describe them.
*/
export function summaryCardsFor(view: BuyerDashboardView): SummaryCard[] {
  const nextTitle = view.next?.title;
  const openTasks = view.currentStageTasks.filter(
    (task) => task.status !== "done",
  ).length;

  return [
    {
      key: "tours",
      href: "/tours",
      label: "Tours",
      title: "Showings",
      detail: mentions(nextTitle, ["tour", "showing", "schedule"])
        ? `Next: ${nextTitle}.`
        : "Build a tour, reorder stops, log a verdict.",
      cta: "Open tours",
      icon: Route,
      tone: "bg-sage/60 text-sage-foreground",
    },
    {
      key: "offers",
      href: "/offers",
      label: "Offers",
      title: "Offer center",
      detail: mentions(nextTitle, ["offer"])
        ? `Next: ${nextTitle}.`
        : "Three strategies, cost simulator, contract explainer.",
      cta: "Open offer center",
      icon: Landmark,
      tone: "bg-peach/70 text-sand-foreground",
    },
    {
      key: "vault",
      href: "/vault",
      label: "Vault",
      title: "Documents",
      detail: view.owedToday
        ? `${view.owedToday.label}.`
        : "Upload, share with an expiry, revoke any time.",
      cta: "Open vault",
      icon: FileText,
      tone: "bg-sky/70 text-sky-foreground",
    },
    {
      key: "transaction",
      href: transactionHref(view.transactionId),
      label: "Transaction",
      title: view.where.label,
      detail:
        openTasks === 0
          ? "No open task on this stage."
          : `${openTasks} open ${openTasks === 1 ? "task" : "tasks"} on this stage.`,
      cta: "Open transaction",
      badge: view.canAdvance ? "ready to advance" : "advance blocked",
      icon: MapPinned,
      tone: "bg-sand text-sand-foreground",
    },
  ];
}

export function DashboardSummaryCards({ view }: { view: BuyerDashboardView }) {
  return (
    <section className="space-y-4" data-testid="dashboard-summary-cards">
      <div>
        <h2 className={tripHeadingClassName}>Your file</h2>
        <p className="text-sm text-muted-foreground">
          Each surface has its own page. Open the one you need.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCardsFor(view).map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.key} className="min-w-0">
              <Link
                href={card.href}
                data-testid={`dashboard-link-${card.key}`}
                className={cn(
                  "group flex h-full min-h-11 items-start gap-3 rounded-[14px] bg-card p-3 ring-1 ring-black/6 sm:flex-col sm:gap-4 sm:p-4",
                  cardLiftClassName,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    card.tone,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 self-stretch">
                  <span className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {card.label}
                  </span>
                  <span className="font-heading text-h3 font-medium">
                    {card.title}
                  </span>
                  <span className="text-small text-muted-foreground">
                    {card.detail}
                  </span>
                  {card.badge ? (
                    <Badge variant="outline" className="mt-1.5 self-start">
                      {card.badge}
                    </Badge>
                  ) : null}
                  {/*
                    The spelled-out action is the card's door handle: the
                    whole card is the link, this line says where it goes.
                  */}
                  <span className="mt-2 inline-flex min-h-6 items-center gap-1 self-start text-small font-semibold text-foreground underline-offset-4 group-hover:underline sm:mt-auto sm:pt-3">
                    {card.cta}
                    <ArrowRight
                      aria-hidden
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
