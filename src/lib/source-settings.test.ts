import { describe, expect, it } from "vitest";
import { MWASELI12_PRESET, sourceSettings } from "./source-settings";

describe("Mwaseli12 compatible settings", () => {
  it("imports Volatility 100 (1s)", () => expect(MWASELI12_PRESET.symbol).toBe("1HZ100V"));
  it("maps Only Ups / Downs to the existing runs contract", () => expect(MWASELI12_PRESET.kind).toBe("RUNS"));
  it("maps Both Auto to signal direction, not paired buys", () => {
    expect(MWASELI12_PRESET.mode).toBe("SIGNAL");
    expect(MWASELI12_PRESET.autoDouble).toBe(false);
  });
  it("imports a fixed stake of 5", () => expect(MWASELI12_PRESET.stake).toBe(5));
  it("imports a duration of 5 ticks", () => {
    expect(MWASELI12_PRESET.duration).toBe(5);
    expect(MWASELI12_PRESET.unit).toBe("t");
  });
  it("imports the requested offset, not a claimed broker limit", () => expect(MWASELI12_PRESET.offset).toBe(0.35));
  it("retains a tighter balance risk ceiling", () => expect(sourceSettings({ riskPercent: 0.5 }).riskPercent).toBe(0.5));
  it("caps balance risk at the source's one percent", () => expect(sourceSettings({ riskPercent: 2 }).riskPercent).toBe(1));
  it("excludes credentials, automatic startup, martingale and unrelated limits", () => {
    expect(Object.keys(sourceSettings({ token: "do-not-copy", maxStake: 2, maxLoss: 20 }))).toEqual([
      "symbol", "kind", "mode", "stake", "duration", "unit", "offset", "riskPercent", "autoDouble",
    ]);
  });
});