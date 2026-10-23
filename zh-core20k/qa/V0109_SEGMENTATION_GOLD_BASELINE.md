# V0.10.9 empirical gold-boundary tokenizer baseline

Data assets are saved in ChatGPT Library under `/PAI_Lexicon/zh-core20k-v0101-scene500-delivery/`:
- `v0109-evaluate_tokenizer.py` (reproducible evaluator)
- `v0109-gold-tokenization-qa.json` (results and error examples)

**Measured** against 120 UD Chinese GSDSimp test sentences preserved in Library (punctuation removed and gold tokens concatenated); exact span matching:
- Gold tokens: 2254
- Predicted tokens: 2289
- Correct exact spans: 1804
- Precision: 0.7881170816950633
- Recall: 0.8003549245785271
- F1: 0.7941888619854721

Baseline source sha256: `18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093`
Gold snapshot sha256: `de9704970614fa296d684f1d15424aceeaf611c81710ed1b7c1bb16a8d48ddcd`

**Limits:** this evaluates a simple lexicon longest-match algorithm, NOT Scene500 production segmentation, not raw punctuation-preserving evaluation, and not domain-balanced independent generalization. These 120 sentences previously served in coverage QA and MUST NOT be used as held-out tuning validation. No membership, ID, rank, or Runtime changes. production_ready=false.
