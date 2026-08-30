import { recordSearchSignalFromForm } from "@/app/actions/search";
import { Button } from "@/components/ui/button";

export function ListingSignalForms({
  propertyId,
  query,
  signal,
  returnTo,
}: {
  propertyId: string;
  query: string;
  signal?: "save" | "dislike";
  returnTo?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <form action={recordSearchSignalFromForm}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="kind" value="save" />
        <input type="hidden" name="query" value={query} />
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <Button
          type="submit"
          variant={signal === "save" ? "default" : "outline"}
          size="sm"
          data-testid={`search-save-${propertyId}`}
        >
          {signal === "save" ? "Saved" : "Save"}
        </Button>
      </form>
      <form action={recordSearchSignalFromForm}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="kind" value="dislike" />
        <input type="hidden" name="query" value={query} />
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <Button
          type="submit"
          variant={signal === "dislike" ? "destructive" : "outline"}
          size="sm"
          data-testid={`search-dislike-${propertyId}`}
        >
          Dislike
        </Button>
      </form>
      {signal === "dislike" ? (
        <form action={recordSearchSignalFromForm}>
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="kind" value="clear" />
          <input type="hidden" name="query" value={query} />
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            data-testid={`search-restore-${propertyId}`}
          >
            Restore
          </Button>
        </form>
      ) : null}
    </div>
  );
}
