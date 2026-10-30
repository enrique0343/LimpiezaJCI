import { describe, it, expect } from "vitest";
import { parseGs1, gs1Supply } from "@/lib/gs1";

describe("parseGs1", () => {
  it("parses parenthesised GTIN + lot", () => {
    const p = parseGs1("(01)07501234567890(10)A2026-114");
    expect(p.gtin).toBe("07501234567890");
    expect(p.lot).toBe("A2026-114");
    expect(p.plain).toBe(false);
  });

  it("parses a raw element string with FNC1 separator", () => {
    const p = parseGs1("0107501234567890\u001d10A2026-114");
    expect(p.gtin).toBe("07501234567890");
    expect(p.lot).toBe("A2026-114");
  });

  it("parses a location GLN (AI 414)", () => {
    const p = parseGs1("(414)0750123456789");
    expect(p.gln).toBe("0750123456789");
    expect(p.plain).toBe(false);
  });

  it("reads fixed-length GTIN then variable lot until end", () => {
    const p = parseGs1("010750123456789010LOT99");
    expect(p.gtin).toBe("07501234567890");
    expect(p.lot).toBe("LOT99");
  });

  it("treats a plain room code as a non-GS1 anchor", () => {
    const p = parseGs1("LJCI-201");
    expect(p.plain).toBe(true);
    expect(p.raw).toBe("LJCI-201");
    expect(p.gtin).toBeUndefined();
  });

  it("handles empty input without throwing", () => {
    expect(parseGs1("").plain).toBe(true);
    expect(parseGs1("   ").raw).toBe("");
  });

  it("round-trips a supply code", () => {
    const code = gs1Supply("07501234567906", "B2026-088");
    const p = parseGs1(code);
    expect(p.gtin).toBe("07501234567906");
    expect(p.lot).toBe("B2026-088");
  });
});
