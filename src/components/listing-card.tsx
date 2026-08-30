import { Home } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <div className="grid sm:grid-cols-[9.5rem_minmax(0,1fr)]">
        <div className="relative flex aspect-[4/3] items-end bg-foreground/8 px-3 py-3 sm:aspect-auto sm:min-h-[8.5rem]">
          <Home className="size-4 text-muted-foreground" aria-hidden />
          {rank !== undefined ? (
            <span className="absolute top-3 right-3 text-[11px] text-muted-foreground">
              #{rank}
            </span>
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-heading text-base leading-snug font-medium">
                {addressLine}
              </p>
              <p className="text-sm text-muted-foreground">{cityState}</p>
            </div>
            {sample ? (
              <Badge variant="secondary" data-testid={sampleTestId}>
                sample data
              </Badge>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}
