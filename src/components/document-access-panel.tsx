import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * "Who has access" on a document page: the grant control, then one row per
 * grant. Renders in both fixture and live modes; the caller supplies the rows.
 */
export function DocumentAccessPanel({
  action,
  count,
  children,
}: {
  action: ReactNode;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card data-testid="document-access">
      <CardHeader>
        <CardTitle>Who has access</CardTitle>
        <CardDescription>
          Access is decided in a server function on every open. A revoked
          party is denied on their next open.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {action}
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one outside your file has access.
          </p>
        ) : (
          <ul className="space-y-2">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}
