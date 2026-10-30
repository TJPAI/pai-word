# V113: 21,852-source semantic review queue with 20 definition-guided Chinese editorial drafts

Processed actual V112 normalized JSONL (SHA256 `9308cc7ac20f8d99dc51379c39ff11fbc1abf2ded7f3c43d4ec0a9d0b50772cd`).

- 21,852 source senses, distinct keys: 21,852.
- Same lemma + identical Chinese display lexicalization across different senses: **5,805** (V110 showed 5,795; V113 recalculation finds +10, reconciliation needed).
- Multi-POS lemma: 7,422; >5 Chinese alternatives: 1,169; Latin chars: 15; no Han: 3; >12 Chinese chars: 7.
- 2,000 priority records from **2,000 distinct headwords** ranked by high frequency and conflicts. Risk-targeted; **not** random statistical error estimator.
- **20** individually authored Chinese editorial gloss drafts tied to English source definitions and source Chinese lexemes; no independent acceptance yet.
- **0** independently certified senses; production runtime unchanged.

Sample edits: say (have a certain wording/form) → 说出；表达（某种措辞）; ask (require) → 要求；请求; state (administrative territory) → 州；邦; run (flee) → 逃跑；逃走. These are draft suggestions not canonical production texts.

Full keyed risk flags, 2,000 bilingual priority CSV, 20 editorial rows and SHA256 in local `core20k_v113_semantic_review_queue.zip`. This repo report does not back up full payload.

Next stage requires independent review of selected drafts and real 600-row gold set; not just repeated deterministic tagging.
