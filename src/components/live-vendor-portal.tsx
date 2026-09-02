"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import {
  VendorAccessExpired,
  VendorPortalDenied,
} from "@/components/vendor-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function LiveVendorPortal() {
  const portal = useQuery(api.vendors.getPortal, {});
  const session = useQuery(api.me.getSession, {});

  if (portal === undefined || session === undefined) {
    return <p className="text-sm text-muted-foreground">Loading portal…</p>;
  }

  if (session.role !== "vendor") {
    return <VendorPortalDenied />;
  }

  return (
    <div className="space-y-8" data-testid="vendor-portal">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Vendor portal</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.name}. Compensation is none.
        </p>
      </section>
      {portal.assignments.length === 0 ? (
        <VendorAccessExpired />
      ) : (
        portal.assignments.map((assignment) => (
          <LiveAssignment key={assignment.assignmentId} assignment={assignment} />
        ))
      )}
    </div>
  );
}

function LiveAssignment({
  assignment,
}: {
  assignment: {
    assignmentId: Id<"vendorAssignments">;
    scope: string;
    expiresAt: number;
    transaction: {
      transactionId: string;
      stage: string;
      propertyCity: string | null;
      propertyState: string | null;
    };
  };
}) {
  const messages = useQuery(api.vendors.listMessages, {
    assignmentId: assignment.assignmentId,
  });
  const documents = useQuery(api.vendors.listGrantedDocuments, {
    assignmentId: assignment.assignmentId,
  });
  const requests = useQuery(api.vendors.listDocumentRequests, {
    assignmentId: assignment.assignmentId,
  });
  const sendMessage = useMutation(api.vendors.sendMessage);
  const schedule = useMutation(api.vendors.schedule);
  const requestDocument = useMutation(api.vendors.requestDocument);
  const upload = useMutation(api.vendors.uploadWorkProduct);
  const complete = useMutation(api.vendors.markComplete);
  const [body, setBody] = useState("");

  return (
    <section className="space-y-4" data-testid="vendor-assignment">
      <Card>
        <CardHeader>
          <CardTitle>Assigned transaction</CardTitle>
          <CardDescription>
            {assignment.transaction.propertyCity},{" "}
            {assignment.transaction.propertyState} · {assignment.scope}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p data-testid="vendor-assignment-stage">
            Stage {assignment.transaction.stage}
          </p>
          <p data-testid="vendor-assignment-file">
            File {assignment.transaction.transactionId}
          </p>
          <Badge variant="sage">Compensation: none</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Granted documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents === undefined || documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">None granted.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {documents.map((document) => (
                <li key={document._id}>{document.type}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages?.map((message) => (
            <p key={message._id} className="text-sm">
              {message.authorName}: {message.body}
            </p>
          ))}
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button
            onClick={() => {
              void sendMessage({
                assignmentId: assignment.assignmentId,
                body,
              }).then(() => setBody(""));
            }}
          >
            Send message
          </Button>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            void schedule({
              assignmentId: assignment.assignmentId,
              startsAt: Date.now() + 3_600_000,
              endsAt: Date.now() + 7_200_000,
            });
          }}
        >
          Schedule visit
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void requestDocument({
              assignmentId: assignment.assignmentId,
              documentType: "preapproval",
            });
          }}
        >
          Request preapproval
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void upload({
              assignmentId: assignment.assignmentId,
              kind: "invoice",
              fileName: "invoice.pdf",
            });
          }}
        >
          Upload invoice
        </Button>
        <Button
          onClick={() => {
            void complete({ assignmentId: assignment.assignmentId });
          }}
        >
          Mark complete
        </Button>
      </div>
      {requests && requests.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Open requests: {requests.map((row) => row.documentType).join(", ")}
        </p>
      ) : null}
    </section>
  );
}
