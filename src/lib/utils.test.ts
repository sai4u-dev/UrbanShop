import { describe, it, expect } from "vitest";
import { formatPrice, cn } from "@/lib/utils";

describe("utils", () => {
  it("formats cents to USD", () => {
    expect(formatPrice(19999)).toBe("$199.99");
    expect(formatPrice(0)).toBe("$0.00");
  });
  it("joins class names", () => {
    expect(cn("a", false, "b", null, undefined)).toBe("a b");
  });
});
