# V101 frozen Core20K vs OEWN 2025 — measured result

Actual frozen membership was extracted in GitHub Actions from `core20k-lexicon-production-v1:core20k-test/data/core20k-runtime.json.gz`. Freeze contract separately specifies 20,000 unique casefold lemmas and ranks.

- Run: https://github.com/TJPAI/pai-word/actions/runs/40972936251
- All frozen membership rows: **20,000**, all rank and casefold lemma unique.
- Full OEWN 2025 source lemma-sense links: **185,129**, from downloaded 2025 JSON zip SHA256 `7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51`.
- Exact casefold frozen lemma to OEWN lemma matching: **58,923** links from **19,304** frozen lemmas.
- Frozen words without an OEWN lemma entry: **696**.
- Legacy 27,471 row register: no rank-lemma disagreements for its present ranks.
- Frozen membership not represented as rank in legacy register: `11104 acte`, `12959 officier`, `13676 courte`, `16482 everytime`, `16842 selle`.
- Difference from Muse-quoted 60,204: **1,281**. The reported 60,204 is NOT reproduced by this exact casefold membership method; it may use another expansion/normalization or synset universe. Do not change Core20K membership to fit this number.
- No fabricated Sense for missing structural or non-English entries. No runtime changes or semantic certification.

Local full output: `core20k_v101_frozen_membership_oewn_alignment.zip`. **Full JSONL payload remains outside GitHub**; this markdown is a fact report, not the payload backup.
