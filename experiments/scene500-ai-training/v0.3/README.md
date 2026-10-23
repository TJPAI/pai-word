# Scene500 baseline v0.3 diagnostic

Actual execution in ChatGPT code mode: 2,158 weak training records and 61 held-out draft prompts, 12,227 distinct character 1-3 gram features. Scores persisted in `diagnostic-results.json`.

No independently reviewed gold data yet. The 12 empty draft labels include real subject areas missing from Scene500 and must NOT be interpreted as validated negatives.

At cosine >=0.35: 35/49 draft positives have one draft target in top 5; 1/12 draft empty rows had a recommendation. These figures are *not* production accuracy.

Failure examples: machine learning => S187; 微积分 => S064; 哲学 / 量子纠缠 => none. 0.35 is a diagnostic threshold only.

Next steps: lock reviewed dev and test labels, create hard negatives, revise annotation to allow explicit out-of-taxonomy intent and scene abstention, train semantic hybrid, compare using the same gold split and browser latency measurements.

No changes to the application, recommendation runtime or production branches.
