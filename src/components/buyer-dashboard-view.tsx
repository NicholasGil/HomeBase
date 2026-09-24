import Link from "next/link";

import {
  ContactReach,
  type ContactReachDetails,
} from "@/components/contact-links";
import { PhotoTile } from "@/components/listing-card";
import { seedPropertyPhoto } from "@/components/property-photo";
import { StageTaskRows } from "@/components/stage-task-rows";
import { taskAnchorId } from "@/components/task-anchor";
import { Badge } from "@/components/ui/badge";
import {
  HERO_GRID_CLASS,
  OwedTodayFigure,
  TenSecondHeroGrid,
} from "@/components/ten-second-hero";
import type { JourneyOrientation } from "@/components/journey-tracker";
import type {
  BuyerDashboardView,
  DashboardContact,
} from "../../convex/lib/dashboardView";
import { heroPhotoWashClassName } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

export { HERO_GRID_CLASS, OwedTodayFigure } from "@/components/ten-second-hero";

/** Same shape the agent command center links with; the route decodes it. */
export function transactionHref(transactionId: string) {
  return `/transactions/${transactionId}`;
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
  const place = view.propertyAddress
    ? `${view.propertyAddress.city}, ${view.propertyAddress.state}`
    : null;
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

        <TenSecondHeroGrid
          view={view}
          buyerName={buyerName}
          journeyOrientation={journeyOrientation}
          detailHref={drill}
          variant="page"
        />
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
