# CG-ENLEX V108 OEWN 2025 ILI and OMW-cmn cross-version audit

Inputs are actual binary assets from GitHub Actions (#40961824263 / #40981545105), verified by SHA256:
- OEWN JSON zip `7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51`
- OMW-cmn tab `810c6f955bc0fd0f6d75d7d0ea01988c943a5972b6320aae008ad43225dca741`

Measured:
- OEWN 2025 synsets: **107,519**
- OEWN with ILI: **104,335** (distinct 104,335)
- OEWN with no ILI: **3,184**
- OMW-cmn legacy WordNet 3.0 offset IDs: **42,312** across 79,808 Chinese lemma rows
- Raw identical offset IDs across datasets: **251**, but this is not a validated cross-version semantic mapping.
- **Certified OEWN2025-to-WN3.0 synset translations: 0**

Important: WordNet 3.0 numeric offsets and OEWN2025 IDs are not interchangeable. A validated WN30->CILI/ILI mapping must be obtained and tested; otherwise the 42,312 offset-based Chinese concepts remain unanchored relative to OEWN2025. English Wordnet documentation describes CILI as the correspondence mechanism. The current JSON includes ILI on 104,335 source synsets, allowing a reliable join once WN30-to-ILI is available.

Local deliverable: core20k_v108_ili_mapping_preflight.zip includes the complete 107,519-row synset ID/ILI register and machine-readable metrics; **not uploaded to GitHub**. This GitHub file is only verified statistics. No content certification or Runtime change.
