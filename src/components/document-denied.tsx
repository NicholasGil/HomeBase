import { AccessDeniedCard } from "@/components/access-denied-card";

export function DocumentDenied() {
  return (
    <AccessDeniedCard
      testId="document-denied"
      title="You cannot open this document."
      action={{ href: "/vault", label: "Back to vault" }}
    />
  );
}
