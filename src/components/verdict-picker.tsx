import { Heart, Meh, ThumbsDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const VERDICTS = ["love", "maybe", "no"] as const;
export type Verdict = (typeof VERDICTS)[number];

const VERDICT_OPTIONS: ReadonlyArray<{
  value: Verdict;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "love", label: "Love it", icon: Heart },
  { value: "maybe", label: "Maybe", icon: Meh },
  { value: "no", label: "No", icon: ThumbsDown },
];

export function isVerdict(value: unknown): value is Verdict {
  return typeof value === "string" && VERDICTS.some((row) => row === value);
}

/**
 * Three 56px radio buttons for the post-showing verdict. Plain radios keep
 * this a real form field (`formData.get(name)`), so it works in the server
 * action form and in the live client form alike.
 */
export function VerdictPicker({
  name = "verdict",
  defaultValue = "maybe",
  legend = "After the showing",
  className,
}: {
  name?: string;
  defaultValue?: Verdict;
  legend?: string;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)} data-slot="verdict-picker">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {VERDICT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            data-verdict={value}
            className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium transition-colors select-none hover:bg-muted has-checked:border-transparent has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={value === defaultValue}
              className="sr-only"
            />
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
