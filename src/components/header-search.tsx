import { Search } from "lucide-react";

export function HeaderSearchHomes() {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="hidden min-w-0 max-w-xs flex-1 sm:block"
    >
      <label className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm shadow-sm ring-1 ring-black/8">
        <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          placeholder="Search homes"
          aria-label="Search homes"
          data-testid="header-search-homes"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
    </form>
  );
}
