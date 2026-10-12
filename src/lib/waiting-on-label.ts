import type { BuyerDashboardView } from "../../convex/lib/dashboardView";

export function waitingOnDisplayLabel(view: BuyerDashboardView): string {
  const role = view.waitingOn;
  if (role === null || role.length === 0) {
    return "Nobody";
  }
  const contact = view.contacts.find((row) => row.role === role);
  if (contact?.name) {
    return contact.name;
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}
