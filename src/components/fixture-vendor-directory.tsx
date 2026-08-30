import { loadFixtureVendorCookies } from "@/app/actions/vendors";
import { getTestSession } from "@/app/actions/test-session";
import {
  VendorDirectoryDenied,
  VendorDirectoryView,
} from "@/components/vendor-directory";
import { loadSeedDirectoryForViewer } from "@/lib/vendor-access";

export async function FixtureVendorDirectory() {
  const session = await getTestSession();
  if (session === null || session.role !== "buyer") {
    return <VendorDirectoryDenied />;
  }
  const directory = loadSeedDirectoryForViewer(session, session.transactionId);
  const cookies = await loadFixtureVendorCookies();
  if (!directory.ok) {
    return <VendorDirectoryDenied />;
  }
  return (
    <VendorDirectoryView
      stage={directory.stage}
      transactionId={session.transactionId}
      vendors={directory.vendors}
      requestedVendorIds={cookies.state.requestedVendorIds}
    />
  );
}
