import { DocumentSkeleton, ShellSkeleton } from "@/components/route-skeletons";

export default function Loading() {
  return (
    <ShellSkeleton label="Opening this document">
      <DocumentSkeleton />
    </ShellSkeleton>
  );
}
