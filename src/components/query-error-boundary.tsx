"use client";

import { Component, type ReactNode } from "react";

export class QueryErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (this.state.failed) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
