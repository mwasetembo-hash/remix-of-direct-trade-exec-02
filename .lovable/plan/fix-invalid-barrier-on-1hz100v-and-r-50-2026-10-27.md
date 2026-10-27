# Fix "Invalid barrier" on 1HZ100V (and R_50)

## What we know
- Deriv refused every barrier from +0.5 down to +0.16, and +0.16 is Deriv's own suggested value. So the distance probably isn't the problem. More likely the order request itself has something Deriv doesn't accept with a barrier: the duration, how the barrier is written, or a field name.
- The real cause isn't confirmed yet. My test computer can't reach Deriv, so it has to be confirmed from your connected session.

## Steps
1. **Show the full reason when Deriv rejects.** When a quote fails, the log shows the exact order sent: market, contract type, duration, and barrier as sent. It also shows Deriv's error code and details, which often name the allowed range.
2. **Check whether Deriv offers this at all.** Before quoting, look up what Deriv lists for CALL/PUT with a barrier on this market. Check which durations are offered (ticks, minutes) and what the minimum duration is. If tick-length Higher/Lower isn't offered on that market, block the order with a clear message ("Higher/Lower on 1HZ100V needs at least X minutes"). Don't let the app keep trying barriers that can never work.
3. **Use Deriv's exact barrier text.** Send Deriv's suggested barrier exactly as Deriv wrote it, not rewritten.
4. **Stop shrinking on errors that aren't about distance.** Only try smaller barriers when Deriv's error code says the barrier is out of range. For any other barrier error, stop at once and show the reason.
5. **Adjust after your test.** Once your next order shows Deriv's exact reason in the log, I'll fix that specific cause and add a test for it.

## Technical details
- Store the full contracts list for the market. Read `min_contract_duration`, `expiry_type` and `barrier_category` for the contract type. Validate the duration and unit before quoting.
- Log `error.code` and `error.details` from the quote response.
- Use `barrierCandidates` only for range errors (`BarrierNotInRange` / `BarrierOutOfRange`).
- Put the validation in `src/lib/barriers.ts`, with tests that use example contract lists.

## Your part
After this ships, place one Higher/Lower order on 1HZ100V and send me the new log line.
