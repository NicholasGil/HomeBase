import { Badge } from "@/components/ui/badge";
import { owedTodayDisplay } from "@/lib/owed-today-display";
import type { MoneyFigure } from "../../convex/lib/offerModel";

export function MoneyFigureView({
  figure,
  testId,
}: {
  figure: MoneyFigure | null | undefined;
  testId?: string;
}) {
  const display = owedTodayDisplay(figure);

  if (display.kind === "missing" || figure === null || figure === undefined) {
    return (
      <div className="space-y-1" data-testid={testId}>
        <p className={display.amountClassName}>{display.amountText}</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-1"
      data-testid={testId}
      data-provenance={figure.provenance}
    >
      <p className={display.amountClassName}>
        {display.kind === "estimate" ? (
          <span className="mr-2 align-middle text-xs font-semibold not-italic tracking-[0.18em]">
            {display.estimateLabel}
          </span>
        ) : null}
        {display.amountText}
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant={display.kind === "issued" ? "default" : "outline"}>
          {figure.provenance}
        </Badge>
        <Badge variant="secondary">
          {display.kind === "issued" ? "issued" : "estimate"}
        </Badge>
        {figure.label ? <Badge variant="secondary">{figure.label}</Badge> : null}
      </div>
    </div>
  );
}
