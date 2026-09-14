import {
  BUYER_COACH_HOME,
  BUYER_LOCKED_UPSELLS,
} from "@/lib/buyer-shell";
import { buyerHubPath, fixtureBuyerIsClosed } from "@/lib/homeownership-access";
import type { Role } from "@/lib/domain";
import type { TestSession } from "@/lib/test-session";

export type AppNavRole = Role | "guest";

export type AppNavLink = {
  href: string;
  label: string;
  locked?: boolean;
};

export type AppNavContext = {
  role: AppNavRole;
  buyerClosed: boolean;
  hubHref?: string;
  name?: string;
};

export function navLinksFor(input: {
  role: AppNavRole;
  buyerClosed?: boolean;
  hubHref?: string;
}): AppNavLink[] {
  switch (input.role) {
    case "guest":
      return [];
    case "buyer": {
      const links: AppNavLink[] = [
        { href: BUYER_COACH_HOME, label: "Coach" },
        ...BUYER_LOCKED_UPSELLS.map((upsell) => ({
          href: upsell.href,
          label: upsell.label,
          locked: true as const,
        })),
      ];
      if (input.buyerClosed === true && input.hubHref) {
        links.push({ href: input.hubHref, label: "Hub" });
      }
      return links;
    }
    case "agent":
    case "broker":
    case "admin":
      return [
        { href: "/agent", label: "Command center" },
        { href: "/search", label: "Search" },
        { href: "/tours", label: "Tours" },
        { href: "/vault", label: "Vault" },
      ];
    case "vendor":
      return [
        { href: "/vendor", label: "Vendor portal" },
        { href: "/vault", label: "Vault" },
      ];
    default: {
      const _exhaustive: never = input.role;
      return _exhaustive;
    }
  }
}

export function wordmarkHrefFor(role: AppNavRole): string {
  switch (role) {
    case "buyer":
      return BUYER_COACH_HOME;
    case "agent":
    case "broker":
    case "admin":
      return "/agent";
    case "vendor":
      return "/vendor";
    case "guest":
      return "/";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function navContextFromFixtureSession(
  session: TestSession | null,
): AppNavContext {
  if (session === null) {
    return { role: "guest", buyerClosed: false };
  }
  if (session.role === "buyer") {
    const buyerClosed = fixtureBuyerIsClosed(session);
    return {
      role: "buyer",
      buyerClosed,
      hubHref: buyerClosed ? (buyerHubPath(session) ?? undefined) : undefined,
      name: session.name,
    };
  }
  return {
    role: session.role,
    buyerClosed: false,
    name: session.name,
  };
}
