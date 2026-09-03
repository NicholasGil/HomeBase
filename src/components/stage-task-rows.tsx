"use client";

import { Check, Circle, CircleDashed, CircleOff } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

import { taskAnchorId } from "@/components/task-anchor";
import type { DashboardTask } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

const TASK_STATUS: Record<
  DashboardTask["status"],
  { icon: ComponentType<{ className?: string }>; iconClass: string; text: string }
> = {
  open: { icon: Circle, iconClass: "text-next", text: "open" },
  blocked: {
    icon: CircleDashed,
    iconClass: "text-muted-foreground",
    text: "blocked",
  },
  done: { icon: Check, iconClass: "text-sage-foreground", text: "done" },
  canceled: {
    icon: CircleOff,
    iconClass: "text-muted-foreground",
    text: "canceled",
  },
};

const SETTLED_TASK: ReadonlySet<DashboardTask["status"]> = new Set([
  "done",
  "canceled",
]);

/**
 * The row id named by the URL fragment. `:target` covers hard loads, but a
 * soft navigation from the dashboard's gate link is a pushState, which never
 * updates `:target`, so the hash is mirrored into `data-landed` as well.
 */
function useLandedId() {
  const [landed, setLanded] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      setLanded(window.location.hash ? window.location.hash.slice(1) : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return landed;
}

/**
 * Read-only rows: no task route or task mutation reaches the buyer, so each
 * row is a status mark, the title, the owner and the status word, with an
 * anchor id so the dashboard's gate line can land on it.
 */
export function StageTaskRows({ tasks }: { tasks: DashboardTask[] }) {
  const landed = useLandedId();

  if (tasks.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">No tasks on this stage.</p>
    );
  }
  return (
    <ul
      aria-label="Tasks on this stage"
      className="mt-3 divide-y divide-border/70 text-sm"
    >
      {tasks.map((task) => {
        const status = TASK_STATUS[task.status];
        const Icon = status.icon;
        const settled = SETTLED_TASK.has(task.status);
        const id = taskAnchorId(task.title);
        return (
          <li
            key={task.title}
            id={id}
            data-task-status={task.status}
            data-landed={landed === id ? "true" : undefined}
            className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 scroll-mt-24 target:bg-sand/60 data-[landed=true]:bg-sand/60"
          >
            <Icon
              className={cn("size-4 shrink-0", status.iconClass)}
              aria-hidden
            />
            <span
              className={cn("min-w-0 flex-1", settled && "text-muted-foreground")}
            >
              {task.title}
            </span>
            <span className="shrink-0 text-right text-xs text-muted-foreground">
              {task.assigneeRole} · {status.text}
              {task.blocksStage && !settled ? (
                <span className="block">blocks advance</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
