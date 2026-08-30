import { SEED_TOUR, SEED_TOUR_PROPERTY_IDS } from "../../convex/seedPlan";

export { SEED_TOUR, SEED_TOUR_PROPERTY_IDS };

export type SeedTourPropertyId =
  (typeof SEED_TOUR_PROPERTY_IDS)[keyof typeof SEED_TOUR_PROPERTY_IDS];

export function isSeedTourPropertyId(
  value: string,
): value is SeedTourPropertyId {
  return (
    value === SEED_TOUR_PROPERTY_IDS.oakwood ||
    value === SEED_TOUR_PROPERTY_IDS.madison ||
    value === SEED_TOUR_PROPERTY_IDS.harvest ||
    value === SEED_TOUR_PROPERTY_IDS.decatur
  );
}

export function seedTourListings() {
  return SEED_TOUR.properties.map((property) => ({
    id: property.id,
    address: property.address,
    specs: property.specs,
    brief: property.brief,
    coordinates: property.coordinates,
    source: "manual" as const,
    showingDurationMinutes: SEED_TOUR.appointmentLengthMinutes,
    availabilityWindows: [...SEED_TOUR.propertyWindows],
  }));
}
