# Scene KU audit — 2026-10-15

Baseline: `6bfe301cfa1cad31cd2ebddc2b76338b0b84e110`, tap-v57.

## Scope and results

The audit reproduces all 188 topic + 76 task + 48 function selectors against the actual 13,000 headwords, 16,616 KU, including 16,136 Sense KU. It also includes the runtime's previously omitted explicitTaskTerms and topic headword seeds. No matching rules were expanded.

This is **not** a claim that all 312 scenes have passed semantic review. Explicit editorial decisions cover **135 scenes**: 821 included mappings (377 distinct Sense KU), consisting of 641 additions and 180 existing confirmations, plus 130 exclusions for incorrect sense/substring matches or clear scope mismatch. That is **951 recorded decisions / 771 membership changes**. Each stores word, KU ID, exact title/gloss, action and rationale. The 130 exclusions are not all dictionary errors: some are pedagogical scope exclusions.

| Metric | Before | After |
| --- | ---: | ---: |
| Scene–KU links | 4,065 | 4,576 |
| Unique Sense KU represented | 2,949 | 3,072 |
| Empty scenes | 10 | 1 |
| Nonempty scenes below 10 KU | 159 | 128 |
| Duplicate KU within a scene | 0 | 0 |
| Pending links | 4,065 | 3,755 |
| External dictionary-verified links | 0 | 0 |

288 scenes still contain pending links. 177 scenes have no explicit editorial decision yet. 13,064 Sense KU remain unmapped to the 312 scenes; these are a coverage backlog, **not 13,064 proven missing mappings**. There are 339 multiple-rule hits before deduplication, not duplicated memberships; 1,504 cross-scene reuses after editing are allowed, not automatically errors.

28 English seed occurrences in task/function lists and 48 in quick-topic lists are absent from the catalog. These may be valid English inflections/compounds; absence is **not proof of invalid English**. They remain pending in `scene-audit-summary.json`. In particular, custom has no customs/border-control sense, can's only Sense KU is the container noun, and date has no fruit sense. We do not fabricate new senses.

The remaining empty scene is blockchain (`d8-t12`): no dedicated sense was found; generic ledger/token vocabulary was not used to pad the count. Some formerly empty scenes now have only a few directly relevant foundational terms (e.g. climate change: climate/carbon/emission), so nonempty does **not** mean rich or complete.

## Evidence and files

- `../data/scene-ku-review-v1.json`: authoritative explicit editorial decisions; **not dictionary_verified**.
- `scene-counts-before-after.csv`: all 312 per-scene deltas and pending counts.
- `scene-audit-before.json.gz`, `scene-audit-after.json.gz`: complete reproducible candidate/member inventories and missing-seed backlogs. Read with Python `gzip.open`, or `gzip -dc`.
- `scene-audit-summary.json`: aggregate totals, empty scenes and absent English seeds.

No Core-13000 packs, word/KU identities, SRS implementation, tap timing defaults or pronunciation flow were changed. Reviews are bundled into the runtime, so they do not add a startup network dependency. Existing cached scenes are revalidated/reviewed and cannot restore an excluded membership. Scene metadata is now included in the shell's offline cache.

## Reproduce and validation

```
node scripts/build-runtime.cjs
node scripts/audit-scene-ku.mjs --out scene-audit.json
node --test tests/scene-audit.test.cjs tests/learning-v3.test.cjs tests/tap-flow.test.cjs
```

The scene tests compare every membership in all 312 runtime scenes with the offline report, both cold and cached. They reject invalid/stale/duplicate editorial decisions, exercise known homonym regressions and verify scene metadata's offline route. Learning tests cover canonical SRS migration, wrong-item recurrence, last-card failure, resume, daily counts and all word-pack checksums.

The existing tap test harness was stale relative to the baseline runtime (old currentUnit/audio API). Only the harness was updated to use getVisibleLearningUnit/PAI_AUDIO and the current final-repeat delay. It tests configurable 1/3-second boundaries separately from the unchanged v57 defaults (2/5-second thresholds, 2/4/6-second holds, 3 repeats).

## Next priorities

1. Review the remaining 3,755 candidate mappings, prioritizing heavily over-broad function scenes and medical scene scope; keep unreviewed candidates pending.
2. Enrich the 128 sparse scenes by inspecting actual Sense KU, not adding substring aliases.
3. Resolve upstream absent/merged sense blockers (customs, modal can, fruit date, dedicated blockchain terminology) in a separate lexicon-content review with dictionary evidence and stable IDs.
4. Externally verify uncertain/multi-meaning KU before promotion to a dictionary-verified status.
