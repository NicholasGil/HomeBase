/**
 * Fixture photography for the seeded properties. The seed's `media` arrays
 * are empty and the dashboard/tour/search views carry no media field, so
 * the presentation layer keys a fixture photo off the property's first
 * address line. Anything not in this table (every real property) falls back
 * to the gradient wash. Files live in public/fixtures/properties.
 */
export type PropertyPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const FIXTURE_PHOTOS: Record<string, PropertyPhoto> = {
  "814 Maple Ave": {
    src: "/fixtures/properties/814-maple-ave.jpg",
    alt: "Sample photo standing in for 814 Maple Ave: a brick ranch under a maple tree.",
    width: 1280,
    height: 720,
  },
  "22 Cedar Trail": {
    src: "/fixtures/properties/22-cedar-trail.jpg",
    alt: "Sample photo standing in for 22 Cedar Trail: a two-story brick and siding home.",
    width: 1280,
    height: 720,
  },
  "4101 Oakwood Ave": {
    src: "/fixtures/properties/4101-oakwood-ave.jpg",
    alt: "Sample photo standing in for 4101 Oakwood Ave: a yellow bungalow with a porch swing.",
    width: 960,
    height: 720,
  },
  "88 Legacy Dr": {
    src: "/fixtures/properties/88-legacy-dr.jpg",
    alt: "Sample photo standing in for 88 Legacy Dr: a two-story brick home with a two-car garage.",
    width: 960,
    height: 720,
  },
  "212 Nick Fitcheard Rd": {
    src: "/fixtures/properties/212-nick-fitcheard-rd.jpg",
    alt: "Sample photo standing in for 212 Nick Fitcheard Rd: a brick ranch on a wide lawn.",
    width: 960,
    height: 720,
  },
  "701 6th Ave SE": {
    src: "/fixtures/properties/701-6th-ave-se.jpg",
    alt: "Sample photo standing in for 701 6th Ave SE: a green craftsman with a deep porch.",
    width: 960,
    height: 720,
  },
  "109 Valley Wind Dr": {
    src: "/fixtures/properties/109-valley-wind-dr.jpg",
    alt: "Sample photo standing in for 109 Valley Wind Dr: a stone and brick home below a ridge.",
    width: 960,
    height: 720,
  },
  "44 Elm Grove Rd": {
    src: "/fixtures/properties/44-elm-grove-rd.jpg",
    alt: "Sample photo standing in for 44 Elm Grove Rd: a white brick farmhouse with a metal roof.",
    width: 960,
    height: 720,
  },
};

export function seedPropertyPhoto(
  line1: string | null | undefined,
): PropertyPhoto | null {
  if (!line1) {
    return null;
  }
  return FIXTURE_PHOTOS[line1.trim()] ?? null;
}
