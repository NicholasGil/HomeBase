"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { SignatureWorkflow } from "@/components/signature-workflow";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

export function LiveSignatureWorkflow() {
  const packets = useQuery(api.esign.listMine, {});
  const flags = useQuery(api.orgs.getFlags, {});
  const firstId = packets?.[0]?._id;
  const detail = useQuery(
    api.esign.getPacket,
    firstId === undefined ? "skip" : { packetId: firstId },
  );
  const send = useMutation(api.esign.sendToProvider);
  const sign = useMutation(api.esign.signWithProvider);
  const [gate, setGate] = useState<string | null>(null);

  if (packets === undefined || flags === undefined) {
    return <p className="text-sm text-muted-foreground">Loading packets…</p>;
  }

  const first = packets[0];

  return (
    <div className="space-y-4">
      <SignatureWorkflow
        packets={packets.map((packet) => ({
          id: packet._id,
          transactionId: packet.transactionId,
          documentId: packet.documentId,
          documentType: packet.designated
            ? "purchase_agreement"
            : "document",
          status: packet.status,
          designated: packet.designated,
          explainedSectionIds: packet.explainedSectionIds,
          agentReviewedById: packet.agentReviewedById,
          buyerReviewedById: packet.buyerReviewedById,
          providerRef: packet.providerRef,
        }))}
        sections={detail?.sections ?? []}
        flagOn={flags.FLAG_ESIGN}
        sendControl={
          <Button
            type="button"
            data-testid="esign-send"
            onClick={() => {
              if (first === undefined) {
                return;
              }
              void send({ packetId: first._id }).catch((error: unknown) => {
                setGate(
                  error instanceof Error ? error.message : "FORBIDDEN",
                );
              });
            }}
          >
            Send to provider
          </Button>
        }
        signControl={
          <Button
            type="button"
            variant="outline"
            data-testid="esign-sign"
            onClick={() => {
              if (first === undefined) {
                return;
              }
              void sign({ packetId: first._id }).catch((error: unknown) => {
                setGate(
                  error instanceof Error ? error.message : "FORBIDDEN",
                );
              });
            }}
          >
            Sign
          </Button>
        }
      />
      {gate !== null ? <p data-testid="esign-gate">{gate}</p> : null}
    </div>
  );
}
