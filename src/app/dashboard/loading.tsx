import { ShellSkeleton, DashboardSkeleton } from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Loading your file">
      <DashboardSkeleton />
    </ShellSkeleton>
  );
}
