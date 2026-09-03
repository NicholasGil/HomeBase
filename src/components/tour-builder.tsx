import {
  buildTourFromForm,
  removeStopFromForm,
  submitFeedbackFromForm,
} from "@/app/actions/tours";
import { AccessDeniedCard } from "@/components/access-denied-card";
import { AddToTourToggle } from "@/components/add-to-tour-toggle";
import { NoTourYet } from "@/components/no-tour-yet";
import { ActionNotice } from "@/components/action-notice";
import { ListingCardFrame } from "@/components/listing-card";
import {
  TourBuildAction,
  tourBuildButtonClassName,
} from "@/components/tour-build-action";
import { TourMap } from "@/components/tour-map";
import { TourMapDisclosure } from "@/components/tour-map-disclosure";
import {
  TourTimeline,
  TourTimelineOrigin,
  TourTimelineStop,
} from "@/components/tour-timeline";
import { VerdictPicker } from "@/components/verdict-picker";
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
  notice,
  returnTo = "/tours",
}: {
  denied?: boolean;
  tours: FixtureTour[];
  notice?: string;
  returnTo?: string;
}) {
  const listings = seedTourListings();
  const tour = tours[0];
  const selectedIds = new Set(tour?.stops.map((stop) => stop.propertyId) ?? []);

  if (denied) {
    return <AccessDeniedCard testId="tour-denied" title="You cannot open tours." />;
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
        <Badge variant="sage">sample listings</Badge>
      </div>

      {notice === "feedback" ? (
        <p
          data-testid="tour-feedback-notice"
          className="rounded-lg border bg-sage/40 px-4 py-3 text-sm"
        >
          Feedback saved.
        </p>
      ) : (
        <ActionNotice notice={notice} />
      )}

      <form action={buildTourFromForm} className="space-y-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="grid gap-5 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCardFrame
              key={listing.id}
              testId={`tour-candidate-${listing.id}`}
              addressLine={listing.address.line1}
              cityState={`${listing.address.city}, ${listing.address.state} · sample data`}
              sample
            >
              <p className="text-sm">{listing.brief}</p>
              <AddToTourToggle
                className="-ml-3"
                name="propertyIds"
                value={listing.id}
                defaultChecked={selectedIds.has(listing.id)}
                data-testid={`select-${listing.id}`}
              />
            </ListingCardFrame>
          ))}
        </div>
        <TourBuildAction hint="Tick the homes you want to see, then build. Stops are ordered by drive time.">
          <Button
            type="submit"
            variant="next"
            data-testid="build-my-tour"
            className={tourBuildButtonClassName}
          >
            Build My Tour
          </Button>
        </TourBuildAction>
      </form>

      {tour ? <TourItineraryPanel tour={tour} /> : <NoTourYet />}
    </section>
  );
}

const RATING_KEYS = [
  "kitchen",
  "location",
  "yard",
  "condition",
  "layout",
  "value",
] as const;

function TourItineraryPanel({ tour }: { tour: FixtureTour }) {
  const listings = seedTourListings();
  const mappedStops = tour.stops.flatMap((stop) => {
    const listing = listings.find((row) => row.id === stop.propertyId);
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
  });

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

      <TourMapDisclosure stopCount={tour.stops.length}>
        <TourMap
          origin={{
            lat: tour.originCoordinates.lat,
            lng: tour.originCoordinates.lng,
            label: tour.originLabel,
          }}
          stops={mappedStops}
        />
      </TourMapDisclosure>

      <TourTimeline>
        <TourTimelineOrigin
          label={tour.originLabel}
          departAt={formatTourInstant(tour.originDepartAt)}
        />
        {tour.stops.map((stop) => {
          const listing = listings.find((row) => row.id === stop.propertyId);
          const feedback = tour.feedback.find(
            (row) => row.stopId === stop.stopId,
          );
          return (
            <TourTimelineStop
              key={stop.stopId}
              order={stop.order}
              driveMinutes={stop.driveMinutes}
              data-testid={`tour-stop-${stop.order}`}
              data-property-id={stop.propertyId}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {listing ? listing.address.line1 : `Stop ${stop.order}`}
                  </CardTitle>
                  <CardDescription>
                    Arrive {formatTourInstant(stop.arriveAt)} · depart{" "}
                    {formatTourInstant(stop.departAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
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
                  </div>
                  <form action={removeStopFromForm}>
                    <input type="hidden" name="tourId" value={tour.tourId} />
                    <input type="hidden" name="stopId" value={stop.stopId} />
                    <Button
                      type="submit"
                      variant="outline"
                      data-testid={`remove-stop-${stop.order}`}
                      className="min-h-11 px-4"
                    >
                      Remove stop
                    </Button>
                  </form>
                  <form
                    action={submitFeedbackFromForm}
                    className="space-y-3 border-t border-border/70 pt-4"
                  >
                    <input type="hidden" name="tourId" value={tour.tourId} />
                    <input type="hidden" name="stopId" value={stop.stopId} />
                    <VerdictPicker defaultValue={feedback?.verdict ?? "maybe"} />
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
                      {RATING_KEYS.map((key) => (
                        <label
                          key={key}
                          className="flex min-h-11 items-center justify-between gap-2 capitalize"
                        >
                          {key}
                          <input
                            type="number"
                            name={key}
                            min={1}
                            max={5}
                            defaultValue={feedback?.ratings[key] ?? 3}
                            className="h-11 w-14 rounded-md border bg-background px-2 text-center text-sm"
                          />
                        </label>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      className="min-h-11 w-full px-4 sm:w-auto"
                    >
                      Save feedback
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TourTimelineStop>
          );
        })}
      </TourTimeline>
    </div>
  );
}
