"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { OfferCenterViewPanel } from "@/components/offer-center";
import { Button } from "@/components/ui/button";
import type { OfferCenterView } from "@/lib/offer-access";
import { api } from "../../convex/_generated/api";

export function LiveOfferCenter() {
  const center = useQuery(api.offers.getMine, {});
  const flags = useQuery(api.orgs.getFlags, {});
  const ensureDraft = useMutation(api.offers.ensureDraft);
  const submit = useMutation(api.offers.submit);
  const [gate, setGate] = useState<string | null>(null);
  const esignOn = flags?.FLAG_ESIGN === true;

  if (center === undefined) {
    return <p className="text-sm text-muted-foreground">Loading offer…</p>;
  }

  if (center === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="offer-denied">
        You cannot open this offer.
      </p>
    );
  }

  const view = center as OfferCenterView;

  return (
    <OfferCenterViewPanel
      center={view}
      gateFromSubmit={gate}
      submitControl={
        esignOn ? (
          <div className="flex flex-wrap gap-2">
            {center.offer === null ? (
              <Button
                type="button"
                data-testid="ensure-draft"
                onClick={() => {
                  void ensureDraft({ transactionId: center.transactionId });
                }}
              >
                Start a draft
              </Button>
            ) : (
              <Button
                type="button"
                data-testid="submit-offer"
                onClick={() => {
                  const offerId = center.offer?._id;
                  if (offerId === undefined) {
                    return;
                  }
                  void submit({ offerId }).catch((error: unknown) => {
                    const message =
                      error instanceof Error ? error.message : "FORBIDDEN";
                    setGate(message);
                  });
                }}
              >
                Submit offer
              </Button>
            )}
          </div>
        ) : (
          <p
            data-testid="submit-offer-gated"
            className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          >
            E-signature is off. Offers cannot be submitted until FLAG_ESIGN is
            enabled.
          </p>
        )
      }
    />
  );
}
