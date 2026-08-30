export const FORM_NOTICES = {
  "select-listing": "Select at least one listing.",
  "empty-message": "Enter a message before sending.",
  "vendor-denied": "You cannot send on this assignment.",
  denied: "You cannot do that.",
  sent: "Message sent.",
} as const;

export type FormNoticeCode = keyof typeof FORM_NOTICES;

export function formNoticeMessage(code: string | undefined): string | null {
  if (code === undefined) {
    return null;
  }
  if (code in FORM_NOTICES) {
    return FORM_NOTICES[code as FormNoticeCode];
  }
  return null;
}

export function isFormNoticeCode(value: string): value is FormNoticeCode {
  return value in FORM_NOTICES;
}

const ALLOWED_RETURN_PATHS = [
  "/dashboard",
  "/tours",
  "/vendor",
  "/vault",
  "/offers",
] as const;

export function safeReturnPath(
  value: unknown,
  fallback: (typeof ALLOWED_RETURN_PATHS)[number],
): (typeof ALLOWED_RETURN_PATHS)[number] {
  if (
    typeof value === "string" &&
    (ALLOWED_RETURN_PATHS as readonly string[]).includes(value)
  ) {
    return value as (typeof ALLOWED_RETURN_PATHS)[number];
  }
  return fallback;
}

export function pathWithNotice(
  path: (typeof ALLOWED_RETURN_PATHS)[number],
  notice: FormNoticeCode,
): string {
  return `${path}?notice=${notice}`;
}
