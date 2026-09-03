"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { formatGrantDate } from "@/components/grant-access-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Two-tap revoke that stays in the row: "Revoke" swaps for a short question
 * with "Keep access" / "Revoke access". Focus moves to the destructive button
 * so a keyboard user lands on the decision, and Escape backs out.
 *
 * Below `sm` the two buttons stack at their natural width on the left, so
 * neither can scroll under the concierge FAB in the bottom-right corner.
 */
export function RevokeGrantConfirm({
  granteeName,
  onRevoke,
}: {
  granteeName: string;
  onRevoke: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) {
      confirmRef.current?.focus();
    }
  }, [confirming]);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="min-h-11 px-3 md:min-h-8"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Revoke
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Revoke access for ${granteeName}`}
      className="flex w-full flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          event.stopPropagation();
          setConfirming(false);
        }
      }}
    >
      <p className="min-w-0 flex-1 text-sm">
        Remove {granteeName}&rsquo;s access now? It is denied on their next
        open.
      </p>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 px-3 md:min-h-8"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Keep access
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          variant="destructive"
          className="min-h-11 px-3 md:min-h-8"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await onRevoke();
                setConfirming(false);
              } catch {
                setError("Access was not revoked. Try again.");
              }
            });
          }}
        >
          {pending ? "Revoking…" : "Revoke access"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="basis-full text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One grant on a document: who, what, until when, and the revoke control.
 * Below `md` the control sits under the badge on the left rather than at the
 * row's right edge, which is the column the concierge FAB floats over.
 */
export function GrantRow({
  label,
  granteeName,
  expiresAt,
  revoked,
  onRevoke,
}: {
  label: string;
  granteeName: string;
  expiresAt: number;
  revoked: boolean;
  onRevoke: () => Promise<void>;
}) {
  return (
    <li className="flex flex-col items-start gap-2 rounded-xl bg-muted/40 px-3 py-2 md:flex-row md:flex-wrap md:items-center md:justify-between">
      <div className="min-w-0">
        <Badge variant={revoked ? "outline" : "secondary"}>
          {revoked ? "Revoked" : label}
        </Badge>
        {!revoked ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Ends {formatGrantDate(expiresAt)}
          </p>
        ) : null}
      </div>
      {!revoked ? (
        <RevokeGrantConfirm granteeName={granteeName} onRevoke={onRevoke} />
      ) : null}
    </li>
  );
}
