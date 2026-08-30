import {
  ASK_MY_AGENT,
  agentQuestionForSection,
  explainAllSections,
  explainSection,
  isContractSectionId,
  type ContractSection,
} from "../../convex/lib/explainContract";
import type { TestSession } from "@/lib/test-session";

export const FIXTURE_AGENT_THREAD_COOKIE = "hb_fixture_agent_thread";

export type FixtureAgentTurn = {
  sectionId: string;
  sectionTitle: string;
  question: string;
  answer: string;
};

export type FixtureAgentThread = {
  turns: FixtureAgentTurn[];
};

export function parseFixtureAgentThread(
  value: string | undefined,
): FixtureAgentThread {
  if (value === undefined || value.length === 0) {
    return { turns: [] };
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || !("turns" in parsed)) {
      return { turns: [] };
    }
    const turns = (parsed as { turns: unknown }).turns;
    if (!Array.isArray(turns)) {
      return { turns: [] };
    }
    return { turns: turns as FixtureAgentTurn[] };
  } catch {
    return { turns: [] };
  }
}

export function loadFixtureSections(session: TestSession | null):
  | { ok: true; sections: ContractSection[] }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (session.role !== "buyer") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return { ok: true, sections: explainAllSections() };
}

export function askFixtureSection(input: {
  session: TestSession | null;
  sectionId: string;
  thread: FixtureAgentThread;
}):
  | { ok: true; thread: FixtureAgentThread; turn: FixtureAgentTurn }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" | "UNKNOWN_SECTION" } {
  if (input.session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (input.session.role !== "buyer") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!isContractSectionId(input.sectionId)) {
    return { ok: false, reason: "UNKNOWN_SECTION" };
  }
  const section = explainSection(input.sectionId);
  const question = agentQuestionForSection(section);
  const turn: FixtureAgentTurn = {
    sectionId: section.id,
    sectionTitle: section.title,
    question,
    answer: `${ASK_MY_AGENT}. Section "${section.title}" was sent to your licensee.`,
  };
  return {
    ok: true,
    turn,
    thread: { turns: [...input.thread.turns, turn] },
  };
}
