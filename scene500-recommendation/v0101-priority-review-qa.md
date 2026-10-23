# Scene500 V0.10.1 semantic candidate review prioritization

Real asset: `scene500_semantic_workset_v0101.json`, derived from Chinese Core20K V0.10.1.
At most one of S126/S132/S137/S153 generic academic/research/discussion contexts per term.

- Input candidate links: **771**
- Prioritized for detailed review: **513**
- Deferred repetitive generic-context candidates: **258**
- Generic-context candidates remaining in prioritized queue: **144**
- Original proposed 157 terms preserved; no associations have been promoted
- Both queues remain `release_eligible=false`; `production_ready=false`

These numbers were independently calculated locally against the real workset using the same ordering/cap rule. The JS command-line runner and regression test have been committed, but a successful GitHub Actions run is not yet established.

Command:
`node scene500-recommendation/prioritize-semantic-workset.mjs workset.json prioritized.json`

Quality limitation: Prioritization is not semantic certification, and the resulting contexts may remain too generic. The next phase must collect sense-aware bilingual headword evidence and benchmark judged Top5 relevance. Do not merge candidates into the 3,553-edge runtime pack until reviewed.
