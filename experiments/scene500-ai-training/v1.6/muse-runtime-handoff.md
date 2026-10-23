# Muse execution handoff: C2 browser integration assets (V1.6)

Target branch: `scene500-ai-training-pilot`. Do not modify `main` or `core20k-rebuild-v1`.

**Goal:** deliver reproducible *actual* C2 scene vectors and browser-loadable q8 E5 runtime, not another narrative report. Model inference resources are available.

## Inputs
- `scene500-recommendation/catalog-v0.2.json`
- `experiments/scene500-ai-training/v1.4/semantic-overrides*.json` (four files, 229 overrides)
- Muse V1.5 ZIP: https://drive.google.com/file/d/108cDGx-sSgb52gt0sywH6tRBVrZFGq8l/view?usp=drivesdk
- Adapter: `v1.6/scene500-ai-adapter.mjs`
- Index verifier: `v1.6/verify-c2-index.mjs`

## Mandatory deliverables
1. Run the **exact V1.5 C2 passage builder** for all 500 scenes, including the exact same field ordering, caps, tokenizer, `passage:` prefix, q8 model and pooling/normalization. Preserve the 271 unchanged passages.
2. Generate 500 actual numeric embedding vectors. Package `scene500-c2-index.json` matching `scene500-c2-v1`: `schema,engineVersion,taxonomyVersion,taxonomyFingerprint,catalogFileSha256,model:{id,quantization,sha256,license},scenes:[{sceneId,vector}]`. Do not invent license: inspect authoritative model files and provide SPDX license evidence.
3. Calculate raw catalog file SHA-256 and ordered ID/name fingerprint separately. Verify against the v1.6 verifier; provide exact 64-hex digests. Calculate index SHA-256.
4. Provide browser E5 encoder adapter for Transformers.js/ONNX WASM (prefer Web Worker), query prefix `query: `, matching q8 weights, tokenizer and normalization. No writes to DOM/storage/SRS.
5. Verify local model vectors match exported C2 index: cosine self-similarity near 1, full 500-vector dimensional consistency, and 72 development query Top10 exact-match against V1.5 C2 (or explicitly report numerical/ranking differences). Avoid claiming match unless measured.
6. Run browser E2E in Chromium and iPhone Safari where available; measure cold/warm load, p50/p95 query latency, peak memory, network bytes, aborted searches, stale result behavior, offline fallback. Mark unavailable platforms NOT_RUN.
7. Freeze model artifact provenance: model weight SHA-256, tokenizer SHA-256, license, size, source URL/revision, runtime library version. Include a redistribution assessment; do not commit large weights until licensing and repository policy are clear.
8. Produce standalone ZIP and push small source/index files to experimental branch if authorized. Report complete commit SHA. If no credentials, do not claim pushed.

## Safety and accuracy gates
- Never replace production recommendation automatically.
- E5 cosine is not probability; no arbitrary no-match threshold.
- Preserve `searchSerial` guard on host and AbortSignal semantics.
- Maintain A0/C4 as controls for recall and English short-query hijacking.
- Prioritize actual browser runtime and integration assets before further minor passage-order ablations.
