# V2.1 lightweight home integration

Baseline: core20k-rebuild-v1, 4e58fc9802f6d680723ee06900277a7e6133013a.
Only development branch is modified. No deployment is implied.

## Batch 1: data and statistics contract

Executed Node generators using production adapter + Top100 loader validation:
20,000 headwords, 16,617 active KU, 16,137 playable sense KU, 2 compatibility
orphans, 500 scenes, 50,000 candidates, 22,227 eligible scene rows.
Both projections bind source SHA256 4828f04b1eaae0e1469b34979d9d95179ad1a26dcaed9585c84b68ad9ba2491c.

Executed 2,540 searches comparing actual core.byScene units against the unmodified
search algorithm's lightweight branch: IDs, order, scores, and counts identical.
Executed 24 budget comparisons against daily.js and learning-app due() extracted
from the actual runtime: all pass; stale assignments rebuild without home writes.

Correction: the proposed metadata validator incorrectly required at least 22,227
unique playable KU. That is a count of scene rows, not unique KU. Final learning-app
counts due records once per active KU, including learningPending / lastKnown=false;
it does not multiply by scene membership. Projection now matches that behavior.

Initial existing test run had 4 failures (rating phases mock, transaction mock,
search-restore assertion in scene-refresh test, rating controls assertion).
These are not reported as passing until repaired and re-executed.
