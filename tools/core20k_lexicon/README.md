# Core20K isolated lexicon production lane

This lane is separate from the stable PAI Word app. It cannot mark AI-generated drafts as Production Ready.

## Audit
```bash
python3 tools/core20k_lexicon/build.py \
  --frozen PAI_Word_Core20000_LongTermBaseline_Frozen_V2.0.6.csv \
  --expected-sha256 e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca \
  --drafts ai_candidate_drafts.jsonl --out build/core20k
```

The CSV is an externally supplied frozen artifact, not copied or rebuilt here. The SHA check is a strict byte-level guard.
A successful run only verifies identity/rank structure and stages drafts. It does **not** establish dictionary, semantic, example, collocation, scene, or pronunciation verification.

## AI draft input format
One JSON object per line:
```json
{"lemma":"example","part_of_speech":"noun","sense_key":"illustration","core_definition_zh":"例子；实例","core_definition_en":"a particular instance used to explain something","sense_examples":[{"en":"Can you give an example?","zh":"你能举个例子吗？","source_type":"ai_generated","sense_key":"illustration"}],"sense_collocations":[{"text":"give an example","source_type":"ai_generated","sense_key":"illustration"}],"model_id":"record exact model version","generation_prompt_version":"v1","evidence":[]}
```

Draft `sense_key` labels are editorial candidate references, **not** canonical sense IDs. Production promotion requires review against independently sourced licensed dictionary and corpus records, cross-sense alignment, human intervention on high risk entries, and audited old KU ID mapping.

## Release gates (not yet implemented)
1. Verify frozen bytes, role ledger and references.
2. Join historical Core13K canonical KU IDs without silent reassignment.
3. Validate independent field-level provenance and licensing.
4. Check examples and collocations against specific Sense, not merely Word.
5. Run independent semantic QA and risk routing.
6. Build sharded runtime pack with manifest SHA256 and verify reload.
7. Check Scene500 binding without changing source ranks.
8. Exercise App loader and SRS migration in isolated preview.

Until these gates exist and pass, do not label output Production Ready or deploy to the stable application.
