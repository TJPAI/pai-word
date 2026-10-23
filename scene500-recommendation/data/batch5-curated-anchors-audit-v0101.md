# Scene500 Core20K V0.10.1 — Batch 5 curated domain anchors

Batch 5 was generated **from real Core20K term surfaces**, not invented dictionary items, using an explicit, chat-authored map from scene IDs to narrowly domain-specific lexical anchors. Validation ran against the actual 20,000-term lexicon, 500-scene catalog, and 3,653-link opt-in staging pack.

- Raw novel anchors: 152 pairs.
- Nine manually rejected false/overbroad anchors: 监控摄像头→视频通话; 不可再生能源→可再生能源; 自行车赛→骑自行车; 保险公司→保险理赔; 维生素片→营养与饮食; 求职→搜索职位; 供应链→供应商管理; 邮政→邮局; 银行业务→银行柜台.
- Final: **143 nonduplicate candidate links**, **143 distinct term IDs**, **129 terms new to the 3,653 staging pack**, across **77 scenes**.
- 20 links have term-specific editorial rationales and explicit disambiguating counterexamples; 123 are domain-anchor *candidate hypotheses*, **not manually validated semantic matches**.
- Stable term ID, scene name, baseline/experiment dedup, repeated-pair tests **PASS**.
- Semantic certified: **0**. Production approved: **0**. Not merged, not deployed.
- Local full deliverables: `scene500_batch5_reviewed_anchor_pack.json`, SHA256 `4315692dae92ce4a58c68c7bb5c0cb6282e9f9e49f466f287a595bd0317af079`; `scene500_batch5_qa.json`; builder `scene500_anchor_batch5.py`; finalizer `scene500_batch5_finalize.py`.
- Existing production association baseline remains **3,553**; the 3,653 staging pack remains opt-in experimental only.

CAUTION: The current 123 anchor candidates include lexical surface relatedness as evidence, which cannot establish lexical sense correctness without review. They must not be used as evidence of precision or ranking lift. The original Hybrid engine A/B has not been executed in the local runtime.
