import {
  priorityReasonFor,
  type CommandCenterExceptionKind,
} from "../../convex/lib/commandCenter";
import { redactPii } from "./redact";

export function prioritizeCommandCenterReason(input: {
  exceptions: readonly CommandCenterExceptionKind[];
  stageLabel: string;
}) {
  return priorityReasonFor(input.exceptions, redactPii(input.stageLabel));
}
