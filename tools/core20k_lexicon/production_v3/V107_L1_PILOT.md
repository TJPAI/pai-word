# V107 L1 evidence pilot, 2000 real OEWN source links

Tested existing verified byte files OEWN 2025 / ECDICT / OMW-cmn, sample seed 20261030, 2000 stratum-spread rows from frozen Core20K/OEWN matching source.

- ECDICT lemma-level Chinese text available: **2000 / 2000**. This is **NOT** synset alignment.
- OMW-cmn identical *numeric offset* observed: **10 / 2000**. **UNVERIFIED CROSS-VERSION**; OEWN2025 numeric IDs cannot be assumed equal to historic WordNet 3.0 offset.
- Cases with both: **10**; they do not constitute two independent synset anchors.
- Validated A-grade synset anchor: **0**; B-grade: **0**; C / quarantined: **2000**.
- Certified glosses: **0**; Production Runtime changes **0**.
- Core blocker: obtain validated OEWN-to-WordNet3.0 inter-version ILI mapping (or independently linked language source). Do NOT promote ECDICT lemma matches or offset equality to verified WordNet Sense correspondences.

Actual per-row trial and script: local core20k_v107_l1_evidence_pilot.zip; NOT yet full repo content persistence.
