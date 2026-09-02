"use client";

import { useState } from "react";

import {
  sendFixturePacketFromForm,
  signFixturePacketFromForm,
} from "@/app/actions/esign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FixturePacket } from "@/lib/esign-access";
import type { ContractSection } from "../../convex/lib/explainContract";
import { SIGNATURE_FLOW } from "../../convex/lib/esign";

export function SignatureWorkflow({
  packets,
  sections,
  flagOn,
  denied,
  sendControl,
  signControl,
}: {
  packets: FixturePacket[];
  sections: ContractSection[];
  flagOn: boolean;
  denied?: boolean;
  sendControl?: React.ReactNode;
  signControl?: React.ReactNode;
}) {
  const [gate, setGate] = useState<string | null>(null);

  if (denied) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="esign-denied">
        You cannot open this signature packet.
      </p>
    );
  }

  const packet = packets[0];

  return (
    <section className="space-y-4" data-testid="esign-workflow">
      <div>
        <h1 className="text-h1 font-semibold tracking-tight">E-signature</h1>
        <p className="text-sm text-muted-foreground">
          The app owns the workflow, the audit trail, and retention. The
          provider owns cryptography. FLAG_ESIGN is {flagOn ? "on" : "off"}.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" data-testid="esign-flow">
        {SIGNATURE_FLOW.map((step) => (
          <Badge
            key={step}
            variant={packet?.status === step ? "default" : "outline"}
            data-testid={`esign-step-${step}`}
            data-state={packet?.status === step ? "current" : "idle"}
          >
            {step.replaceAll("_", " ")}
          </Badge>
        ))}
      </div>
      {packet === undefined ? (
        <p className="text-sm text-muted-foreground">No packet on this file.</p>
      ) : (
        <Card data-testid="esign-packet">
          <CardHeader>
            <CardTitle>Purchase agreement packet</CardTitle>
            <CardDescription>
              {packet.documentType} · {packet.designated ? "designated" : "open"}{" "}
              · provider sandbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p data-testid="esign-status">Status: {packet.status}</p>
            <p data-testid="esign-flag">
              FLAG_ESIGN: {flagOn ? "on" : "off"}
            </p>
            {gate !== null ? (
              <p data-testid="esign-gate">{gate}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {sendControl ?? (
                <Button
                  type="button"
                  data-testid="esign-send"
                  onClick={() => {
                    void sendFixturePacketFromForm().then((result) => {
                      if (!result.ok) {
                        setGate(result.reason);
                      }
                    });
                  }}
                >
                  Send to provider
                </Button>
              )}
              {signControl ?? (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="esign-sign"
                  onClick={() => {
                    void signFixturePacketFromForm().then((result) => {
                      if (!result.ok) {
                        setGate(result.reason);
                      }
                    });
                  }}
                >
                  Sign
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <section data-testid="esign-explain">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">
          Explain (M7)
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Reuses the contract explainer. It describes the sample sections. It
          does not draft language.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.id} data-testid={`esign-section-${section.id}`}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.source}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{section.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {section.askAgent}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}
