import { getTestSession } from "@/app/actions/test-session";
import { isClerkConfigured } from "@/lib/auth-config";

export async function hasBuyerPricingSession(): Promise<boolean> {
  const session = await getTestSession();
  if (session?.role === "buyer") {
    return true;
  }
  if (!isClerkConfigured()) {
    return false;
  }
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId != null;
}
