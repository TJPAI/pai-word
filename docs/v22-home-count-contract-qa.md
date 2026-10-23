# PAI Word V2.2 — 首页计数口径与回归核验

Source inspected: `rebuild-preview/learning-runtime.js`, `rebuild-preview/round-policy.js`, `rebuild-preview/home-dashboard.js` on `home-perf-safe-load-20261022`.

## Confirmed calculation contracts
1. **今日新学 N 词**: `globalNewCompleted()` reads `dailyNewProgress.newWordsCompleted.length`; the rating projector adds only previously unintroduced headwords, deduplicating by `w.rank ?? w.w`.
2. **每批 N KU**: `round-policy.js` allows 10/25/50; this is a KU session size, not a count of distinct headwords.
3. **今日剩余**: `dailyRemaining()` is `max(0,newPerDay-globalNewCompleted())`; it is informational and does not block rolling batches.
4. **到期复习**: `home-dashboard.js` uses `PAI_LEARNING_QA.due()` when available, with a record-based fallback.
5. **场景结果数量**: `countHtml(inventory(...))` displays candidate/reviewed inventory depending on deployment mode; it does not subtract a learner's completed KUs.
6. **首页恢复**: `PAI_HOME_RECONCILE` updates count text in place without reordering recommendation cards.

## Findings requiring follow-up
- **Terminology risk**: the label `可学词` in Core20K mode uses `reviewedCount` and may be mistaken for **remaining unlearned** words. Do not equate these without an explicit learner-state subtraction.
- **Daily quota interpretation**: the UI says `今日新学 N 词`, but the 25/50/100/200 daily target is informational; batches are not hard-capped by it. Keep this intentional policy explicit.
- **Reset/snapshot**: validate that a fresh preview database gives zero completed and that an old visual snapshot cannot override fresh persisted counts.
- **Date boundary**: verify local-day rollover, especially near midnight, with multiple KUs from the same headword.
- **Historical rating**: verify re-rating an introduced KU does not increase `今日新学`.

## Required browser regression cases
| Case | Action | Expected |
|---|---|---|
| A | New headword, first KU rated | 今日新学 +1 |
| B | Same headword, second KU rated | 今日新学 unchanged |
| C | Already introduced headword rated | 今日新学 unchanged |
| D | Rating failure/transaction abort | All visible counters unchanged |
| E | Change batch 10→25→50 | Per-batch KU limit changes; daily new headword count unchanged |
| F | Change scene/difficulty | Scene inventory reflects selected filter; daily total unchanged |
| G | Reload immediately after commit | Same daily count, no double increment |
| H | Local midnight rollover | New-day daily count resets; durable SRS history retained |

No live Safari count assertions are claimed by this document. No UI/SRS implementation changes are authorized merely by a suspected mismatch.
