import { describe, expect, it } from "vitest";

import { PHOTO_WASHES, photoWashForSeed } from "@/lib/trip-ui";

describe("photoWashForSeed", () => {
  it("picks a wash from the palette and stays stable for a seed", () => {
    const first = photoWashForSeed("seed:oakwood");
    expect(PHOTO_WASHES).toContain(first);
    expect(photoWashForSeed("seed:oakwood")).toBe(first);
    expect(first).not.toMatch(/neutral|zinc|slate/);
  });

  it("varies washes across listing seeds", () => {
    const washes = [
      photoWashForSeed("seed:oakwood"),
      photoWashForSeed("seed:madison"),
      photoWashForSeed("seed:harvest"),
      photoWashForSeed("seed:decatur"),
      photoWashForSeed("seed:jones-valley"),
      photoWashForSeed("seed:athens"),
    ];
    expect(new Set(washes).size).toBeGreaterThan(1);
  });
});
