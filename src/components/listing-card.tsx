import { Home } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PhotoTile({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-neutral-200",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-neutral-300 via-zinc-200 to-slate-300"
      />
      <Home
        className="absolute bottom-3 left-3 size-4 text-neutral-500"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function ListingCardFrame({
  addressLine,
  cityState,
  children,
  testId,
  propertyId,
  rank,
  score,
  sample,
  sampleTestId,
  className,
}: {
  addressLine: string;
  cityState: string;
  children: React.ReactNode;
  testId: string;
  propertyId?: string;
  rank?: number;
  score?: number;
  sample?: boolean;
  sampleTestId?: string;
  className?: string;
}) {
  return (
    <Card
      data-testid={testId}
      data-property-id={propertyId}
      data-rank={rank}
      data-score={score}
      className={cn("py-0", className)}
    >
      <PhotoTile className="aspect-[20/19] w-full">
        {rank !== undefined ? (
          <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium text-foreground">
            #{rank}
          </span>
        ) : null}
        {sample ? (
          <Badge
            variant="secondary"
            data-testid={sampleTestId}
            className="absolute top-3 right-3"
          >
            sample data
          </Badge>
        ) : null}
      </PhotoTile>
      <div className="space-y-2 px-4 pt-3 pb-4">
        <div>
          <p className="font-heading text-base leading-snug font-medium">
            {addressLine}
          </p>
          <p className="text-sm text-muted-foreground">{cityState}</p>
        </div>
        {children}
      </div>
    </Card>
  );
}
