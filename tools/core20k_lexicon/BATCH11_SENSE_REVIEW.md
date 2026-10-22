# Core20K Batch 11 OEWN Sense review
Source: real OEWN 2025 matching output (Batch 10 SHA256 `5a13428dbbe07721989626b9ac3a7ac078b57880a57230dfa2c3af0921a2939d`).
Audited 3,078 matched frozen headwords, 8,395 source-linked Sense candidates.
Only 13 have one candidate; 3,065 have multiple candidates; 115 have more than five candidate senses.
**OEWN source order is not a validated most-frequent / most-useful Sense order.** No automatic first-sense selection or KU promotion.
The local auditable deliverable `core20k_batch11_sense_review_tasks.zip` contains `first_sense_review_queue.jsonl`, `sense_inventory.jsonl`, `zh_authoring_tasks.jsonl`, `audit.json`, `build.py` and `test_build.py`. QA 5/5 passed locally.
All 8,395 Chinese gloss tasks are unstarted; all 8,395 Sense candidates lack independently accepted US IPA, reviewed Chinese gloss, and canonical KU IDs. Do not mark Production Ready.
Future steps: choose pedagogical first senses using independent usage evidence, produce Chinese draft glosses and independently validate, and integrate licensed pronunciation.
Stable application, original Scene500 ordering, and SRS were untouched.
