"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { submitFixtureBrokerageOnboarding } from "@/app/brokerage/onboarding/actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

const fieldClassName =
  "flex min-h-11 w-full rounded-md border bg-background px-3 py-2.5 text-sm";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

function homeForRole(role: "agent" | "broker") {
  return role === "broker" ? "/broker" : "/agent";
}

export function LiveBrokerageOnboarding({
  viewerName,
  initialTab = "create",
}: {
  viewerName?: string;
  initialTab?: "create" | "join";
}) {
  const router = useRouter();
  const createBrokerage = useMutation(api.brokerageOnboarding.createBrokerage);
  const joinWithInviteCode = useMutation(
    api.brokerageOnboarding.joinWithInviteCode,
  );
  const [mode, setMode] = useState<"create" | "join">(initialTab);
  const [name, setName] = useState("");
  const [state, setState] = useState("AL");
  const [role, setRole] = useState<"agent" | "broker">("agent");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await createBrokerage({ name, state, role });
      router.replace(homeForRole(result.role));
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not create brokerage";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  async function onJoin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await joinWithInviteCode({ inviteCode });
      router.replace("/agent");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Invite code not recognized";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <BrokerageOnboardingLayout
      viewerName={viewerName}
      mode={mode}
      onModeChange={setMode}
      error={error}
    >
      {mode === "create" ? (
        <form className="space-y-4" onSubmit={onCreate}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brokerage-name">
              Brokerage name
            </label>
            <input
              id="brokerage-name"
              name="name"
              className={fieldClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Summit Realty Group"
              required
              minLength={2}
              data-testid="brokerage-name-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brokerage-state">
              Primary state
            </label>
            <select
              id="brokerage-state"
              name="state"
              className={fieldClassName}
              value={state}
              onChange={(event) => setState(event.target.value)}
              data-testid="brokerage-state-select"
            >
              {US_STATES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brokerage-role">
              Your role
            </label>
            <select
              id="brokerage-role"
              name="role"
              className={fieldClassName}
              value={role}
              onChange={(event) =>
                setRole(event.target.value === "broker" ? "broker" : "agent")
              }
              data-testid="brokerage-role-select"
            >
              <option value="agent">Agent</option>
              <option value="broker">Broker / owner</option>
            </select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            data-testid="brokerage-create-submit"
          >
            {pending ? "Creating…" : "Create brokerage"}
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={onJoin}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="invite-code">
              Invite code
            </label>
            <input
              id="invite-code"
              name="inviteCode"
              className={fieldClassName}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="LOOKOUT1"
              required
              data-testid="brokerage-invite-input"
            />
            <p className="text-xs text-muted-foreground">
              Ask your broker for the org code. MLS and map coverage are not
              required for this preview.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            data-testid="brokerage-join-submit"
          >
            {pending ? "Joining…" : "Join brokerage"}
          </Button>
        </form>
      )}
    </BrokerageOnboardingLayout>
  );
}

function PersonaAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-semibold text-sage-foreground"
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function FixtureBrokerageOnboarding({
  viewerName,
  joinError,
  joinErrorMessage = "Invite code not recognized in this fixture.",
  initialTab = "create",
  demoMode = false,
}: {
  viewerName?: string;
  joinError?: boolean;
  joinErrorMessage?: string;
  initialTab?: "create" | "join";
  demoMode?: boolean;
}) {
  const [mode, setMode] = useState<"create" | "join">(initialTab);

  return (
    <BrokerageOnboardingLayout
      viewerName={viewerName}
      mode={mode}
      onModeChange={setMode}
      error={joinError ? joinErrorMessage : null}
      demoMode={demoMode}
    >
      {mode === "create" ? (
        <form action={submitFixtureBrokerageOnboarding} className="space-y-4">
          <input type="hidden" name="intent" value="create" />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brokerage-name">
              Brokerage name
            </label>
            <input
              id="brokerage-name"
              name="name"
              className={fieldClassName}
              placeholder="Summit Realty Group"
              defaultValue={demoMode ? "Summit Realty Group" : undefined}
              required
              minLength={2}
              data-testid="brokerage-name-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brokerage-state">
              Primary state
            </label>
            <select
              id="brokerage-state"
              name="state"
              className={fieldClassName}
              defaultValue="AL"
              data-testid="brokerage-state-select"
            >
              {US_STATES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brokerage-role">
              Your role
            </label>
            <select
              id="brokerage-role"
              name="role"
              className={fieldClassName}
              defaultValue="agent"
              data-testid="brokerage-role-select"
            >
              <option value="agent">Agent</option>
              <option value="broker">Broker / owner</option>
            </select>
          </div>
          <Button
            type="submit"
            variant="default"
            className="w-full min-h-11"
            data-testid="brokerage-create-submit"
          >
            Create brokerage
          </Button>
        </form>
      ) : (
        <form action={submitFixtureBrokerageOnboarding} className="space-y-4">
          <input type="hidden" name="intent" value="join" />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="invite-code">
              Invite code
            </label>
            <input
              id="invite-code"
              name="inviteCode"
              className={fieldClassName}
              placeholder="LOOKOUT1"
              required
              data-testid="brokerage-invite-input"
            />
            {!demoMode ? (
              <p className="text-xs text-muted-foreground">
                Fixture demo: use LOOKOUT1 to join the seeded Lookout org, or
                create a fresh brokerage for an empty book.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sample invite code for Lookout Realty: LOOKOUT1.
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            data-testid="brokerage-join-submit"
          >
            Join brokerage
          </Button>
        </form>
      )}
    </BrokerageOnboardingLayout>
  );
}

function BrokerageOnboardingLayout({
  viewerName,
  mode,
  onModeChange,
  error,
  demoMode = false,
  children,
}: {
  viewerName?: string;
  mode: "create" | "join";
  onModeChange: (mode: "create" | "join") => void;
  error: string | null;
  demoMode?: boolean;
  children: ReactNode;
}) {
  const tabClass = (selected: boolean) =>
    cn(
      "min-h-11 flex-1 rounded-full text-sm font-medium transition-colors",
      demoMode
        ? selected
          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
          : "bg-transparent text-muted-foreground hover:text-foreground"
        : buttonVariants({
            variant: selected ? "default" : "outline",
          }),
    );

  return (
    <div className="mx-auto max-w-md space-y-6" data-testid="brokerage-onboarding">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          {viewerName ? <PersonaAvatar name={viewerName} /> : null}
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {viewerName ? `Welcome, ${viewerName}` : "Brokerage onboarding"}
            </p>
            <h1 className="text-h1 font-semibold tracking-tight">
              Set up your RealtyRise workspace
            </h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {demoMode
            ? "Create a sample brokerage or join with an invite code. Everything here uses demo data only."
            : "Create a brokerage or join with an invite code. No MLS or paid map keys are required for this preview."}
        </p>
      </header>

      <div
        className={cn(
          "flex gap-1 rounded-full p-1",
          demoMode ? "bg-muted/60" : "gap-2",
        )}
        role="tablist"
        aria-label="Onboarding mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "create"}
          className={tabClass(mode === "create")}
          onClick={() => onModeChange("create")}
          data-testid="brokerage-mode-create"
        >
          Create
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "join"}
          className={tabClass(mode === "join")}
          onClick={() => onModeChange("join")}
          data-testid="brokerage-mode-join"
        >
          Join
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "New brokerage" : "Join with code"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Name and home state are enough to open your command center."
              : "Enter the code your broker shared."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
