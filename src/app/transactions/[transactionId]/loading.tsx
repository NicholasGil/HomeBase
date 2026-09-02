import {
  ShellSkeleton,
  TransactionSkeleton,
} from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Loading this transaction">
      <TransactionSkeleton />
    </ShellSkeleton>
  );
}
