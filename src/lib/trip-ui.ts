export const tripStackClassName =
  "divide-y divide-border/70 [&>*]:py-12 [&>*:first-child]:pt-0 [&>*:last-child]:pb-4";

export const tripHeadingClassName = "text-lg font-semibold tracking-tight";

export const cardLiftClassName =
  "transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]";

export const searchPillClassName =
  "flex items-center gap-2 rounded-full bg-card py-1.5 pr-1.5 pl-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-black/5";

export const searchPillInputClassName =
  "min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground";

export const heroPhotoWashClassName =
  "from-peach via-sand to-sage/70";

export const PHOTO_WASHES = [
  "from-sand via-peach to-sage/60",
  "from-sage via-sky/80 to-sand",
  "from-sky via-sage/70 to-peach/80",
  "from-peach via-sand to-sky/50",
  "from-sage/90 via-sand to-peach",
  "from-sky/80 via-peach/70 to-sage/80",
] as const;

export function photoWashForSeed(seed: string): (typeof PHOTO_WASHES)[number] {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return (
    PHOTO_WASHES[Math.abs(hash) % PHOTO_WASHES.length] ??
    "from-sand via-peach to-sage/60"
  );
}
