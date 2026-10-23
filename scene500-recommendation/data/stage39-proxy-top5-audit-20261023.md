# Scene500 V0.10.1 — 39-link Top5 *proxy* evaluation (2026-10-23)

Executed locally on full real assets: Chinese V0.10.1 `terms=20000`, real Scene500 `scenes=500`, existing lexical links `3553`, and specific editorial staging `39`.

**Structural checks:** 39/39 IDs, term surfaces and scene names match; 39/39 pairs distinct and absent from baseline; evidence reason/counterexample fields present and every edge remains ineligible for release.

**Simulation only:** a standalone approximation of scene-name/alias/action/object scoring plus an artificial 0.7 point boost for a hypothetical staged association. For each candidate term searched on its own, target scene was already in approximate Top5 in 3/39 cases, and enters approximate Top5 in 34 cases after a boost. These are **not** measurements from the GitHub Hybrid modules and do not prove true ranking lift or user relevance. Do NOT cite as official Top5 benchmark.

Artifact `scene500_stage39_top5_proxy_qa.json` SHA256 `56f47786025c17adfd32509b911cde966fc1aae7c19e0ce641eb96583db0bea4`.
Executable offline script `scene500_stage_top5_proxy_eval.py` in the conversation workspace.

Next gate before deployment: execute original `engine.mjs`, `contract-adapter.mjs`, `sparse-retriever.mjs`, `subject-intent.mjs` against complete assets, then run held-out relevance labels and Top5 regressions. No baseline associations have changed.
