"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

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

  if (candidates === undefined || tours === undefined) {
    return <p className="text-sm text-muted-foreground">Loading tours…</p>;
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className={tripHeadingClassName}>
            Showing scheduler
          </h2>
          <p className="text-sm text-muted-foreground">
            Select properties, then Build My Tour.
          </p>
        </div>
        <Badge variant="outline">sample listings</Badge>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {candidates.map((listing) => (
          <ListingCardFrame
            key={listing._id}
            testId={`tour-candidate-${listing._id}`}
            addressLine={listing.address.line1}
            cityState={`${listing.address.city}, ${listing.address.state}`}
          >
            <p className="text-sm">{listing.brief}</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(listing._id)}
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelected([...selected, listing._id]);
                  } else {
                    setSelected(selected.filter((id) => id !== listing._id));
                  }
                }}
              />
              Add to tour
            </label>
          </ListingCardFrame>
        ))}
      </div>
      <Button
        type="button"
        variant="next"
        data-testid="build-my-tour"
        disabled={busy || selected.length === 0}
        onClick={() => {
          void onBuild();
        }}
      >
        Build My Tour
      </Button>

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
          <ol className="space-y-4">
            {tour.stops.map((stop) => (
              <li key={stop.stopId} data-testid={`tour-stop-${stop.order}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Stop {stop.order} · {stop.property.address.line1}
                    </CardTitle>
                    <CardDescription>
                      Arrive {formatTourInstant(stop.arriveAt)} · depart{" "}
                      {formatTourInstant(stop.departAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{stop.property.brief}</p>
                    <p className="text-sm text-muted-foreground">
                      {stop.directionsSummary}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid={`remove-stop-${stop.order}`}
                      onClick={() => {
                        void removeStop({
                          tourId: tour.tourId,
                          stopId: stop.stopId,
                        });
                      }}
                    >
                      Remove stop
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        void submitFeedback({
                          tourStopId: stop.stopId,
                          verdict: "maybe",
                          ratings: {
                            kitchen: 3,
                            location: 3,
                            yard: 3,
                            condition: 3,
                            layout: 3,
                            value: 3,
                          },
                        });
                      }}
                    >
                      Save feedback
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
