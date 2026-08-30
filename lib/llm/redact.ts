export function redactPii(text: string) {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
    .replace(/\b(?:acct|account)[:\s#]*\d{6,}\b/gi, "[REDACTED_ACCOUNT]")
    .replace(
      /\b(?:dob|date of birth)[:\s]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi,
      "[REDACTED_DOB]",
    )
    .replace(
      /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:Ave|Avenue|St|Street|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Trail|Ct|Court)\b/gi,
      "[REDACTED_ADDRESS]",
    );
}

export function containsRawPii(text: string) {
  return (
    /\b\d{3}-\d{2}-\d{4}\b/.test(text) ||
    /\b(?:acct|account)[:\s#]*\d{6,}\b/i.test(text) ||
    /\b(?:dob|date of birth)[:\s]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/i.test(text) ||
    /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:Ave|Avenue|St|Street|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Trail|Ct|Court)\b/i.test(
      text,
    )
  );
}
