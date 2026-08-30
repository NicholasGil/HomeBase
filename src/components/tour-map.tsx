import { propertyLine } from "@/lib/tour-format";

type MappedPoint = {
  lat: number;
  lng: number;
  label: string;
  kind: "origin" | "stop";
  order?: number;
};

export function TourMap({
  origin,
  stops,
}: {
  origin: { lat: number; lng: number; label: string };
  stops: Array<{
    lat: number;
    lng: number;
    label: string;
    order: number;
  }>;
}) {
  if (stops.length === 0) {
    return (
      <div
        data-testid="tour-map"
        className="rounded-xl border bg-sand px-4 py-6 text-sm text-muted-foreground"
      >
        Map unavailable. Stop coordinates are missing on this fixture tour.
      </div>
    );
  }

  const points: MappedPoint[] = [
    { ...origin, kind: "origin" },
    ...stops.map((stop) => ({
      lat: stop.lat,
      lng: stop.lng,
      label: stop.label,
      kind: "stop" as const,
      order: stop.order,
    })),
  ];
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.08;
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  function xy(point: { lat: number; lng: number }) {
    const x = ((point.lng - minLng) / lngSpan) * (100 - pad * 200) + pad * 100;
    const y =
      (1 - (point.lat - minLat) / latSpan) * (100 - pad * 200) + pad * 100;
    return { x, y };
  }

  return (
    <div data-testid="tour-map" className="rounded-xl border bg-sand p-3">
      <p className="px-1 pb-2 text-xs text-muted-foreground">
        Schematic pins. Not a live street map.
      </p>
      <svg viewBox="0 0 100 72" className="h-56 w-full" role="img">
        <title>Tour map</title>
        <rect width="100" height="72" fill="#efe4d0" />
        {points.slice(1).map((point, index) => {
          const from = xy(points[index] ?? origin);
          const to = xy(point);
          return (
            <line
              key={`${point.label}-line`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#57534e"
              strokeWidth="0.8"
            />
          );
        })}
        {points.map((point) => {
          const { x, y } = xy(point);
          return (
            <g key={point.label}>
              <circle
                cx={x}
                cy={y}
                r={point.kind === "origin" ? 3.2 : 2.8}
                fill={point.kind === "origin" ? "#1c1917" : "#c2410c"}
              />
              <text
                x={x + 3.2}
                y={y - 2}
                fill="#1c1917"
                fontSize="3.4"
              >
                {point.kind === "origin" ? "Start" : point.order}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li>{origin.label}</li>
        {stops.map((stop) => (
          <li key={stop.label}>
            {stop.order}. {stop.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function mappedStopLabel(address: {
  line1: string;
  city: string;
  state: string;
}) {
  return propertyLine(address);
}
