import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/*
  The pack §2 type-scale utilities (globals.css `--text-*` tokens). Listed
  here so tailwind-merge treats `text-body` as a font size that conflicts
  with `text-sm`, not as a text color that would knock out `text-foreground`.
*/
export const TYPE_SCALE_TOKENS = [
  "display",
  "h1",
  "h2",
  "h3",
  "body",
  "small",
  "eyebrow",
] as const

const twMerge = extendTailwindMerge({
  extend: { theme: { text: [...TYPE_SCALE_TOKENS] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
