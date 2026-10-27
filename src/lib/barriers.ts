// Deriv barrier formatting and validation (relative offsets like "+0.61").
export function formatOffset(n: number, decimals: number): string {
  const d = Math.max(0, Math.min(decimals, 8));
  const s = Math.abs(n).toFixed(d).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return `${n < 0 ? "-" : "+"}${s}`;
}

/** Returns human-readable problems with barrier settings before asking Deriv for a quote. */
export function barrierErrors(kind: string, barrier: "none" | "offset" | "digit" | "range", o: { offset: number; hi: number; lo: number; decimals: number; duration: number; unit: string; symbol: string }): string[] {
  const errs: string[] = [];
  const pip = 10 ** -Math.max(0, o.decimals);
  const tooSmall = (n: number) => Math.abs(Number(n.toFixed(o.decimals))) < pip;
  if (barrier === "offset") {
    if (!Number.isFinite(o.offset) || tooSmall(o.offset)) errs.push(`Barrier offset must be non-zero (at least ${pip.toFixed(o.decimals)})`);
    if (kind === "HIGHER_LOWER" && o.unit === "t" && o.duration < 5) errs.push("Higher/Lower with ticks needs at least 5 ticks");
  }
  if (barrier === "range") {
    if (!(o.hi > 0) || tooSmall(o.hi)) errs.push("High barrier must be a positive offset (e.g. +0.5)");
    if (!(o.lo < 0) || tooSmall(o.lo)) errs.push("Low barrier must be a negative offset (e.g. -0.5)");
  }
  if (barrier !== "none" && barrier !== "digit" && o.unit === "t" && !/^(R_|1HZ|JD|stpRNG|BOOM|CRASH|RDB)/.test(o.symbol)) {
    errs.push("Tick durations with barriers only work on synthetic indices; use minutes for this market");
  }
  return errs;
}

/** Deriv's own default barrier(s) for a contract type at this duration unit, from contracts_for. */
export function derivBarriers(list: any[], contractType: string, unit: string): { barrier: number | null; barrier2: number | null; raw: string; rawBarrier: string; rawBarrier2: string | null } | null {
  const expiry = unit === "t" ? ["tick"] : unit === "d" ? ["daily"] : ["intraday", "daily"];
  const c = list.find((x) => x?.contract_type === contractType && Number(x?.barriers) > 0 && expiry.includes(String(x?.expiry_type)));
  if (!c) return null;
  const b = c.barrier ?? c.high_barrier;
  const b2 = c.low_barrier ?? null;
  if (b == null) return null;
  const n = (v: unknown) => (v == null || !/^[+-]/.test(String(v)) ? null : Number(v));
  return { barrier: n(b), barrier2: n(b2), rawBarrier: String(b), rawBarrier2: b2 != null ? String(b2) : null, raw: b2 != null ? `${b} / ${b2}` : String(b) };
}

/** Offsets to try, from the trader's value shrinking toward Deriv's default, keeping the sign. */
export function barrierCandidates(wanted: number, derivDefault: number | null, decimals: number, steps = 7): number[] {
  const sign = wanted < 0 ? -1 : 1;
  const start = Math.abs(wanted);
  const floor = derivDefault != null && Math.abs(derivDefault) > 0 ? Math.min(Math.abs(derivDefault), start) : start / 50;
  const out: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = Number((start * (floor / start) ** (i / steps)).toFixed(decimals));
    if (v > 0 && !out.includes(sign * v)) out.push(sign * v);
  }
  return out;
}

const toSec = (v: string) => { const m = /^(\d+)([tsmhd])$/.exec(v); if (!m) return null; return Number(m[1]) * ({ t: 1, s: 1, m: 60, h: 3600, d: 86400 } as Record<string, number>)[m[2]!]!; };

/** Null when Deriv lists this barrier contract for the duration; otherwise a plain reason. */
export function barrierOffering(list: any[], contractType: string, duration: number, unit: string): string | null {
  if (!list.length) return null;
  const withBarrier = list.filter((x) => x?.contract_type === contractType && Number(x?.barriers) > 0);
  if (!withBarrier.length) return `Deriv does not offer ${contractType} with a barrier on this market`;
  const isTick = unit === "t";
  const match = withBarrier.filter((x) => (isTick ? x.expiry_type === "tick" : x.expiry_type !== "tick"));
  if (!match.length) {
    const mins = withBarrier.map((x) => x.min_contract_duration).filter(Boolean).join(" or ");
    return isTick ? `Deriv does not offer ${contractType} with a barrier in ticks here — use at least ${mins || "a few minutes"}` : `Deriv only offers ${contractType} with a barrier in ticks here`;
  }
  const want = isTick ? duration : toSec(`${duration}${unit}`);
  const mins = match.map((x) => String(x.min_contract_duration ?? ""));
  const ok = match.some((x) => { const mn = String(x.min_contract_duration ?? ""); const mnv = isTick ? Number(mn.replace("t", "")) : toSec(mn); return mnv == null || Number.isNaN(mnv) || want == null || want >= mnv; });
  return ok ? null : `${contractType} with a barrier needs at least ${mins.join(" or ")} on this market`;
}
