"use client";

import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Id } from "../../convex/_generated/dataModel";
import { tripHeadingClassName } from "@/lib/trip-ui";
import { api } from "../../convex/_generated/api";

export function LiveVendorDirectory({
  transactionId,
}: {
  transactionId: string;
}) {
  const directory = useQuery(api.vendors.listForStage, {
    transactionId: transactionId as Id<"transactions">,
  });
  const requestAppointment = useMutation(api.vendors.requestAppointment);

  if (directory === undefined) {
    return <p className="text-sm text-muted-foreground">Loading vendors…</p>;
  }

  const inspectors = directory.vendors.filter(
    (vendor) => vendor.category === "inspectors",
  );
  const rest = directory.vendors.filter(
    (vendor) => vendor.category !== "inspectors",
  );

  return (
    <section className="space-y-4" data-testid="vendor-directory">
      <div>
        <h2 className={tripHeadingClassName}>Vendors for this stage</h2>
        <p className="text-sm text-muted-foreground">
          Compensation stays none. HomeBase does not take payment.
        </p>
      </div>
      {inspectors.length >= 2 ? (
        <Card data-testid="vendor-compare">
          <CardHeader>
            <CardTitle>Compare inspectors</CardTitle>
            <CardDescription>Credentials and contact only.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {inspectors.map((vendor) => (
              <Card key={vendor._id} data-testid={`vendor-card-${vendor._id}`}>
                <CardHeader>
                  <CardTitle>{vendor.name}</CardTitle>
                  <CardDescription>{vendor.category} · compare</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{vendor.notes}</p>
                  <p className="text-muted-foreground">{vendor.credentials}</p>
                  <Badge variant="outline">Compensation: none</Badge>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void requestAppointment({
                        transactionId: transactionId as Id<"transactions">,
                        vendorId: vendor._id,
                        startsAt: Date.now() + 86_400_000,
                        endsAt: Date.now() + 86_400_000 + 7_200_000,
                      });
                    }}
                  >
                    Request appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {directory.vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="vendor-directory-empty">
          No vendors surface on this stage.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(inspectors.length >= 2 ? rest : directory.vendors).map((vendor) => (
            <Card key={vendor._id} data-testid={`vendor-card-${vendor._id}`}>
              <CardHeader>
                <CardTitle>{vendor.name}</CardTitle>
                <CardDescription>{vendor.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{vendor.notes}</p>
                <Badge variant="outline">Compensation: none</Badge>
                <Button
                  variant="outline"
                  onClick={() => {
                    void requestAppointment({
                      transactionId: transactionId as Id<"transactions">,
                      vendorId: vendor._id,
                      startsAt: Date.now() + 86_400_000,
                      endsAt: Date.now() + 86_400_000 + 7_200_000,
                    });
                  }}
                >
                  Request appointment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
