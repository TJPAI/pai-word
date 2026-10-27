# KU Factory frozen rank inputs (V2.0.6)

This isolated branch contains a reproducible exporter, not certified KU content.

## Authoritative inputs

- `PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv`, SHA256 `e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca`
- `PAI_Word_Core20000_LongTermBaseline_RoleLedger_V2.0.6.csv`, SHA256 `00c5f24325b69044dd90289d68087165ad45ee3162359d2b721487cee6586ebc`

Run:

```bash
python3 tools/core20k_lexicon/ku-factory/export_v206_batches.py \
  --frozen /path/to/PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv \
  --roles /path/to/PAI_Word_Core20000_LongTermBaseline_RoleLedger_V2.0.6.csv \
  --out tools/core20k_lexicon/ku-factory/input/v206
```

Expected output: exactly 40 JSONL files, 500 ranked headwords each, and a manifest with per-batch SHA256. Batch 003 covers ranks 1001–1500. The original source CSVs remain external and must not be reconstituted from guesses.

**Do not start generating canonical KU IDs from these rank inputs.** The frozen CSV and RoleLedger do not supply canonical Sense IDs. Restore Sense from the authoritative English lexicon lane and audit historical Core13K canonical mappings separately. Until then, output is headword input only, not certified content or production-ready KU.

This is an additive isolated asset; no stable app branch is modified.
