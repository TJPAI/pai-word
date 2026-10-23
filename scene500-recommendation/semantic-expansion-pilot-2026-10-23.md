# Scene500 semantic expansion — real-data pilot (2026-10-23)

**REVIEW-ONLY; DO NOT MERGE INTO RUNTIME ASSOCIATIONS.**

Input assets: verified compatible Chinese Core20K V0.9.4 RC2 (20,000 terms), lexical associations v0.2 (3,553 links, 1,613 distinct linked terms), Scene500 catalog-v0.2 (500 scenes).

Offline candidate computation (character bigram Dice >= 0.60, >=2 shared bigrams, at most 3 candidate scenes/term, reject tokens shorter than 3 Han characters and lexicon stopword-hinted entries, exclude existing (term_id, scene_id) links):

- 82 candidate term-scene links
- 65 distinct candidate terms
- 60 terms not previously linked
- 13,480 terms excluded by short-term/function-word filter

**No claim of independent human review, LLM semantic relevance, production readiness or CI passing.** Candidate output was computed locally from actual Library assets; not submitted as production data.

Quality diagnostic:
- Plausible: 工业机器人 → 机器人, 图数据库 → 数据库.
- Dangerous false-positive examples: 企业管理 → 物业管理; 内存管理 → 库存管理.
- Therefore raw character similarity is NOT an acceptable auto-promotion criterion.

Next gate: add explicit concept/action/object semantics, manual adjudication and independent blind-query ranking evaluation. Keep approved baseline unchanged and full release status PREVIEW_INTEGRATION_ONLY.
