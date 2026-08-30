import {
  requestFixtureAppointmentFromForm,
} from "@/app/actions/vendors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ListedSeedVendor } from "@/lib/seed-vendors";
import { tripHeadingClassName } from "@/lib/trip-ui";

export function VendorDirectoryDenied() {
  return (
    <p className="text-sm text-muted-foreground" data-testid="vendor-directory-denied">
      You cannot open this vendor directory.
    </p>
  );
}

export function VendorDirectoryView({
  stage,
  transactionId,
  vendors,
  requestedVendorIds,
}: {
  stage: string;
  transactionId: string;
  vendors: ListedSeedVendor[];
  requestedVendorIds: string[];
}) {
  const inspectors = vendors.filter((vendor) => vendor.category === "inspectors");
  const rest = vendors.filter((vendor) => vendor.category !== "inspectors");

  return (
    <section className="space-y-4" data-testid="vendor-directory">
      <div>
        <h2 className={tripHeadingClassName}>Vendors for this stage</h2>
        <p className="text-sm text-muted-foreground">
          {stage === "inspection"
            ? "Inspectors for this file. Compare, then request an appointment."
            : "Vendors that belong on this stage."}{" "}
          Compensation stays none. HomeBase does not take payment.
        </p>
      </div>

      {inspectors.length >= 2 ? (
        <Card data-testid="vendor-compare">
          <CardHeader>
            <CardTitle>Compare inspectors</CardTitle>
            <CardDescription>
              Credentials and contact only. No fees, no referral.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {inspectors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                transactionId={transactionId}
                requested={requestedVendorIds.includes(vendor.id)}
                compare
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="vendor-directory-empty">
          No vendors surface on this stage.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(inspectors.length >= 2 ? rest : vendors).map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              transactionId={transactionId}
              requested={requestedVendorIds.includes(vendor.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function VendorCard({
  vendor,
  transactionId,
  requested,
  compare,
}: {
  vendor: ListedSeedVendor;
  transactionId: string;
  requested: boolean;
  compare?: boolean;
}) {
  return (
    <Card
      data-testid={`vendor-card-${vendor.id}`}
      data-category={vendor.category}
    >
      <CardHeader>
        <CardTitle>{vendor.name}</CardTitle>
        <CardDescription>
          {vendor.category}
          {compare ? " · compare" : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{vendor.notes}</p>
        <p className="text-muted-foreground">{vendor.credentials}</p>
        <p>
          {vendor.contact.phone ?? "No phone"}
          {vendor.contact.email ? ` · ${vendor.contact.email}` : null}
        </p>
        <Badge variant="sage">Compensation: none</Badge>
        <form action={requestFixtureAppointmentFromForm}>
          <input type="hidden" name="transactionId" value={transactionId} />
          <input type="hidden" name="vendorId" value={vendor.id} />
          <Button type="submit" variant="outline">
            {requested ? "Appointment requested" : "Request appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
