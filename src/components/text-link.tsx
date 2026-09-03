import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Underlined text link on the pack's 44px tap-target floor. The type stays
 * small; the hit area grows around it, so it can sit in a card header or a
 * notice without turning into a button.
 */
export const textLinkClassName =
  "inline-flex min-h-11 min-w-11 items-center text-sm underline underline-offset-4";

export function TextLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link {...props} className={cn(textLinkClassName, className)} />;
}
