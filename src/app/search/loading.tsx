import { ShellSkeleton, SearchSkeleton } from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Loading search">
      <SearchSkeleton />
    </ShellSkeleton>
  );
}
