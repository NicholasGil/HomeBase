import Link from "next/link";
import type { ReactNode } from "react";

import {
  ContactReach,
  type ContactReachDetails,
} from "@/components/contact-links";
import { DoneList } from "@/components/done-list";
import { PhotoTile } from "@/components/listing-card";
import { MoneyFigureView } from "@/components/money-figure-view";
import { seedPropertyPhoto } from "@/components/property-photo";
import { StageTaskRows } from "@/components/stage-task-rows";
import { taskAnchorId } from "@/components/task-anchor";
import { Badge } from "@/components/ui/badge";
import {
  JourneyTracker,
  type JourneyOrientation,
} from "@/components/journey-tracker";
import type {
  BuyerDashboardView,
  DashboardContact,
} from "../../convex/lib/dashboardView";
import { heroPhotoWashClassName } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

/*
  lg placement of the five hero nodes. `horizontal` (dashboard): two columns,
  rail beside the Next card. `responsive` (transaction page): the rail turns
  vertical and takes a 15rem column for all four rows, the rest stack left.
*/
export const HERO_GRID_CLASS: Record<
  JourneyOrientation,
  {
    grid: string;
    where: string;
    rail: string;
    next: string;
    owe: string;
    doneWaiting: string;
  }
> = {
  horizontal: {
    grid: "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr]",
    where: "lg:col-start-1 lg:row-start-1",
    rail: "lg:col-start-2 lg:row-start-2 lg:self-start",
    next: "lg:col-start-1 lg:row-start-2",
    owe: "lg:col-start-2 lg:row-start-1",
    doneWaiting: "lg:col-start-1 lg:row-start-3",
  },
  responsive: {
    grid: "lg:grid-cols-[minmax(0,1fr)_15rem] lg:grid-rows-[auto_auto_auto_1fr]",
    where: "lg:col-start-1 lg:row-start-1",
    rail: "lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:self-start",
    next: "lg:col-start-1 lg:row-start-2",
    owe: "lg:col-start-1 lg:row-start-3",
    doneWaiting: "lg:col-start-1 lg:row-start-4",
  },
};

export function OwedTodayFigure({
  owed,
}: {
  owed: BuyerDashboardView["owedToday"];
}) {
  return (
    <MoneyFigureView figure={owed} size="display" showLabel={false} />
  );
}

/** Same shape the agent command center links with; the route decodes it. */
export function transactionHref(transactionId: string) {
  return `/transactions/${transactionId}`;
}

/** A hero card body: a link into the transaction, or static copy without one. */
function DrillLink({
  href,
  className,
  children,
}: {
  href: string | undefined;
  className: string;
  children: ReactNode;
}) {
  if (href === undefined) {
    return <div className={className}>{children}</div>;
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * `full` (transaction page): the hero plus the three stage columns. `summary`
 * (dashboard): the hero plus one line for the advance gate and deadlines; the
 * task list and contacts live on the transaction page the dashboard links to.
 */
export type DashboardDetail = "full" | "summary";

/** A contact the view names, plus phone/email when the source carries them. */
export type ReachableContact = DashboardContact & ContactReachDetails;

/**
 * The gate line. With `href` (the dashboard) the blocking task is a link into
 * the transaction route at its row; without one (the transaction page) the
 * task sits in the adjacent column and the line stays plain text.
 */
function AdvanceGate({
  view,
  href,
}: {
  view: BuyerDashboardView;
  href?: string;
}) {
  if (view.canAdvance) {
    return <p>Ready for {view.nextStage?.label ?? "the next stage"}.</p>;
  }
  const blocker = view.blockingTasks[0];
  if (blocker === undefined) {
    return <p data-testid="stage-blocked">Cannot leave {view.where.label}.</p>;
  }
  return (
    <p data-testid="stage-blocked">
      Cannot leave {view.where.label} while{" "}
      {href === undefined ? (
        blocker.title
      ) : (
        <Link
          href={`${href}#${taskAnchorId(blocker.title)}`}
          className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          {blocker.title}
        </Link>
      )}{" "}
      is open.
    </p>
  );
}

export function BuyerDashboardViewPanel({
  view,
  buyerName,
  eyebrow,
  journeyOrientation = "horizontal",
  detailHref = transactionHref(view.transactionId),
  detail = "full",
  contacts = view.contacts,
}: {
  view: BuyerDashboardView;
  buyerName?: string;
  eyebrow?: string;
  journeyOrientation?: JourneyOrientation;
  /**
   * Where Next, Due today and the stage chips drill in. Defaults to this
   * transaction's detail route; pass null on that route so the hero carries
   * no links to itself.
   */
  detailHref?: string | null;
  detail?: DashboardDetail;
  /**
   * The view names contacts without phone or email. A caller that has them
   * (the fixture knows its seeded agent) passes the same people enriched so
   * the values render as tel:/mailto: links.
   */
  contacts?: ReachableContact[];
}) {
  const owed = view.owedToday;
  const place = view.propertyAddress
    ? `${view.propertyAddress.city}, ${view.propertyAddress.state}`
    : null;
  const at = HERO_GRID_CLASS[journeyOrientation];
  const drill = detailHref ?? undefined;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/6">
        <PhotoTile
          className="h-24 w-full lg:h-40"
          wash={heroPhotoWashClassName}
          seed={view.propertyAddress?.line1}
          photo={seedPropertyPhoto(view.propertyAddress?.line1)}
          priority
        >
          {eyebrow ? (
            <Badge
              variant="quiet"
              className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm"
            >
              {eyebrow}
            </Badge>
          ) : null}
          {view.propertyAddress ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-3 text-white lg:px-6 lg:py-4">
              <p className="text-sm font-medium">
                {view.propertyAddress.line1}
              </p>
              <p className="text-xs text-white/80">{place}</p>
            </div>
          ) : null}
        </PhotoTile>

        {/*
          DOM order is the 375px reading order: where, rail, next, owe,
          done/waiting. At lg the same nodes are placed into two columns
          (see HERO_GRID_CLASS) so the Playwright specs see one DOM
          regardless of viewport.
        */}
        <div
          className={cn(
            "grid gap-2.5 px-5 pt-2.5 pb-5 lg:gap-x-8 lg:gap-y-6 lg:px-6 lg:py-6",
            at.grid,
          )}
        >
          <div
            className={cn(
              "min-w-0 space-y-1 lg:flex lg:flex-col lg:justify-end",
              at.where,
            )}
          >
            <p className="text-sm text-muted-foreground">
              {buyerName ?? "Your transaction"}
              {place ? ` · ${place}` : null}
            </p>
            <h1
              data-testid="ten-second-where"
              className="text-display font-semibold tracking-tight text-balance lg:text-5xl"
            >
              {view.where.label}
            </h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Status {view.where.status}. Transaction {view.transactionId}.
            </p>
          </div>

          <JourneyTracker
            stages={view.stages}
            href={drill}
            orientation={journeyOrientation}
            className={at.rail}
          />

          <section
            data-testid="ten-second-next"
            className={cn(
              "rounded-xl bg-sand px-4 py-3 lg:px-5 lg:py-6",
              at.next,
            )}
          >
            {view.next === null ? (
              <>
                <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-next">
                  Next
                </p>
                <p className="mt-2 text-sm text-muted-foreground lg:mt-3">
                  No open task right now.
                </p>
              </>
            ) : (
              <DrillLink href={drill} className="block">
                {/* Assignee shares the eyebrow row so the card is two lines tall. */}
                <span className="flex items-center justify-between gap-3">
                  <span className="text-eyebrow font-medium uppercase tracking-[0.2em] text-next">
                    Next
                  </span>
                  <Badge variant="sage">{view.next.assigneeRole}</Badge>
                </span>
                <span className="mt-1.5 block text-h2 font-semibold tracking-tight text-balance lg:mt-3 lg:text-h1">
                  {view.next.title}
                </span>
              </DrillLink>
            )}
          </section>

          <section
            data-testid="ten-second-owe"
            className={cn(
              "rounded-xl bg-sky px-4 py-3 lg:px-5 lg:py-6",
              at.owe,
            )}
          >
            {/*
              The figure sits outside the link so the estimate's Assumptions
              disclosure is never interactive content nested in an anchor.
              Below lg the eyebrow and label share one line so Done/Waiting
              stays on the 375 fold; from lg the label drops under it.
            */}
            <DrillLink
              href={drill}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 lg:block"
            >
              <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Due today
              </p>
              <p className="min-w-0 text-small text-muted-foreground lg:mt-1 lg:text-body">
                {owed?.label ?? "No sourced figure on this file"}
              </p>
            </DrillLink>
            <div className="mt-2 lg:mt-4">
              <OwedTodayFigure owed={owed} />
            </div>
          </section>

          <div
            className={cn(
              "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:gap-6",
              at.doneWaiting,
            )}
          >
            <section data-testid="ten-second-done" className="min-w-0">
              <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Done
              </p>
              <DoneList items={view.done} />
            </section>

            <section data-testid="ten-second-waiting" className="min-w-0">
              <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Waiting on
              </p>
              <p className="mt-2 text-h3 font-medium">
                {view.waitingOn ?? "Nobody"}
              </p>
            </section>
          </div>
        </div>
      </section>

      {detail === "summary" ? (
        <section
          data-testid="stage-gate-summary"
          className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm"
        >
          <AdvanceGate view={view} href={drill} />
          {view.deadlines.map((deadline) => (
            <p key={deadline.label} className="text-muted-foreground">
              {deadline.label}
            </p>
          ))}
        </section>
      ) : (
        <section className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-medium">This stage</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tasks that live on {view.where.label}, who owns each, and where
              it stands.
            </p>
            <StageTaskRows tasks={view.currentStageTasks} />
          </div>

          <div>
            <h2 className="text-sm font-medium">Waiting and deadlines</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Stage advance stays blocked while a blocking task is open.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <AdvanceGate view={view} href={drill} />
              {view.deadlines.map((deadline) => (
                <p key={deadline.label} className="text-muted-foreground">
                  {deadline.label}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium">Contacts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              People on this file.
            </p>
            {contacts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No contacts yet.
              </p>
            ) : (
              <ul
                aria-label="Contacts on this file"
                className="mt-3 divide-y divide-border/70 text-sm"
              >
                {contacts.map((contact) => (
                  <li
                    key={`${contact.role}-${contact.name}`}
                    data-contact-role={contact.role}
                    className="py-2 first:pt-0"
                  >
                    <p>
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {contact.role}
                      </span>
                    </p>
                    <ContactReach
                      name={contact.name}
                      phone={contact.phone}
                      email={contact.email}
                      className="-mb-2"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
