# Real Node asset QA — Chinese V0.10.1 — 2026-10-23

Executed locally on Node v22.16.0 against the eight-file Library delivery materialization and the real prior Scene500 assets.

- Runtime: `0.10.1-evidence-compat`; SHA256 `18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093` — **MATCH**
- 20,000 records; 20,000 distinct term IDs and valid adapter-relevant fields — **PASS**
- 500 distinct Scene500 catalog IDs — **PASS**
- 3,553 references; 3,553 distinct term-scene pairs — **PASS**
- 1,613 associated Chinese terms (8.065%).
- Seven subject queries 数学/物理/化学/天文/哲学/政治/经济: present in lexicon, **zero lexical association** each.
- Query examples: 猫 1 baseline link, 会议 8, 机器学习 1, 书 0, 的 0, 他 0.

**Scope limit:** this execution checks real assets with independent Node code. It has **NOT** executed the repository's actual `chinese-lexicon-loader.mjs`, `contract-adapter.mjs` and `engine.mjs` against the Library files. It does not certify Top5 search ranking or Safari/production use.

A separate code change adds opt-in experimental-extension support to the standard loader, default off. Its newly added regression test awaits CI confirmation. Candidate edges remain unverified and not production-ready.
