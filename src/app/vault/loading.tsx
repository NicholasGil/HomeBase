import { ShellSkeleton, VaultSkeleton } from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Loading the vault">
      <VaultSkeleton />
    </ShellSkeleton>
  );
}
