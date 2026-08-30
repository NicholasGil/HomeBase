import { describe, expect, it } from "vitest";

import { classifyDocumentType } from "./classifyDocument";

describe("classifyDocumentType", () => {
  it("uses an explicit type when it is known", () => {
    expect(classifyDocumentType({ type: "preapproval" })).toBe("preapproval");
  });

  it("reads the file name when type is missing", () => {
    expect(
      classifyDocumentType({ fileName: "inspection-report.pdf" }),
    ).toBe("inspection_report");
    expect(classifyDocumentType({ fileName: "notes.txt" })).toBe("other");
    expect(classifyDocumentType({ fileName: "vendor-invoice.pdf" })).toBe(
      "invoice",
    );
  });
});
