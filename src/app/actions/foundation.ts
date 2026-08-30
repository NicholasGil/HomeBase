"use server";

import { REQUIRED_P0_TABLES, SEED_PLAN } from "../../../convex/seedPlan";
import { getFeatureFlags } from "@/lib/flags";

export async function loadFoundation() {
  return {
    flags: getFeatureFlags(),
    tables: [...REQUIRED_P0_TABLES],
    org: SEED_PLAN.org,
    agent: {
      name: SEED_PLAN.agent.name,
      role: "agent" as const,
    },
    buyers: SEED_PLAN.buyers.map((buyer) => ({
      name: buyer.name,
      stage: buyer.stage,
      owedToday: buyer.owedToday,
    })),
    stages: SEED_PLAN.stages.map((stage) => ({
      key: stage.key,
      label: stage.label,
      order: stage.order,
      defaultTasks: stage.defaultTasks,
    })),
  };
}
