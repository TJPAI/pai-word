# V109 official ILI bridge and frozen Core20K intersection

## Provenance
- CILI repository revision: `a895d7ecb18019dda3443f98901e59d81ce8722b`
- `ili-map-pwn30.tab` SHA256: `13b6741395a8bdf20e5a19686ffa49167653696d4f523db17a79dce3211a6627`
- OEWN 2025 source SHA256: `7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51`
- OMW-cmn source SHA256: `810c6f955bc0fd0f6d75d7d0ea01988c943a5972b6320aae008ad43225dca741`
- Official CILI uses WN30 offset to ILI mapping. Source file is pinned by commit and content hash.

## Actual run
GitHub Actions: https://github.com/TJPAI/pai-word/actions/runs/40984546148 — **success**.
Output artifact 12945699845 contains 35,216 mapped OMW concepts with 67,152 distinct concept-level Chinese lexicalizations. Not final Core20K results.

## Reproduced frozen Core20K intersection (local)
Frozen Core20K exact-lemma OEWN source: 58,923 lexical sense links. Join by unique OEWN synset ID through the CILI bridge:
- **21,852** Core20K source lemma-sense links with at least one OMW Chinese lexicalization
- **37,071** not linked
- **10,975** distinct linked lemma strings
- **15,287** distinct linked OEWN synsets
- **6,917** linked source-sense links of rank <= 2,000
- Ambiguous CILI->OEWN mapped OMW concepts: 0 in the current mapping report.

IMPORTANT: this is **one lexicon's synset-level Chinese lexical evidence**, not two independently corroborating dictionaries and not quality-certified teaching Chinese glosses. L1-A / independent semantic-certified counts remain 0; no Runtime change.

Local full outputs: `core20k_v109_core20k_ili_linked_evidence.zip` and GitHub Actions artifact `enlex-v109-ili-bridge`. The former is not yet in GitHub, report only.

Next: inspect Chinese lexicalization quality, Chinese traditional/simplified, punctuation, cross POS, choose priority 2,000 and evaluate against independent English dictionary evidence. Do not auto-promote these candidate lexemes.
