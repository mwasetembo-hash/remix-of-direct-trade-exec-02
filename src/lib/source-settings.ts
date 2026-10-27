import type { Kind } from "./contracts";

// Allowlisted, non-secret defaults from Mwaseli12 BotSettings (revision 5e90846).
// BOTH_AUTO means signal-selected direction, not simultaneous opposite orders.
export const MWASELI12_PRESET = Object.freeze({
  symbol: "1HZ100V",
  kind: "RUNS" as Kind,
  mode: "SIGNAL" as const,
  stake: 5,
  duration: 5,
  unit: "t" as const,
  offset: 0.35,
  riskPercent: 1,
  autoDouble: false,
});

export const SOURCE_PRESET_NAME = "Mwaseli12 · GitHub defaults";

// Do not import daily limits as session limits or loosen tighter user settings.
export function sourceSettings(current: Record<string, unknown>) {
  const currentRisk = current["riskPercent"];
  return {
    ...MWASELI12_PRESET,
    riskPercent: typeof currentRisk === "number" && Number.isFinite(currentRisk) && currentRisk > 0
      ? Math.min(currentRisk, MWASELI12_PRESET.riskPercent)
      : MWASELI12_PRESET.riskPercent,
  };
}