/** Fragment id of a task row in the This-stage list. */
export function taskAnchorId(title: string) {
  return `task-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
