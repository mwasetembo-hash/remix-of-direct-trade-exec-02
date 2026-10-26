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
export function derivBarriers(list: any[], contractType: string, unit: string): { barrier: number | null; barrier2: number | null; raw: string } | null {
  const expiry = unit === "t" ? ["tick"] : unit === "d" ? ["daily"] : ["intraday", "daily"];
  const c = list.find((x) => x?.contract_type === contractType && Number(x?.barriers) > 0 && expiry.includes(String(x?.expiry_type)));
  if (!c) return null;
  const b = c.barrier ?? c.high_barrier;
  const b2 = c.low_barrier ?? null;
  if (b == null) return null;
  const n = (v: unknown) => (v == null || !/^[+-]/.test(String(v)) ? null : Number(v));
  return { barrier: n(b), barrier2: n(b2), raw: b2 != null ? `${b} / ${b2}` : String(b) };
}
