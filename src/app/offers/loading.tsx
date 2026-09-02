import { ShellSkeleton, OffersSkeleton } from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Loading offers">
      <OffersSkeleton />
    </ShellSkeleton>
  );
}
