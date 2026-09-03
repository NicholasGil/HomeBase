import { Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

export type ContactReachDetails = {
  phone?: string;
  email?: string;
};

/**
 * A dialable href for a phone as the fixture writes it ("256-555-0100").
 * Ten digits are North American and get the +1 prefix; anything else keeps
 * its digits (and a leading +) so the dialer receives what the user sees.
 */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `tel:+1${digits}`;
  }
  if (phone.trim().startsWith("+")) {
    return `tel:+${digits}`;
  }
  return `tel:${digits}`;
}

export function mailtoHref(email: string): string {
  return `mailto:${email.trim()}`;
}

const REACH_LINK_CLASS =
  "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Phone and email as tel:/mailto: links, each a 44px target. `name` gives
 * assistive tech "Call …" / "Email …" instead of the bare number. Renders
 * nothing when the record carries neither, so callers decide the fallback.
 */
export function ContactReach({
  phone,
  email,
  name,
  className,
}: ContactReachDetails & {
  name: string;
  className?: string;
}) {
  if (!phone && !email) {
    return null;
  }
  return (
    <div
      data-slot="contact-reach"
      className={cn("flex flex-wrap items-center gap-x-4", className)}
    >
      {phone ? (
        <a
          href={telHref(phone)}
          aria-label={`Call ${name} at ${phone}`}
          className={REACH_LINK_CLASS}
        >
          <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 truncate">{phone}</span>
        </a>
      ) : null}
      {email ? (
        <a
          href={mailtoHref(email)}
          aria-label={`Email ${name} at ${email}`}
          className={REACH_LINK_CLASS}
        >
          <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 truncate">{email}</span>
        </a>
      ) : null}
    </div>
  );
}
