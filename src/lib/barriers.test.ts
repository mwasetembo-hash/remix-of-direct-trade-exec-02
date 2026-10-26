import { describe, it, expect } from "vitest";
import { formatOffset, barrierErrors } from "./barriers";

const base = { offset: 0.61, hi: 0.5, lo: -0.5, decimals: 2, duration: 5, unit: "t", symbol: "R_100" };
describe("barriers", () => {
  it("formats +0.61 cleanly", () => expect(formatOffset(0.61, 2)).toBe("+0.61"));
  it("strips float noise", () => expect(formatOffset(0.1 + 0.2, 3)).toBe("+0.3"));
  it("formats negatives", () => expect(formatOffset(-0.61, 2)).toBe("-0.61"));
  it("accepts +0.61 on Higher/Lower", () => expect(barrierErrors("HIGHER_LOWER", "offset", base)).toEqual([]));
  it("rejects zero offset", () => expect(barrierErrors("HIGHER_LOWER", "offset", { ...base, offset: 0 }).length).toBe(1));
  it("rejects positive low barrier", () => expect(barrierErrors("ENDS", "range", { ...base, lo: 0.5 }).length).toBe(1));
});
