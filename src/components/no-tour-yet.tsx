import { Route } from "lucide-react";

import { EmptyState } from "@/components/empty-state";

export function NoTourYet() {
  return (
    <EmptyState
      icon={Route}
      title="No tour built yet."
      description="Tick the homes you want to see, then Build My Tour. The itinerary lands here with departure times."
      action={{ href: "/search", label: "Find more homes" }}
    />
  );
}
