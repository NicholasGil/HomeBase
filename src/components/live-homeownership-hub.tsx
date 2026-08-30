"use client";

import { useMutation, useQuery } from "convex/react";

import { HomeownershipHubDenied, HomeownershipHubView } from "@/components/homeownership-hub";
import { Button } from "@/components/ui/button";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function LiveHomeownershipHub({
  transactionId,
}: {
  transactionId: string;
}) {
  const view = useQuery(api.homeownership.getHub, {
    transactionId: transactionId as Id<"transactions">,
  });
  const reengage = useMutation(api.homeownership.reengageVendor);

  if (view === undefined) {
    return <p className="text-sm text-muted-foreground">Loading hub…</p>;
  }

  if (view === null) {
    return <HomeownershipHubDenied />;
  }

  return (
    <div className="space-y-4">
      <HomeownershipHubView view={view} liveReengage />
      <div className="space-y-2">
        {view.vendors.map((vendor) => (
          <form
            key={vendor.vendorId}
            action={() => {
              void reengage({
                transactionId: transactionId as Id<"transactions">,
                vendorId: vendor.vendorId as Id<"vendors">,
              });
            }}
          >
            <Button
              type="submit"
              disabled={vendor.reengaged}
              data-testid={`hub-reengage-${vendor.vendorId}`}
            >
              {vendor.reengaged ? "Re-engaged" : `Re-engage ${vendor.name}`}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
