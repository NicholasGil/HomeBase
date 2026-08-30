import {
  SEED_OFFER_MARKET,
  SEED_SEARCH,
  SEED_SEARCH_PROPERTY_IDS,
  SEED_TOUR,
  SEED_TOUR_PROPERTY_IDS,
} from "../../convex/seedPlan";
import type { SearchListing } from "../../convex/lib/propertySearch";

export { SEED_SEARCH, SEED_SEARCH_PROPERTY_IDS };

export function seedSearchListings(): SearchListing[] {
  const tour = SEED_TOUR.properties.map((property) => ({
    id: property.id,
    address: property.address,
    specs: property.specs,
    source: "manual" as const,
    coordinates: property.coordinates,
    brief: property.brief,
    listPrice: { ...SEED_OFFER_MARKET.tourListPrices[property.id] },
  }));
  const extra = SEED_SEARCH.properties.map((property) => ({
    id: property.id,
    address: property.address,
    specs: property.specs,
    source: property.source,
    coordinates: property.coordinates,
    brief: property.brief,
    listPrice: { ...property.listPrice },
  }));
  return [...tour, ...extra];
}

export function isSeedSearchPropertyId(value: string) {
  return (
    value === SEED_TOUR_PROPERTY_IDS.oakwood ||
    value === SEED_TOUR_PROPERTY_IDS.madison ||
    value === SEED_TOUR_PROPERTY_IDS.harvest ||
    value === SEED_TOUR_PROPERTY_IDS.decatur ||
    value === SEED_SEARCH_PROPERTY_IDS.jonesValley ||
    value === SEED_SEARCH_PROPERTY_IDS.athens ||
    value === SEED_SEARCH_PROPERTY_IDS.mlsHidden
  );
}
