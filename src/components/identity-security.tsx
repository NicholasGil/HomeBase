"use client";

import { useState } from "react";

import { attemptHighRiskFromForm } from "@/app/actions/idv";
import { requestDeviceUnlock } from "@/lib/biometricUnlock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function IdentitySecurity({
  flagOn,
  orgState,
  stateAllowed,
  denied,
  onHighRisk,
}: {
  flagOn: boolean;
  orgState: string;
  stateAllowed: boolean;
  denied?: boolean;
  onHighRisk?: (
    action:
      | "financial_document"
      | "designated_document"
      | "account_recovery",
  ) => Promise<{ ok: false; reason: string } | { ok: true }>;
}) {
  const [unlock, setUnlock] = useState<string>("not tried");
  const [gate, setGate] = useState<string | null>(null);

  if (denied) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="idv-denied">
        You cannot open identity settings.
      </p>
    );
  }

  return (
    <section className="space-y-4" data-testid="identity-security">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Identity and unlock
        </h1>
        <p className="text-sm text-muted-foreground">
          Tier 1 stays on the device. Tier 2 is vendor IDV for high-risk
          actions only. FLAG_IDV is {flagOn ? "on" : "off"}.
        </p>
      </div>
      <Card data-testid="biometric-unlock">
        <CardHeader>
          <CardTitle>Device unlock</CardTitle>
          <CardDescription>
            Face ID or Android biometric. Nothing is stored here. No template
            leaves the device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p data-testid="biometric-stored">Stored templates: none</p>
          <p data-testid="biometric-result">{unlock}</p>
          <Button
            type="button"
            data-testid="biometric-unlock-button"
            onClick={() => {
              void requestDeviceUnlock().then((result) => {
                setUnlock(
                  result.ok
                    ? "unlocked on device"
                    : `unavailable · ${result.reason}`,
                );
              });
            }}
          >
            Unlock on this device
          </Button>
        </CardContent>
      </Card>
      <Card data-testid="idv-gating">
        <CardHeader>
          <CardTitle>Vendor IDV</CardTitle>
          <CardDescription>
            Required before financial documents, designated execution, or
            recovery changes. Per-state table is empty until review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p data-testid="idv-flag">FLAG_IDV: {flagOn ? "on" : "off"}</p>
          <p data-testid="idv-state">
            Org state: {orgState} · allowed: {stateAllowed ? "yes" : "no"}
          </p>
          <Badge variant="outline">sandbox provider only</Badge>
          {gate !== null ? <p data-testid="idv-gate">{gate}</p> : null}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["financial_document", "Access financial document"],
                ["designated_document", "Execute designated document"],
                ["account_recovery", "Change account recovery"],
              ] as const
            ).map(([action, label]) => (
              <Button
                key={action}
                type="button"
                variant="outline"
                data-testid={`idv-action-${action}`}
                onClick={() => {
                  const run =
                    onHighRisk ??
                    (async (nextAction) => {
                      const formData = new FormData();
                      formData.set("action", nextAction);
                      return attemptHighRiskFromForm(formData);
                    });
                  void run(action).then((result) => {
                    if (!result.ok) {
                      setGate(result.reason);
                    }
                  });
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
