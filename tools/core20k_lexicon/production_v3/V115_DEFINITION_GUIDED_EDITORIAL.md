# V115 – definition-guided Chinese editorial draft batch

Input: actual V114 2,000-record Core20K/OEWN/OMW candidate JSONL; edited first 90 high-frequency and polysemous entries, each keyed by its stable sense_key, with English definition and provenance (ILI / WN30).
- **90** authored bilingual sense-specific Chinese gloss draft records with stable unique IDs.
- **74/90** have at least one exact lexicalization part overlapping OMW candidate text; **16** do not (NOT automatically errors; require independent evidence).
- **90** require independent review; **0** certified; **0** production ready; **0** Runtime changes.
- Illustrative editorial corrections: `say` "have or contain a certain wording" => "写着；内容是"; `see` "come together" => "相遇；碰见"; `state` "administrative territory" => "州；省（行政区划）"; `day` "Earth rotation" => "一昼夜（地球自转一周）"; `check` "slow development" => "抑制；阻碍（发展）".
- There is **no second independent annotation**, no validity estimate and no statistical significance claim.

Full independently reviewable JSONL/CSV + SHA256 in the local delivered `core20k_v115_90_definition_guided_drafts.zip`; data file NOT yet committed to GitHub. Efficiency: 90 authored drafts this pass vs 20 V113, but substantive approved throughput remains 0 pending independent QA. Next batch should target independent QA and a more durable on-repo data channel rather than repeated markdown-only reports.
