import { Check } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * "Add to tour" as a 44px toggle chip. The native checkbox keeps its form and
 * accessibility semantics and is stretched over the whole 44×44 box, so the
 * element carrying `data-testid` is itself the finger-sized hit target. The
 * drawn box beside the label mirrors the input's state through `peer-checked`.
 */
export function AddToTourToggle({
  className,
  ...inputProps
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl pr-3 text-sm font-medium transition-colors select-none hover:bg-muted has-checked:bg-sage has-checked:text-sage-foreground has-checked:hover:bg-sage",
        className,
      )}
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          {...inputProps}
          className="peer absolute inset-0 size-11 cursor-pointer appearance-none rounded-xl outline-none"
        />
        <span
          aria-hidden
          className="flex size-5 items-center justify-center rounded-[6px] border-2 border-border bg-background text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </span>
      Add to tour
    </label>
  );
}
