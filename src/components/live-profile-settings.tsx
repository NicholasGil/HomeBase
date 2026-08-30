"use client";

import { useQuery } from "convex/react";

import { ProfileSettings } from "@/components/profile-settings";
import { api } from "../../convex/_generated/api";

export function LiveProfileSettings() {
  const session = useQuery(api.me.getSession, {});

  if (session === undefined) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  return (
    <ProfileSettings
      name={session.name}
      role={session.role}
      email={session.email}
    />
  );
}
