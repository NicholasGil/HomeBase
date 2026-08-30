import { fixtureDriveMinutes, type GeoPoint } from "./driveTimes";
import type { MoneyFigure } from "./offerModel";

export const CANONICAL_SEARCH_QUERY =
  "4-bedroom under $450k, some land, good garage, ~20 minutes from town";

export const SOME_LAND_ACRES = 0.35;
export const GOOD_GARAGE_SPACES = 2;

export const MLS_FEED_NOT_ENABLED = "MLS_FEED_NOT_ENABLED";

export const SEARCH_SCORE = {
  bedsMatch: 40,
  bedsMiss: -25,
  priceUnder: 30,
  priceOver: -40,
  landMatch: 25,
  landMiss: -15,
  garageGood: 20,
  garageOk: 8,
  garageMiss: -10,
  driveMax: 25,
  save: 50,
  dislike: -80,
  tour: 15,
  showingLove: 40,
  showingMaybe: 5,
  showingNo: -50,
} as const;

export type SearchCriteria = {
  beds: number | null;
  priceCapCents: number | null;
  minLotAcres: number | null;
  minGarageSpaces: number | null;
  driveMinutesFromTown: number | null;
  location: string | null;
};

export type SearchListing = {
  id: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  specs: {
    beds?: number;
    baths?: number;
    sqft?: number;
    lotAcres?: number;
    garageSpaces?: number;
    yearBuilt?: number;
  };
  source: "manual" | "csv" | "mls";
  coordinates?: GeoPoint;
  brief?: string;
  listPrice?: MoneyFigure;
  driveMinutesFromTown?: number;
};

export type ShowingVerdict = "love" | "maybe" | "no";

export type SearchFeedbackEvent =
  | { kind: "save"; propertyId: string }
  | { kind: "dislike"; propertyId: string }
  | { kind: "tour"; propertyId: string }
  | { kind: "showing"; propertyId: string; verdict: ShowingVerdict };

export type SearchInventoryKind = "sample" | "licensed_feed";

export type SearchInventory =
  | { kind: "sample"; flagMls: false }
  | { kind: "licensed_feed"; enabled: false; flagMls: true };

export type RankedSearchResult = {
  id: string;
  score: number;
  reason: string;
  sampleData: boolean;
  listing: SearchListing;
};

export function searchInventoryForFlag(mlsEnabled: boolean): SearchInventory {
  if (mlsEnabled) {
    return { kind: "licensed_feed", enabled: false, flagMls: true };
  }
  return { kind: "sample", flagMls: false };
}

export function isSampleSource(source: SearchListing["source"]) {
  return source === "manual" || source === "csv";
}

export function filterSearchableListings(
  listings: readonly SearchListing[],
  mlsEnabled: boolean,
): { inventory: SearchInventory; listings: SearchListing[] } {
  const inventory = searchInventoryForFlag(mlsEnabled);
  if (inventory.kind === "licensed_feed") {
    return { inventory, listings: [] };
  }
  return {
    inventory,
    listings: listings.filter((listing) => isSampleSource(listing.source)),
  };
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseBeds(text: string): number | null {
  const match = text.match(/(\d+)\s*-?\s*(?:bed(?:room)?s?|br)\b/);
  if (match?.[1] === undefined) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function parsePriceCapCents(text: string): number | null {
  const match = text.match(
    /(?:under|below|less than|<)\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?\b/,
  );
  if (match?.[1] === undefined) {
    return null;
  }
  const raw = Number.parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(raw)) {
    return null;
  }
  const unit = match[2]?.toLowerCase();
  const dollars = unit === "m" ? raw * 1_000_000 : unit === "k" ? raw * 1_000 : raw;
  return Math.round(dollars * 100);
}

function parseLandAcres(text: string): number | null {
  if (/\bsome land\b/.test(text) || /\blot\b/.test(text) || /\bacres?\b/.test(text)) {
    return SOME_LAND_ACRES;
  }
  return null;
}

function parseGarageSpaces(text: string): number | null {
  if (/\bgood garage\b/.test(text) || /\b(?:two|2)[-\s]?car\b/.test(text)) {
    return GOOD_GARAGE_SPACES;
  }
  const match = text.match(/(\d+)\s*(?:car|garage)/);
  if (match?.[1] === undefined) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function parseDriveMinutes(text: string): number | null {
  const match = text.match(
    /~?\s*(\d+)\s*(?:minutes?|mins?)\s+from\s+town/,
  );
  if (match?.[1] === undefined) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

const LOCATION_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "near",
  "around",
  "for",
  "of",
  "and",
  "or",
  "with",
  "to",
  "from",
  "at",
  "on",
  "homes",
  "home",
  "house",
  "houses",
  "listings",
  "listing",
  "property",
  "properties",
  "sale",
  "buy",
  "looking",
  "want",
  "need",
  "some",
  "good",
  "under",
  "below",
  "less",
  "than",
  "bedroom",
  "bedrooms",
  "bed",
  "beds",
  "br",
  "garage",
  "car",
  "minutes",
  "minute",
  "mins",
  "min",
  "town",
  "about",
  "approx",
]);

export function locationTextFromQuery(query: string): string | null {
  let text = normalizeQuery(query);
  if (text === normalizeQuery(CANONICAL_SEARCH_QUERY)) {
    return null;
  }
  text = text
    .replace(/\d+\s*-?\s*(?:bed(?:room)?s?|br)\b/g, " ")
    .replace(/(?:under|below|less than|<)\s*\$?\s*[\d,]+(?:\.\d+)?\s*(k|m)?\b/g, " ")
    .replace(/\$\s*[\d,]+(?:\.\d+)?\s*(k|m)?\b/g, " ")
    .replace(/\bsome land\b/g, " ")
    .replace(/\blot\b/g, " ")
    .replace(/\bacres?\b/g, " ")
    .replace(/\bgood garage\b/g, " ")
    .replace(/\b(?:two|2)[-\s]?car\b/g, " ")
    .replace(/\d+\s*(?:car|garage)/g, " ")
    .replace(/~?\s*\d+\s*(?:minutes?|mins?)\s+from\s+town/g, " ")
    .replace(/[^a-z0-9\s]/g, " ");
  const tokens = text
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !LOCATION_STOP_WORDS.has(token));
  if (tokens.length === 0) {
    return null;
  }
  return tokens.join(" ");
}

export function listingMatchesLocation(
  listing: SearchListing,
  location: string,
): boolean {
  const haystack = [
    listing.address.line1,
    listing.address.city,
    listing.address.state,
    listing.address.postalCode,
    listing.brief ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const tokens = location.split(/\s+/).filter((token) => token.length >= 2);
  return tokens.every((token) => haystack.includes(token));
}

export function parseSearchQuery(query: string): SearchCriteria {
  const text = normalizeQuery(query);
  if (text === normalizeQuery(CANONICAL_SEARCH_QUERY)) {
    return {
      beds: 4,
      priceCapCents: 45_000_000,
      minLotAcres: SOME_LAND_ACRES,
      minGarageSpaces: GOOD_GARAGE_SPACES,
      driveMinutesFromTown: 20,
      location: null,
    };
  }
  return {
    beds: parseBeds(text),
    priceCapCents: parsePriceCapCents(text),
    minLotAcres: parseLandAcres(text),
    minGarageSpaces: parseGarageSpaces(text),
    driveMinutesFromTown: parseDriveMinutes(text),
    location: locationTextFromQuery(query),
  };
}

export function driveMinutesForListing(
  listing: SearchListing,
  town: GeoPoint,
): number | null {
  if (listing.driveMinutesFromTown !== undefined) {
    return listing.driveMinutesFromTown;
  }
  if (listing.coordinates === undefined) {
    return null;
  }
  return fixtureDriveMinutes(town, listing.coordinates);
}

function formatUsdWhole(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function lotPhrase(acres: number | undefined) {
  if (acres === undefined) {
    return "no listed lot";
  }
  if (acres >= 1) {
    return `${acres} acres`;
  }
  return `${acres}-acre lot`;
}

function garagePhrase(spaces: number | undefined) {
  if (spaces === undefined || spaces <= 0) {
    return "no garage";
  }
  if (spaces === 1) {
    return "one-car garage";
  }
  return `${spaces}-car garage`;
}

export function reasonForListing(input: {
  listing: SearchListing;
  criteria: SearchCriteria;
  driveMinutes: number | null;
}): string {
  const { listing, criteria, driveMinutes } = input;
  const parts: string[] = [];
  const beds = listing.specs.beds;
  if (criteria.beds !== null && beds !== undefined) {
    parts.push(
      beds >= criteria.beds
        ? `${beds} bedrooms`
        : `${beds} bedrooms, short of ${criteria.beds}`,
    );
  } else if (beds !== undefined) {
    parts.push(`${beds} bedrooms`);
  }

  if (criteria.priceCapCents !== null) {
    const price = listing.listPrice?.amountCents;
    if (price === undefined) {
      parts.push("list price not stated");
    } else if (price <= criteria.priceCapCents) {
      parts.push(`under ${formatUsdWhole(criteria.priceCapCents)}`);
    } else {
      parts.push(`listed above ${formatUsdWhole(criteria.priceCapCents)}`);
    }
  }

  if (criteria.minLotAcres !== null) {
    const acres = listing.specs.lotAcres;
    parts.push(
      acres !== undefined && acres >= criteria.minLotAcres
        ? lotPhrase(acres)
        : "little or no land",
    );
  }

  if (criteria.minGarageSpaces !== null) {
    const spaces = listing.specs.garageSpaces;
    parts.push(
      spaces !== undefined && spaces >= criteria.minGarageSpaces
        ? garagePhrase(spaces)
        : garagePhrase(spaces),
    );
  }

  if (criteria.driveMinutesFromTown !== null) {
    if (driveMinutes === null) {
      parts.push("drive time from town unknown");
    } else {
      parts.push(`${driveMinutes} minutes from town`);
    }
  }

  if (parts.length === 0) {
    return listing.brief ?? "Matches the search as sample inventory.";
  }
  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function feedbackDelta(propertyId: string, events: readonly SearchFeedbackEvent[]) {
  let delta = 0;
  let signal: "save" | "dislike" | null = null;
  let toured = false;
  let verdict: ShowingVerdict | null = null;
  for (const event of events) {
    if (event.propertyId !== propertyId) {
      continue;
    }
    if (event.kind === "save" || event.kind === "dislike") {
      signal = event.kind;
    } else if (event.kind === "tour") {
      toured = true;
    } else {
      verdict = event.verdict;
    }
  }
  if (signal === "save") {
    delta += SEARCH_SCORE.save;
  } else if (signal === "dislike") {
    delta += SEARCH_SCORE.dislike;
  }
  if (toured) {
    delta += SEARCH_SCORE.tour;
  }
  if (verdict === "love") {
    delta += SEARCH_SCORE.showingLove;
  } else if (verdict === "maybe") {
    delta += SEARCH_SCORE.showingMaybe;
  } else if (verdict === "no") {
    delta += SEARCH_SCORE.showingNo;
  }
  return delta;
}

function criteriaScore(input: {
  listing: SearchListing;
  criteria: SearchCriteria;
  driveMinutes: number | null;
}) {
  const { listing, criteria, driveMinutes } = input;
  let score = 0;
  if (criteria.beds !== null) {
    const beds = listing.specs.beds;
    score +=
      beds !== undefined && beds >= criteria.beds
        ? SEARCH_SCORE.bedsMatch
        : SEARCH_SCORE.bedsMiss;
  }
  if (criteria.priceCapCents !== null) {
    const price = listing.listPrice?.amountCents;
    if (price === undefined) {
      score += 0;
    } else {
      score +=
        price <= criteria.priceCapCents
          ? SEARCH_SCORE.priceUnder
          : SEARCH_SCORE.priceOver;
    }
  }
  if (criteria.minLotAcres !== null) {
    const acres = listing.specs.lotAcres;
    score +=
      acres !== undefined && acres >= criteria.minLotAcres
        ? SEARCH_SCORE.landMatch
        : SEARCH_SCORE.landMiss;
  }
  if (criteria.minGarageSpaces !== null) {
    const spaces = listing.specs.garageSpaces ?? 0;
    if (spaces >= criteria.minGarageSpaces) {
      score += SEARCH_SCORE.garageGood;
    } else if (spaces === 1) {
      score += SEARCH_SCORE.garageOk;
    } else {
      score += SEARCH_SCORE.garageMiss;
    }
  }
  if (criteria.driveMinutesFromTown !== null) {
    if (driveMinutes !== null) {
      const miss = Math.abs(driveMinutes - criteria.driveMinutesFromTown);
      score += Math.max(0, SEARCH_SCORE.driveMax - miss * 2);
    }
  }
  return score;
}

export function rankSearchListings(input: {
  listings: readonly SearchListing[];
  criteria: SearchCriteria;
  feedback?: readonly SearchFeedbackEvent[];
  town: GeoPoint;
  mlsEnabled: boolean;
}): {
  inventory: SearchInventory;
  results: RankedSearchResult[];
} {
  const filtered = filterSearchableListings(input.listings, input.mlsEnabled);
  const location = input.criteria.location;
  const located =
    location === null
      ? filtered.listings
      : filtered.listings.filter((listing) =>
          listingMatchesLocation(listing, location),
        );
  const events = input.feedback ?? [];
  const results = located
    .map((listing) => {
      const driveMinutes = driveMinutesForListing(listing, input.town);
      const score =
        criteriaScore({ listing, criteria: input.criteria, driveMinutes }) +
        feedbackDelta(listing.id, events);
      return {
        id: listing.id,
        score,
        reason: reasonForListing({
          listing,
          criteria: input.criteria,
          driveMinutes,
        }),
        sampleData: isSampleSource(listing.source),
        listing,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.id.localeCompare(right.id);
    });
  return { inventory: filtered.inventory, results };
}

export function assertResultReasons(results: readonly RankedSearchResult[]) {
  return results.every((row) => row.reason.trim().length > 0);
}
