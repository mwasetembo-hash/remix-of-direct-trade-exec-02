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

import { derivBarriers } from "./barriers";
describe("derivBarriers", () => {
  const list = [{ contract_type: "CALL", barriers: 1, expiry_type: "tick", barrier: "+0.1" }, { contract_type: "CALL", barriers: 1, expiry_type: "intraday", barrier: "+0.61" }];
  it("picks tick default for ticks", () => expect(derivBarriers(list, "CALL", "t")?.barrier).toBe(0.1));
  it("picks intraday default for minutes", () => expect(derivBarriers(list, "CALL", "m")?.barrier).toBe(0.61));
});

import { barrierCandidates } from "./barriers";
describe("barrierCandidates", () => {
  it("starts at +0.61 and ends at Deriv default", () => { const c = barrierCandidates(0.61, 0.0066, 4); expect(c[0]).toBe(0.61); expect(c.at(-1)).toBe(0.0066); });
  it("keeps negative sign", () => expect(barrierCandidates(-0.61, 0.0066, 4).every((v) => v < 0)).toBe(true));
});
