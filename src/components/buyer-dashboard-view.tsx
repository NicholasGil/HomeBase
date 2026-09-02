import Link from "next/link";

import { DoneList } from "@/components/done-list";
import { PhotoTile } from "@/components/listing-card";
import { MoneyFigureView } from "@/components/money-figure-view";
import { Badge } from "@/components/ui/badge";
import { JourneyTracker } from "@/components/journey-tracker";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { nextActionHref, owedTodayHref } from "@/lib/dashboard-links";

export function OwedTodayFigure({
  owed,
}: {
  owed: BuyerDashboardView["owedToday"];
}) {
  return (
    <MoneyFigureView figure={owed} size="display" showLabel={false} />
  );
}

export function BuyerDashboardViewPanel({
  view,
  buyerName,
  eyebrow,
}: {
  view: BuyerDashboardView;
  buyerName?: string;
  eyebrow?: string;
}) {
  const owed = view.owedToday;
  const place = view.propertyAddress
    ? `${view.propertyAddress.city}, ${view.propertyAddress.state}`
    : null;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[16px] bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/6">
        <PhotoTile
          className="h-32 w-full lg:h-40"
          wash="from-peach via-sand to-next/35"
          seed={view.propertyAddress?.line1}
        >
          {view.propertyAddress ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-5 py-3 text-white lg:px-6 lg:py-4">
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
          (left: where / next / done+waiting, right: owe / rail) so the
          Playwright specs see one DOM regardless of viewport.
        */}
        <div className="grid gap-3 px-5 pt-3 pb-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:gap-y-6 lg:px-6 lg:py-6">
          <div className="min-w-0 space-y-1 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:justify-end">
            {eyebrow ? (
              <div className="lg:mb-auto">
                <Badge variant="sage">{eyebrow}</Badge>
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {buyerName ?? "Your transaction"}
              {place ? ` · ${place}` : null}
            </p>
            <h1
              data-testid="ten-second-where"
              className="text-[40px] leading-[1.05] font-semibold tracking-tight text-balance lg:text-5xl"
            >
              {view.where.label}
            </h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Status {view.where.status}. Transaction {view.transactionId}.
            </p>
          </div>

          <JourneyTracker
            stages={view.stages}
            className="lg:col-start-2 lg:row-start-2 lg:self-start"
          />

          <section
            data-testid="ten-second-next"
            className="rounded-[14px] bg-sand px-4 py-3.5 lg:col-start-1 lg:row-start-2 lg:px-5 lg:py-6"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-next">
              Next
            </p>
            {view.next === null ? (
              <p className="mt-2 text-sm text-muted-foreground lg:mt-3">
                No open task right now.
              </p>
            ) : (
              <Link
                href={nextActionHref({
                  title: view.next.title,
                  transactionId: view.transactionId,
                })}
                className="mt-2 block space-y-2 lg:mt-3 lg:space-y-3"
              >
                <p className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">
                  {view.next.title}
                </p>
                <Badge variant="sage">{view.next.assigneeRole}</Badge>
              </Link>
            )}
          </section>

          <section
            data-testid="ten-second-owe"
            className="rounded-[14px] bg-sky px-4 py-3.5 lg:col-start-2 lg:row-start-1 lg:px-5 lg:py-6"
          >
            {/*
              The figure sits outside the link so the estimate's Assumptions
              disclosure is never interactive content nested in an anchor.
            */}
            <Link href={owedTodayHref()} className="block">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Due today
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {owed?.label ?? "No sourced figure on this file"}
              </p>
            </Link>
            <div className="mt-3 lg:mt-4">
              <OwedTodayFigure owed={owed} />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:col-start-1 lg:row-start-3 lg:gap-6">
            <section data-testid="ten-second-done" className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Done
              </p>
              <DoneList items={view.done} />
            </section>

            <section data-testid="ten-second-waiting" className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Waiting on
              </p>
              <p className="mt-2 text-lg font-medium">
                {view.waitingOn ?? "Nobody"}
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-medium">This stage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks that live on {view.where.label}.
          </p>
          {view.currentStageTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No tasks on this stage.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {view.currentStageTasks.map((task) => (
                <li
                  key={task.title}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{task.title}</span>
                  <Badge variant={task.status === "blocked" ? "sand" : "sage"}>
                    {task.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium">Waiting and deadlines</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stage advance stays blocked while a blocking task is open.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {view.canAdvance ? (
              <p>Ready for {view.nextStage?.label ?? "the next stage"}.</p>
            ) : (
              <p data-testid="stage-blocked">
                Cannot leave {view.where.label}
                {view.blockingTasks[0]
                  ? ` while ${view.blockingTasks[0].title} is open.`
                  : "."}
              </p>
            )}
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
          <div className="mt-3 space-y-2 text-sm">
            {view.contacts.length === 0 ? (
              <p className="text-muted-foreground">No contacts yet.</p>
            ) : (
              view.contacts.map((contact) => (
                <p key={`${contact.role}-${contact.name}`}>
                  {contact.name} · {contact.role}
                </p>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
