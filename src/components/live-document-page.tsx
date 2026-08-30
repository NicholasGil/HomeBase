"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { seedDocumentTitle } from "@/lib/seed-documents";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

type Opened = {
  type: string;
  extractedSummary: string | null;
  via: "principal" | "grant";
  transactionId: string;
};

export function LiveDocumentPage({ documentId }: { documentId: string }) {
  const open = useMutation(api.documents.open);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void open({ documentId: documentId as Id<"documents"> })
      .then((result) => {
        if (!cancelled) {
          setOpened(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDenied(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, open]);

  if (denied) {
    return (
      <p data-testid="document-denied" className="text-sm text-muted-foreground">
        You cannot open this document.
      </p>
    );
  }

  if (opened === null) {
    return <p className="text-sm text-muted-foreground">Opening document…</p>;
  }

  return (
    <Card data-testid={`document-open-${opened.type}`}>
      <CardHeader>
        <Link href="/vault" className="text-sm underline" data-testid="document-back">
          Back to vault
        </Link>
        <Badge variant="outline">{opened.via}</Badge>
        <CardTitle>{seedDocumentTitle(opened.type)}</CardTitle>
        <CardDescription>{opened.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {opened.extractedSummary ? (
          <p className="text-sm">{opened.extractedSummary}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          View logged. Transaction {opened.transactionId}.
        </p>
      </CardContent>
    </Card>
  );
}
