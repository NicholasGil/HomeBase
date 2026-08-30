import { Badge } from "@/components/ui/badge";
import { ESTIMATE_LABEL, formatUsd } from "@/lib/owed-today-display";
import type { MoneyFigure } from "../../convex/lib/offerModel";

function figureLabel(figure: MoneyFigure) {
  const unofficial =
    figure.provenance === "ai_estimate" || figure.provenance === "user_entered";
  return unofficial ? ESTIMATE_LABEL : null;
}

export function MoneyFigureView({
  figure,
  testId,
}: {
  figure: MoneyFigure;
  testId?: string;
}) {
  const estimate = figureLabel(figure);
  return (
    <div className="space-y-1" data-testid={testId} data-provenance={figure.provenance}>
      <p className="font-mono text-sm tabular-nums">
        {estimate ? (
          <span className="mr-2 align-middle text-xs font-semibold tracking-[0.18em]">
            {estimate}
          </span>
        ) : null}
        {formatUsd(figure.amountCents)}
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{figure.provenance}</Badge>
        {figure.label ? <Badge variant="secondary">{figure.label}</Badge> : null}
      </div>
    </div>
  );
}
