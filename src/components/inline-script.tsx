/**
 * Runs `html` synchronously while the browser parses the server HTML, before
 * first paint and before React hydrates. On the client the tag is rendered as
 * text/plain so React never re-executes it (see the Next.js guide
 * "Preventing flash before hydration").
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
