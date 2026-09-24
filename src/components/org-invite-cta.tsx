"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

export function OrgInviteCta({ inviteCode }: { inviteCode: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    setRevealed(true);
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [inviteCode]);

  return (
    <div className="space-y-3" data-testid="command-center-invite-cta">
      {revealed ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-3 text-center font-mono text-lg tracking-widest">
          {inviteCode}
        </p>
      ) : null}
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          void copyCode();
        }}
        data-testid="command-center-copy-invite"
      >
        {copied ? "Copied" : revealed ? "Copy again" : "Show & copy invite code"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Share this code with agents and buyers to join {inviteCode.length > 0 ? "your org" : "the brokerage"}.
        No MLS or map setup required in preview.
      </p>
    </div>
  );
}
