import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";

import type { PropertyPhoto } from "@/components/property-photo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { heroPhotoWashClassName, photoWashForSeed } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

/**
 * The photo slot on every property surface. With a `photo` it renders the
 * image over the gradient wash (the wash stays as the loading backdrop);
 * without one the wash and a small house glyph mark the missing photo.
 *
 * Fixture photos are pre-sized JPEGs under public/ and render `unoptimized`:
 * the dev image optimizer intermittently left a cold `/_next/image` key
 * hanging under parallel Playwright contexts, and the static file is small
 * enough that resizing buys nothing here.
 */
export function PhotoTile({
  className,
  children,
  wash,
  seed,
  photo,
  priority = false,
}: {
  className?: string;
  children?: ReactNode;
  wash?: string;
  seed?: string;
  photo?: PropertyPhoto | null;
  /** Set on the above-the-fold hero so the photo is not lazy-loaded. */
  priority?: boolean;
}) {
  const gradient = wash ?? (seed ? photoWashForSeed(seed) : heroPhotoWashClassName);

  return (
    <div
      className={cn("relative overflow-hidden bg-sand", className)}
      data-photo={photo ? "fixture" : "placeholder"}
    >
      <div
        aria-hidden
        className={cn("absolute inset-0 bg-gradient-to-br", gradient)}
      />
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          unoptimized
          priority={priority}
          className="object-cover"
        />
      ) : (
        <Home
          className="absolute bottom-3 left-3 size-4 text-sand-foreground/70"
          aria-hidden
        />
      )}
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
  href,
  photo,
}: {
  addressLine: string;
  cityState: string;
  children?: ReactNode;
  testId: string;
  propertyId?: string;
  rank?: number;
  score?: number;
  sample?: boolean;
  sampleTestId?: string;
  className?: string;
  href?: string;
  photo?: PropertyPhoto | null;
}) {
  return (
    <Card
      data-testid={testId}
      data-property-id={propertyId}
      data-rank={rank}
      data-score={score}
      className={cn("relative py-0", className)}
    >
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 z-0"
          aria-label={`${addressLine}, ${cityState}`}
        />
      ) : null}
      <PhotoTile
        className={cn(
          "aspect-[20/19] w-full",
          href ? "pointer-events-none" : undefined,
        )}
        seed={propertyId ?? addressLine}
        photo={photo}
      >
        {rank !== undefined ? (
          <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2 py-0.5 text-eyebrow font-medium text-foreground">
            #{rank}
          </span>
        ) : null}
        {sample ? (
          <Badge
            variant="quiet"
            data-testid={sampleTestId}
            className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm"
          >
            sample data
          </Badge>
        ) : null}
      </PhotoTile>
      <div className="space-y-2 px-4 pt-3 pb-4">
        <div className={href ? "pointer-events-none" : undefined}>
          <p className="font-heading text-base leading-snug font-medium">
            {addressLine}
          </p>
          <p className="text-sm text-muted-foreground">{cityState}</p>
        </div>
        <div className={href ? "relative z-10" : undefined}>{children}</div>
      </div>
    </Card>
  );
}
