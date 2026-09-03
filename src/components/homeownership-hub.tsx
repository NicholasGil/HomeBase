import { MoneyFigureView } from "@/components/money-figure-view";
import { TextLink } from "@/components/text-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HomeownershipHubView } from "../../convex/lib/homeownership";
import { seedDocumentTitle } from "@/lib/seed-documents";

export function HomeownershipHubDenied() {
  return (
    <p data-testid="homeownership-hub-denied" className="text-sm text-muted-foreground">
      You cannot open this hub.
    </p>
  );
}

function formatDue(at: number) {
  return new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HomeownershipHubView({
  view,
  liveReengage,
  reengageAction,
}: {
  view: HomeownershipHubView;
  liveReengage?: boolean;
  reengageAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <section className="space-y-8" data-testid="homeownership-hub">
      <div className="space-y-2">
        <Badge variant="sage">Post-close</Badge>
        <h1 className="text-h1 font-semibold tracking-tight">
          Homeownership hub
        </h1>
        <p className="text-sm text-muted-foreground">
          {view.propertyAddress
            ? `${view.propertyAddress.city}, ${view.propertyAddress.state}`
            : "Closed file"}{" "}
          · status {view.status}. Maintenance, retained documents, sourced
          value, and vendor re-engagement. No payment.
        </p>
      </div>

      <Card data-testid="hub-maintenance">
        <CardHeader>
          <CardTitle>Maintenance calendar</CardTitle>
          <CardDescription>
            Scheduled upkeep on the closed property.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view.maintenance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upkeep items yet.</p>
          ) : (
            <ul className="space-y-3">
              {view.maintenance.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  data-testid={`hub-maint-${item.category}`}
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">
                      {item.cadenceDays === null
                        ? "One-time"
                        : `Every ${item.cadenceDays} days`}{" "}
                      · due {formatDue(item.nextDueAt)}
                    </p>
                  </div>
                  <Badge variant={item.status === "due" ? "default" : "outline"}>
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card data-testid="hub-warranties">
        <CardHeader>
          <CardTitle>Warranty and document retention</CardTitle>
          <CardDescription>
            App-owned records. Opening a document still goes through
            documentGrants. Content is not dumped here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {view.warranties.map((warranty) => (
              <li key={warranty.id} className="text-sm">
                <p className="font-medium">{warranty.title}</p>
                <p className="text-muted-foreground">
                  {warranty.provider}
                  {warranty.coverage ? ` · ${warranty.coverage}` : ""}
                  {warranty.expiresAt
                    ? ` · through ${formatDue(warranty.expiresAt)}`
                    : ""}
                </p>
                {warranty.documentId ? (
                  <TextLink href={`/documents/${warranty.documentId}`}>
                    Open retained document
                  </TextLink>
                ) : null}
              </li>
            ))}
          </ul>
          <div data-testid="hub-documents">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Retained vault
            </p>
            <ul className="space-y-2 text-sm">
              {view.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center justify-between gap-2"
                  data-testid={`hub-doc-${document.type}`}
                >
                  <span>{seedDocumentTitle(document.type)}</span>
                  <TextLink href={`/documents/${document.id}`} className="px-2">
                    Open
                  </TextLink>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="hub-values">
        <CardHeader>
          <CardTitle>Value tracking</CardTitle>
          <CardDescription>
            Estimates stay visually distinct from issued figures. Missing
            figures stay blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {view.values.map((slot) => (
            <div key={slot.key} data-testid={`hub-value-${slot.key}`}>
              <p className="mb-2 text-sm font-medium">{slot.label}</p>
              <MoneyFigureView
                figure={slot.figure}
                testId={`hub-figure-${slot.key}`}
                size="md"
                showLabel={false}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-testid="hub-vendors">
        <CardHeader>
          <CardTitle>Vendor re-engagement</CardTitle>
          <CardDescription>
            Reuse the M10 directory. Compensation stays none. HomeBase does
            not take payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Compensation: none</p>
          {view.vendors.map((vendor) => (
            <div
              key={vendor.vendorId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              data-testid={`hub-vendor-${vendor.vendorId}`}
            >
              <div className="text-sm">
                <p className="font-medium">{vendor.name}</p>
                <p className="text-muted-foreground">
                  {vendor.category}
                  {vendor.assignmentStatus
                    ? ` · ${vendor.assignmentStatus}`
                    : ""}
                </p>
              </div>
              {liveReengage || reengageAction === undefined ? null : vendor.reengaged ? (
                <Button type="button" disabled>
                  Re-engaged
                </Button>
              ) : (
                <form action={reengageAction}>
                  <input
                    type="hidden"
                    name="transactionId"
                    value={view.transactionId}
                  />
                  <input type="hidden" name="vendorId" value={vendor.vendorId} />
                  <Button type="submit">Re-engage</Button>
                </form>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
