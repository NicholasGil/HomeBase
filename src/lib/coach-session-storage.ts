/** Client-side coach visit + thread persistence (fixture and live buyer paths). */

export type CoachConciergeTurn = {
  question: string;
  answer: string;
  kind: string | null;
};

export type CoachVisitRecord = {
  firstSeenAt: number;
  lastSeenAt: number;
  /** UTC date key YYYY-MM-DD for daily check-in dismissal */
  dailyCheckInDay: string | null;
};

const STORAGE_PREFIX = "realtyrise:coach:v1";

export function coachScopeStorageKey(input: {
  identity: string;
  scopeKey: string;
}): string {
  return `${STORAGE_PREFIX}:${input.identity}:${input.scopeKey}`;
}

export function utcDayKey(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}

export function readCoachVisit(
  storageKey: string,
  storage: Storage,
): CoachVisitRecord | null {
  try {
    const raw = storage.getItem(`${storageKey}:visit`);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as CoachVisitRecord;
    if (
      typeof parsed.firstSeenAt !== "number" ||
      typeof parsed.lastSeenAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCoachVisit(
  storageKey: string,
  storage: Storage,
  record: CoachVisitRecord,
): void {
  storage.setItem(`${storageKey}:visit`, JSON.stringify(record));
}

export function coachPageLoadId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }
  const scoped = window as Window & { __realtyriseCoachPageId?: string };
  if (scoped.__realtyriseCoachPageId === undefined) {
    scoped.__realtyriseCoachPageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return scoped.__realtyriseCoachPageId;
}

export function touchCoachVisit(
  storageKey: string,
  storage: Storage,
  at = Date.now(),
): { isReturnVisit: boolean; record: CoachVisitRecord } {
  const existing = readCoachVisit(storageKey, storage);
  if (existing === null) {
    const record: CoachVisitRecord = {
      firstSeenAt: at,
      lastSeenAt: at,
      dailyCheckInDay: null,
    };
    writeCoachVisit(storageKey, storage, record);
    return { isReturnVisit: false, record };
  }
  const record: CoachVisitRecord = {
    ...existing,
    lastSeenAt: at,
  };
  writeCoachVisit(storageKey, storage, record);
  return { isReturnVisit: true, record };
}

export function markDailyCheckInComplete(
  storageKey: string,
  storage: Storage,
  day = utcDayKey(),
): void {
  const existing = readCoachVisit(storageKey, storage);
  if (existing === null) {
    return;
  }
  writeCoachVisit(storageKey, storage, {
    ...existing,
    dailyCheckInDay: day,
  });
}

export function shouldShowDailyCheckIn(
  record: CoachVisitRecord | null,
  day = utcDayKey(),
): boolean {
  if (record === null) {
    return false;
  }
  return record.dailyCheckInDay !== day;
}

export function readCoachThread(
  storageKey: string,
  storage: Storage,
): CoachConciergeTurn[] {
  try {
    const raw = storage.getItem(`${storageKey}:thread`);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw) as CoachConciergeTurn[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (turn) =>
        typeof turn.question === "string" &&
        typeof turn.answer === "string" &&
        (turn.kind === null || typeof turn.kind === "string"),
    );
  } catch {
    return [];
  }
}

export function writeCoachThread(
  storageKey: string,
  storage: Storage,
  turns: CoachConciergeTurn[],
): void {
  storage.setItem(`${storageKey}:thread`, JSON.stringify(turns));
}

export function coachScopeKeyFromParts(input: {
  discoveryEmpty: boolean;
  transactionId?: string | null;
}): string {
  if (input.discoveryEmpty) {
    return "discovery-empty";
  }
  return input.transactionId ?? "file-unknown";
}
