import {
  completeFixtureAssignmentFromForm,
  expireFixtureVendorAccessFromForm,
  requestFixtureVendorDocumentFromForm,
  scheduleFixtureVendorFromForm,
  sendFixtureVendorMessageFromForm,
  uploadFixtureVendorWorkFromForm,
} from "@/app/actions/vendors";
import {
  AccessDeniedCard,
  type AccessDeniedAction,
} from "@/components/access-denied-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SeedAssignment } from "@/lib/seed-vendors";
import { ActionNotice } from "@/components/action-notice";
import { isDemoMode } from "@/lib/auth-config";
import {
  fixtureVendorFileLabel,
  fixtureVendorStageLabel,
  fixtureVendorTaskLabel,
  formatFixtureVendorExpiry,
} from "@/lib/demo-vendor-display";
import type { FixtureVendorPortalState } from "@/lib/vendor-access";

export function VendorPortalDenied({ action }: { action?: AccessDeniedAction }) {
  return (
    <AccessDeniedCard
      testId="vendor-portal-denied"
      title="You cannot open this vendor portal."
      action={action}
    />
  );
}

export function VendorAccessExpired() {
  return (
    <AccessDeniedCard
      testId="vendor-access-expired"
      title="No file is open to you right now."
    />
  );
}

export function VendorPortalView({
  vendorName,
  assignments,
  state,
  expired,
  notice,
  sessionBadge = "Fixture session · not Clerk",
}: {
  vendorName: string;
  assignments: SeedAssignment[];
  state: FixtureVendorPortalState;
  expired: boolean;
  notice?: string;
  sessionBadge?: string;
}) {
  return (
    <div className="space-y-8" data-testid="vendor-portal">
      <section className="space-y-2">
        <Badge variant="sage">{sessionBadge}</Badge>
        <h1 className="text-h1 font-semibold tracking-tight">Vendor portal</h1>
        <p className="text-sm text-muted-foreground">
          {isDemoMode() ? (
            <>
              {vendorName} · lender portal
              {expired || assignments.length === 0 ? "" : " · One sample file."}
            </>
          ) : (
            <>
              Signed in as {vendorName}.
              {expired || assignments.length === 0 ? "" : " One assigned file."}{" "}
              Compensation is none.
            </>
          )}
        </p>
      </section>

      <ActionNotice notice={notice} />

      {expired || assignments.length === 0 ? (
        <VendorAccessExpired />
      ) : (
        assignments.map((assignment) => (
          <AssignmentPanel
            key={assignment.assignmentId}
            assignment={assignment}
            state={state}
          />
        ))
      )}
    </div>
  );
}

function AssignmentPanel({
  assignment,
  state,
}: {
  assignment: SeedAssignment;
  state: FixtureVendorPortalState;
}) {
  return (
    <section className="space-y-4" data-testid="vendor-assignment">
      <Card>
        <CardHeader>
          <CardTitle>Assigned transaction</CardTitle>
          <CardDescription>
            {fixtureVendorFileLabel(assignment)} ·{" "}
            {fixtureVendorTaskLabel(
              assignment.scope,
              assignment.transaction.stage,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p data-testid="vendor-assignment-stage">
            Stage {fixtureVendorStageLabel(assignment.transaction.stage)}
          </p>
          <p data-testid="vendor-assignment-file">
            {fixtureVendorFileLabel(assignment)}
          </p>
          {!isDemoMode() ? (
            <Badge variant="sage">Compensation: none</Badge>
          ) : (
            <p className="text-small text-muted-foreground">
              Sample assignment · no live compensation in this demo.
            </p>
          )}
          <p className="text-muted-foreground">
            Expires {formatFixtureVendorExpiry(assignment.expiresAt)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.messages.map((message) => (
            <p key={message.id} className="text-sm">
              {message.authorName}: {message.body}
            </p>
          ))}
          <form
            action={sendFixtureVendorMessageFromForm}
            className="space-y-2"
            data-testid="vendor-message-form"
          >
            <input
              type="hidden"
              name="assignmentId"
              value={assignment.assignmentId}
            />
            <textarea
              name="body"
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Message the file"
              data-testid="vendor-message-body"
            />
            <Button type="submit" data-testid="vendor-send-message">
              Send message
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={scheduleFixtureVendorFromForm}>
              <input
                type="hidden"
                name="assignmentId"
                value={assignment.assignmentId}
              />
              <Button type="submit" variant="outline">
                Schedule visit
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Request a document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.documentRequests.map((request) => (
              <p key={request.id} className="text-sm">
                Requested {request.documentType}
              </p>
            ))}
            <form action={requestFixtureVendorDocumentFromForm}>
              <input
                type="hidden"
                name="assignmentId"
                value={assignment.assignmentId}
              />
              <input
                type="hidden"
                name="documentType"
                value={
                  assignment.scope === "inspection_report"
                    ? "inspection_report"
                    : "preapproval"
                }
              />
              <Button type="submit" variant="outline" className="min-h-11">
                {assignment.scope === "inspection_report"
                  ? "Request inspection report"
                  : "Request preapproval"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.uploads.map((upload) => (
              <p key={upload.id} className="text-sm">
                Uploaded {upload.type}
              </p>
            ))}
            <form action={uploadFixtureVendorWorkFromForm}>
              <input
                type="hidden"
                name="assignmentId"
                value={assignment.assignmentId}
              />
              <input type="hidden" name="kind" value="invoice" />
              <Button type="submit" variant="outline">
                Upload invoice
              </Button>
            </form>
            <form action={uploadFixtureVendorWorkFromForm}>
              <input
                type="hidden"
                name="assignmentId"
                value={assignment.assignmentId}
              />
              <input type="hidden" name="kind" value="report" />
              <Button type="submit" variant="outline">
                Upload report
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Close the assignment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <form action={completeFixtureAssignmentFromForm}>
              <input
                type="hidden"
                name="assignmentId"
                value={assignment.assignmentId}
              />
              <Button type="submit">Mark complete</Button>
            </form>
            <form action={expireFixtureVendorAccessFromForm}>
              <Button type="submit" variant="outline">
                End access now
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
