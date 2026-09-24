import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ASK_MY_AGENT_HREF } from "@/components/concierge-answer";
import { textLinkClassName } from "@/components/text-link";
import { cn } from "@/lib/utils";
import { MessageCircleOff } from "lucide-react";

export const CONCIERGE_UNAVAILABLE_TITLE =
  "AI coach unavailable — model key not configured";

export function ConciergeUnavailableState({
  className,
  showAgentLink = true,
}: {
  className?: string;
  /** Hide when no agent thread is relevant (e.g. discovery-empty). */
  showAgentLink?: boolean;
}) {
  return (
    <EmptyState
      testId="concierge-unavailable"
      icon={MessageCircleOff}
      title={CONCIERGE_UNAVAILABLE_TITLE}
      description={
        <>
          I cannot answer coaching questions until a model key is configured on
          this deployment. You can still read your journey and review documents
          on this file.
          {showAgentLink ? (
            <>
              {" "}
              <Link href={ASK_MY_AGENT_HREF} className={textLinkClassName}>
                Contact your agent
              </Link>{" "}
              if one is on file, or try again later.
            </>
          ) : (
            <> Try again later once coaching is enabled.</>
          )}
        </>
      }
      className={cn(
        "border-solid bg-muted/30 text-left text-balance max-md:gap-2 max-md:py-4",
        className,
      )}
    />
  );
}
