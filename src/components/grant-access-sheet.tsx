"use client";

import { useState, useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MD_UP, useMediaQuery } from "@/components/use-media-query";
import { cn } from "@/lib/utils";

export type GrantParty = { id: string; name: string; roleLabel: string };
export type GrantScope = "view" | "download";
export type GrantChoice = {
  partyId: string;
  scope: GrantScope;
  expiresAt: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/*
  The only scope and window the server grants today. The sheet shows the
  alternatives greyed out so the buyer sees what "view for 7 days" means, but
  it cannot ask the server for anything else.
*/
const SCOPE_OPTIONS: ReadonlyArray<{
  value: GrantScope;
  label: string;
  description: string;
  disabled: boolean;
}> = [
  {
    value: "view",
    label: "View",
    description:
      "Can open and read this document inside HomeBase. Nothing leaves the vault.",
    disabled: false,
  },
  {
    value: "download",
    label: "Download",
    description: "Not offered in this build.",
    disabled: true,
  },
];

const DEFAULT_EXPIRY_DAYS = 7;

const EXPIRY_OPTIONS: ReadonlyArray<{ days: number; label: string }> = [
  { days: DEFAULT_EXPIRY_DAYS, label: "7 days" },
];

const STEPS = [
  { key: "who", eyebrow: "Step 1 of 3", title: "Who gets access?" },
  { key: "scope", eyebrow: "Step 2 of 3", title: "What can they do?" },
  { key: "expiry", eyebrow: "Step 3 of 3", title: "For how long?" },
  { key: "review", eyebrow: "Review", title: "Confirm this grant" },
] as const;

const grantDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatGrantDate(at: number) {
  return grantDateFormat.format(at);
}

function OptionRow({
  value,
  label,
  description,
  disabled,
}: {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors has-data-checked:border-foreground/60 has-data-checked:bg-muted/50",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-muted/40",
      )}
    >
      <RadioGroupItem value={value} disabled={disabled} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function StepDots({ step, eyebrow }: { step: number; eyebrow: string }) {
  return (
    <ol aria-label={eyebrow} className="flex items-center gap-1.5">
      {STEPS.map((entry, index) => (
        <li
          key={entry.key}
          aria-current={index === step ? "step" : undefined}
          className={cn(
            "h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none",
            index === step ? "w-6 bg-foreground" : "w-3 bg-border",
            index < step ? "bg-foreground/50" : "",
          )}
        />
      ))}
    </ol>
  );
}

function ReviewRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{term}</dt>
      <dd className="min-w-0 text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

/**
 * Party → scope → expiry → confirm. A bottom drawer below `md` (swipe, Escape,
 * or backdrop to dismiss) and a right-hand sheet at `md` and up. `onConfirm`
 * is the only thing that talks to a server; the sheet just collects the
 * choice and reports success or failure.
 */
export function GrantAccessSheet({
  documentTitle,
  parties,
  onConfirm,
  triggerLabel,
}: {
  documentTitle: string;
  parties: GrantParty[];
  onConfirm: (choice: GrantChoice) => Promise<void>;
  /** Defaults to "Grant to {name}" for a single party, "Grant access" otherwise. */
  triggerLabel?: string;
}) {
  const mdUp = useMediaQuery(MD_UP);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const [scope, setScope] = useState<GrantScope>("view");
  const [days, setDays] = useState(DEFAULT_EXPIRY_DAYS);
  // Captured when the sheet opens so the expiry preview is stable across renders.
  const [openedAt, setOpenedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const firstParty = parties[0];
  if (firstParty === undefined) {
    return null;
  }

  const party = parties.find((row) => row.id === partyId) ?? firstParty;
  const label =
    triggerLabel ??
    (parties.length === 1 ? `Grant to ${firstParty.name}` : "Grant access");
  const current = STEPS[step] ?? STEPS[0];
  const isReview = step === STEPS.length - 1;

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setStep(0);
      setError(null);
      setOpenedAt(Date.now());
    }
    setOpen(next);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm({
          partyId: party.id,
          scope,
          expiresAt: Date.now() + days * DAY_MS,
        });
        setOpen(false);
      } catch {
        setError("Access was not granted. Try again, or ask your agent.");
      }
    });
  }

  const body = (
    <div className="space-y-3">
      {current.key === "who" ? (
        <RadioGroup
          aria-label="Who gets access"
          value={partyId}
          onValueChange={(value) => setPartyId(String(value))}
        >
          {parties.map((row) => (
            <OptionRow
              key={row.id}
              value={row.id}
              label={row.name}
              description={row.roleLabel}
            />
          ))}
        </RadioGroup>
      ) : null}

      {current.key === "scope" ? (
        <RadioGroup
          aria-label="Scope"
          value={scope}
          onValueChange={(value) => setScope(value as GrantScope)}
        >
          {SCOPE_OPTIONS.map((option) => (
            <OptionRow key={option.value} {...option} />
          ))}
        </RadioGroup>
      ) : null}

      {current.key === "expiry" ? (
        <RadioGroup
          aria-label="Expiry"
          value={String(days)}
          onValueChange={(value) => setDays(Number(value))}
        >
          {EXPIRY_OPTIONS.map((option) => (
            <OptionRow
              key={option.days}
              value={String(option.days)}
              label={option.label}
              description={`Access ends automatically on ${formatGrantDate(
                openedAt + option.days * DAY_MS,
              )}.`}
            />
          ))}
        </RadioGroup>
      ) : null}

      {current.key === "review" ? (
        <>
          <dl className="divide-y divide-border rounded-xl border border-border bg-card">
            <ReviewRow term="Document">{documentTitle}</ReviewRow>
            <ReviewRow term="Who">
              {party.name}
              <span className="block text-xs font-normal text-muted-foreground">
                {party.roleLabel}
              </span>
            </ReviewRow>
            <ReviewRow term="Scope">
              {SCOPE_OPTIONS.find((option) => option.value === scope)?.label}
            </ReviewRow>
            <ReviewRow term="Until">
              {formatGrantDate(openedAt + days * DAY_MS)}
              <span className="block text-xs font-normal text-muted-foreground">
                {days} days
              </span>
            </ReviewRow>
          </dl>
          <p className="text-xs leading-5 text-muted-foreground">
            Access is decided in a server function on every open. You can
            revoke at any time, and every view is logged.
          </p>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );

  const footer = isReview ? (
    <>
      <Button
        type="button"
        size="lg"
        className="h-12 w-full text-base"
        onClick={confirm}
        disabled={pending}
        data-testid="grant-confirm"
      >
        {pending ? "Granting…" : "Confirm grant"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full"
        onClick={() => setStep(step - 1)}
        disabled={pending}
      >
        Back
      </Button>
    </>
  ) : (
    <div className="flex gap-2">
      {step === 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="h-12 px-4"
          onClick={() => handleOpenChange(false)}
        >
          Cancel
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="h-12 px-4"
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>
      )}
      <Button
        type="button"
        size="lg"
        className="h-12 flex-1 text-base"
        onClick={() => setStep(step + 1)}
      >
        Continue
      </Button>
    </div>
  );

  const heading = (
    <>
      <StepDots step={step} eyebrow={current.eyebrow} />
      <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {current.eyebrow}
      </p>
    </>
  );

  if (mdUp) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger render={<Button variant="outline" />}>{label}</SheetTrigger>
        <SheetContent
          side="right"
          className="w-full gap-0 sm:max-w-md"
          data-testid="grant-sheet"
        >
          <SheetHeader className="pr-12">
            {heading}
            <SheetTitle className="text-lg">{current.title}</SheetTitle>
            <SheetDescription>{documentTitle}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{body}</div>
          <SheetFooter>{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>{label}</DrawerTrigger>
      <DrawerContent data-testid="grant-sheet">
        <DrawerHeader>
          <div className="w-full text-left">
            {heading}
            <DrawerTitle className="text-lg">{current.title}</DrawerTitle>
            <DrawerDescription>{documentTitle}</DrawerDescription>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{body}</div>
        <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {footer}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
