# Batch 29 — bulk bilingual exact-gloss reuse and OEWN review-priority generation

Executed `/mnt/data/build_core20k_batch29.py` against actual frozen 20K unified MVP and Batch28 OEWN merged candidates.

English Sense with missing Chinese gloss: 2295. Exact *same English definition plus same POS* reuse candidates found in existing 20K entries: **34**, zero ambiguity from multiple distinct translations. Remaining **2261** queued for Chinese authoring. Reuse is editorial candidate only; not dictionary or translation verified.

OEWN new Sense population: 3078 headwords, **8395** source Sense candidates; **3065** headwords have >1 Sense candidate. Generated deterministic transparent review-priority heuristic using presence of source examples, gloss length and register risk, with `selected_teaching_sense_id=null` throughout. The first review-priority Sense **is not** the recommended/default teaching Sense.

Artifacts locally created: `core20k_batch29_bulk_qa.zip` includes runnable builder, 34 JSONL reuse records, 2261 JSONL remaining work records, 3078 JSONL full ranked source Sense candidates, README and SHA256 audit.

SHA256: reuse `1f52dad6fa55e2034f3064d5c2751093181be60e9a3907fdf865f4cd5c34f41b`; remaining `6974fa320a6c8c25e800392b7f47deba9bd28810fe1cedb8b351f979bd1a76b0`; OEWN ranking `7a362884301504dc5d80aa9f69c2e842ca00069de945cc1a82ae9b12bed16dc4`.

Zero new fully verified Mandarin Sense translations, zero new canonical KU IDs, zero Production Ready promotions. Frozen membership, stable app, SRS and Scene500 untouched. Full code/data distributed as ZIP only, not yet pushed to repository.