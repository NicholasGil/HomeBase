"use client";

import { InlineScript } from "@/components/inline-script";
import { transactionScrollPopBootstrapScript } from "@/lib/transaction-scroll-pop-bootstrap-script";

export function TransactionScrollPopBootstrap() {
  return <InlineScript html={transactionScrollPopBootstrapScript()} />;
}
