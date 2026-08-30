import {
  buildTourFromForm,
  removeStopFromForm,
  submitFeedbackFromForm,
} from "@/app/actions/tours";
import { ListingCardFrame } from "@/components/listing-card";
import { TourMap } from "@/components/tour-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTourInstant, propertyLine } from "@/lib/tour-format";
import type { FixtureTour } from "@/lib/tour-access";
import { seedTourListings } from "@/lib/seed-tours";
import { tripHeadingClassName } from "@/lib/trip-ui";

export function FixtureTourBuilder({
  denied,
  tours,
}: {
  denied?: boolean;
  tours: FixtureTour[];
}) {
  const listings = seedTourListings();
  const tour = tours[0];

  if (denied) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="tour-denied">
        You cannot open tours.
      </p>
    );
  }

  return (
    <section className="space-y-6" data-testid="tour-builder">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className={tripHeadingClassName}>
            Showing scheduler
          </h2>
          <p className="text-sm text-muted-foreground">
            Select properties, then Build My Tour. Drive times use the fixture
            distance path until a Routes API key exists.
          </p>
        </div>
        <Badge variant="outline">sample listings</Badge>
      </div>

      <form action={buildTourFromForm} className="space-y-4">
        <div className="grid gap-5 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCardFrame
              key={listing.id}
              testId={`tour-candidate-${listing.id}`}
              addressLine={listing.address.line1}
              cityState={`${listing.address.city}, ${listing.address.state} · sample data`}
            >
              <p className="text-sm">{listing.brief}</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="propertyIds"
                  value={listing.id}
                  data-testid={`select-${listing.id}`}
                />
                Add to tour
              </label>
            </ListingCardFrame>
          ))}
        </div>
        <Button type="submit" variant="next" data-testid="build-my-tour">
          Build My Tour
        </Button>
      </form>

      {tour ? (
        <TourItineraryPanel tour={tour} />
      ) : (
        <p className="text-sm text-muted-foreground">No tour built yet.</p>
      )}
    </section>
  );
}

function TourItineraryPanel({ tour }: { tour: FixtureTour }) {
  return (
    <div className="space-y-4" data-testid="tour-itinerary">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Itinerary</h3>
        <p className="text-sm text-muted-foreground">
          Leave {tour.originLabel} at {formatTourInstant(tour.originDepartAt)}.
          Drive times are fixture, not live Routes API.
        </p>
      </div>

      <div
        data-testid="departure-notice"
        className="rounded-lg border px-4 py-3 text-sm"
      >
        {tour.departureNotice.message}
      </div>

      <TourMap
        origin={{
          lat: tour.originCoordinates.lat,
          lng: tour.originCoordinates.lng,
          label: tour.originLabel,
        }}
        stops={tour.stops.flatMap((stop) => {
          const listing = seedTourListings().find(
            (row) => row.id === stop.propertyId,
          );
          if (listing === undefined) {
            return [];
          }
          return [
            {
              lat: listing.coordinates.lat,
              lng: listing.coordinates.lng,
              label: propertyLine(listing.address),
              order: stop.order,
            },
          ];
        })}
      />

      <ol className="space-y-4">
        {tour.stops.map((stop) => {
          const listing = seedTourListings().find(
            (row) => row.id === stop.propertyId,
          );
          const feedback = tour.feedback.find(
            (row) => row.stopId === stop.stopId,
          );
          return (
            <li
              key={stop.stopId}
              data-testid={`tour-stop-${stop.order}`}
              data-property-id={stop.propertyId}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    Stop {stop.order}
                    {listing ? ` · ${listing.address.line1}` : ""}
                  </CardTitle>
                  <CardDescription>
                    Arrive {formatTourInstant(stop.arriveAt)} · depart{" "}
                    {formatTourInstant(stop.departAt)} · {stop.driveMinutes} min
                    drive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{stop.brief}</p>
                  <p className="text-sm text-muted-foreground">
                    {stop.directionsSummary}
                  </p>
                  <p
                    data-testid={`window-ok-${stop.order}`}
                    data-window-violated="false"
                    className="text-xs text-muted-foreground"
                  >
                    Inside listing window
                  </p>
                  <form action={removeStopFromForm}>
                    <input type="hidden" name="tourId" value={tour.tourId} />
                    <input type="hidden" name="stopId" value={stop.stopId} />
                    <Button
                      type="submit"
                      variant="outline"
                      data-testid={`remove-stop-${stop.order}`}
                    >
                      Remove stop
                    </Button>
                  </form>
                  <form action={submitFeedbackFromForm} className="space-y-2">
                    <input type="hidden" name="tourId" value={tour.tourId} />
                    <input type="hidden" name="stopId" value={stop.stopId} />
                    <p className="text-sm font-medium">After the showing</p>
                    <select
                      name="verdict"
                      defaultValue={feedback?.verdict ?? "maybe"}
                      className="rounded-md border bg-background px-2 py-1 text-sm"
                    >
                      <option value="love">love</option>
                      <option value="maybe">maybe</option>
                      <option value="no">no</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(
                        [
                          "kitchen",
                          "location",
                          "yard",
                          "condition",
                          "layout",
                          "value",
                        ] as const
                      ).map((key) => (
                        <label key={key} className="flex items-center gap-2">
                          {key}
                          <input
                            type="number"
                            name={key}
                            min={1}
                            max={5}
                            defaultValue={feedback?.ratings[key] ?? 3}
                            className="w-14 rounded-md border bg-background px-1 py-0.5"
                          />
                        </label>
                      ))}
                    </div>
                    <Button type="submit" variant="secondary">
                      Save feedback
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
