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
}: {
  viewerName?: string;
}) {
  const router = useRouter();
  const createBrokerage = useMutation(api.brokerageOnboarding.createBrokerage);
  const joinWithInviteCode = useMutation(
    api.brokerageOnboarding.joinWithInviteCode,
  );
  const [mode, setMode] = useState<"create" | "join">("create");
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
      const result = await joinWithInviteCode({
        inviteCode,
        role: "agent",
      });
      router.replace(homeForRole(result.role === "broker" ? "broker" : "agent"));
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

export function FixtureBrokerageOnboarding({
  viewerName,
  joinError,
}: {
  viewerName?: string;
  joinError?: boolean;
}) {
  const [mode, setMode] = useState<"create" | "join">("create");

  return (
    <BrokerageOnboardingLayout
      viewerName={viewerName}
      mode={mode}
      onModeChange={setMode}
      error={joinError ? "Invite code not recognized in this fixture." : null}
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
            className="w-full"
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
            <p className="text-xs text-muted-foreground">
              Fixture demo: use LOOKOUT1 to join the seeded Lookout org, or
              create a fresh brokerage for an empty book.
            </p>
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
  children,
}: {
  viewerName?: string;
  mode: "create" | "join";
  onModeChange: (mode: "create" | "join") => void;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md space-y-6" data-testid="brokerage-onboarding">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {viewerName ? `Welcome, ${viewerName}` : "Brokerage onboarding"}
        </p>
        <h1 className="text-h1 font-semibold tracking-tight">
          Set up your RealtyRise workspace
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Create a brokerage or join with an invite code. No MLS or paid map keys
          are required for this preview.
        </p>
      </header>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "create" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onModeChange("create")}
          data-testid="brokerage-mode-create"
        >
          Create
        </Button>
        <Button
          type="button"
          variant={mode === "join" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onModeChange("join")}
          data-testid="brokerage-mode-join"
        >
          Join
        </Button>
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
