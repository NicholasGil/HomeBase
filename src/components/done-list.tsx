"use client";

import { Check } from "lucide-react";
import { useState } from "react";

export const DONE_PREVIEW_COUNT = 2;

export function DoneList({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const overflow = items.length - DONE_PREVIEW_COUNT;
  const visible = expanded ? items : items.slice(0, DONE_PREVIEW_COUNT);

  if (items.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        Nothing marked done yet.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-2 space-y-1.5 text-sm">
        {visible.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check
              className="mt-0.5 size-4 shrink-0 text-sage-foreground"
              aria-hidden
            />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
      {overflow > 0 ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="-ml-2 mt-1 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-sage-foreground underline-offset-4 hover:underline"
        >
          {expanded ? "Show less" : `${overflow} more`}
        </button>
      ) : null}
    </>
  );
}
