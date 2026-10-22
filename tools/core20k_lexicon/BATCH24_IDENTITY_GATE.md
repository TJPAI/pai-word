# Batch24 — 500 Sense candidates: identity & pronunciation crosswalk

Actual local audit of 500 Batch23 candidate records against complete Library Core13K V26.7O master, and Batch13 CMUdict ARPABET candidate list.

**Results:** 500/500 candidates have no matching lemma in this particular old Core13K master. Therefore 0 inherited Core13K KU IDs can be directly reused; all 500 require a lookup in independent Core20K incremental candidate / registry assets prior to allocating identities. 408 have one ARPABET pronunciation candidate, 40 have multiple, 52 are absent from CMUdict. Zero accepted IPA, zero confirmed new KU IDs, zero Production Ready.

Local executed script and data: `core20k_batch24_identity_crosswalk.zip`. QA 6/6 PASS with deterministic SHA256 output `c9d6d26dafc4aa3ef045fea5042dc5fb7ef32584a19a666d1354aeb96760b834`.

This audit only establishes absence in Core13K source, not absence in other Core20K registries. All content remains staged. Frozen membership, stable app, Scene500, SRS untouched.
