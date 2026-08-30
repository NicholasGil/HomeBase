import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  searchPillClassName,
  searchPillInputClassName,
} from "@/lib/trip-ui";

export function SearchQueryPill({
  defaultValue,
  value,
  onChange,
  name,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
}) {
  return (
    <div className={searchPillClassName}>
      <Search
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        name={name}
        data-testid="search-query"
        defaultValue={defaultValue}
        value={value}
        onChange={
          onChange
            ? (event) => {
                onChange(event.target.value);
              }
            : undefined
        }
        placeholder="What are you looking for?"
        aria-label="What are you looking for?"
        className={searchPillInputClassName}
      />
      <Button
        type="submit"
        variant="next"
        size="lg"
        className="rounded-full px-5"
        data-testid="search-submit"
      >
        Search
      </Button>
    </div>
  );
}
