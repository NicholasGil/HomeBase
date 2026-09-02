import { ShellSkeleton, ToursSkeleton } from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Loading tours">
      <ToursSkeleton />
    </ShellSkeleton>
  );
}
