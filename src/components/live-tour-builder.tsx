"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { AddToTourToggle } from "@/components/add-to-tour-toggle";
import { ListingCardFrame } from "@/components/listing-card";
import { seedPropertyPhoto } from "@/components/property-photo";
import { ToursSectionSkeleton } from "@/components/route-skeletons";
import { NoTourYet } from "@/components/no-tour-yet";
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
import { isVerdict, VerdictPicker } from "@/components/verdict-picker";
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
import { tripHeadingClassName } from "@/lib/trip-ui";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function LiveTourBuilder() {
  const candidates = useQuery(api.tours.listCandidates, {});
  const tours = useQuery(api.tours.listMine, {});
  const build = useMutation(api.tours.build);
  const removeStop = useMutation(api.tours.removeStop);
  const submitFeedback = useMutation(api.tours.submitFeedback);
  const [selected, setSelected] = useState<Id<"properties">[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(false);

  if (candidates === undefined || tours === undefined) {
    return <ToursSectionSkeleton />;
  }

  const tour = tours[0];

  async function onBuild() {
    setBusy(true);
    await build({
      propertyIds: selected,
    });
    setBusy(false);
  }

  return (
    <section className="space-y-6" data-testid="tour-builder">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={tripHeadingClassName}>
            Showing scheduler
          </h2>
          <p className="text-sm text-muted-foreground">
            Select properties, then Build My Tour.
          </p>
        </div>
        <Badge variant="quiet">sample listings</Badge>
      </div>

      {feedbackNotice ? (
        <p
          data-testid="tour-feedback-notice"
          className="rounded-lg border bg-sage/40 px-4 py-3 text-sm"
        >
          Feedback saved.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {candidates.map((listing) => (
          <ListingCardFrame
            key={listing._id}
            testId={`tour-candidate-${listing._id}`}
            addressLine={listing.address.line1}
            cityState={`${listing.address.city}, ${listing.address.state}`}
            sample
            photo={seedPropertyPhoto(listing.address.line1)}
          >
            <p className="text-sm">{listing.brief}</p>
            <AddToTourToggle
              className="-ml-3"
              checked={selected.includes(listing._id)}
              data-testid={`select-${listing._id}`}
              onChange={(event) => {
                if (event.target.checked) {
                  setSelected([...selected, listing._id]);
                } else {
                  setSelected(selected.filter((id) => id !== listing._id));
                }
              }}
            />
          </ListingCardFrame>
        ))}
      </div>
      <TourBuildAction
        hint={
          selected.length === 0
            ? "Tick the homes you want to see, then build."
            : `${selected.length} selected. Stops are ordered by drive time.`
        }
      >
        <Button
          type="button"
          variant="next"
          data-testid="build-my-tour"
          disabled={busy || selected.length === 0}
          className={tourBuildButtonClassName}
          onClick={() => {
            void onBuild();
          }}
        >
          Build My Tour
        </Button>
      </TourBuildAction>

      {tour ? (
        <div className="space-y-4" data-testid="tour-itinerary">
          <p className="text-sm text-muted-foreground">
            Leave {tour.originLabel} at {formatTourInstant(tour.originDepartAt)}.
          </p>
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
              stops={tour.stops.flatMap((stop) => {
                if (stop.property.coordinates === null) {
                  return [];
                }
                return [
                  {
                    lat: stop.property.coordinates.lat,
                    lng: stop.property.coordinates.lng,
                    label: propertyLine(stop.property.address),
                    order: stop.order,
                  },
                ];
              })}
            />
          </TourMapDisclosure>
          <TourTimeline>
            <TourTimelineOrigin
              label={tour.originLabel}
              departAt={formatTourInstant(tour.originDepartAt)}
            />
            {tour.stops.map((stop) => (
              <TourTimelineStop
                key={stop.stopId}
                order={stop.order}
                driveMinutes={stop.driveMinutes}
                data-testid={`tour-stop-${stop.order}`}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{stop.property.address.line1}</CardTitle>
                    <CardDescription>
                      Arrive {formatTourInstant(stop.arriveAt)} · depart{" "}
                      {formatTourInstant(stop.departAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm">{stop.property.brief}</p>
                      <p className="text-sm text-muted-foreground">
                        {stop.directionsSummary}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid={`remove-stop-${stop.order}`}
                      className="min-h-11 px-4"
                      onClick={() => {
                        void removeStop({
                          tourId: tour.tourId,
                          stopId: stop.stopId,
                        });
                      }}
                    >
                      Remove stop
                    </Button>
                    <form
                      className="space-y-3 border-t border-border/70 pt-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const verdict = new FormData(event.currentTarget).get(
                          "verdict",
                        );
                        if (!isVerdict(verdict)) {
                          return;
                        }
                        void submitFeedback({
                          tourStopId: stop.stopId,
                          verdict,
                          ratings: {
                            kitchen: 3,
                            location: 3,
                            yard: 3,
                            condition: 3,
                            layout: 3,
                            value: 3,
                          },
                        }).then(() => {
                          setFeedbackNotice(true);
                        });
                      }}
                    >
                      <VerdictPicker />
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
            ))}
          </TourTimeline>
        </div>
      ) : (
        <NoTourYet />
      )}
    </section>
  );
}
