import { formatTourInstant } from "../../convex/lib/tourOptimizer";

export { formatTourInstant };

export function propertyLine(address: {
  line1: string;
  city: string;
  state: string;
}) {
  return `${address.line1}, ${address.city}, ${address.state}`;
}
