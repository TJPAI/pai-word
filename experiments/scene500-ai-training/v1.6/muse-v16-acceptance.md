# Muse V1.6 — independent preliminary acceptance (2026-10-24)

Received the actual Google Drive ZIP (91,911,160 bytes) and unpacked it locally.

## Independently verified
- C2 index: 2,011,203 bytes, SHA-256 `eae39123c0f21800990bb68468331de95f1b45e8a7ed086598ac62959e680254`, 500 scenes x 384 dimensions.
- ONNX q8: 118,308,185 bytes, SHA-256 `f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193`.
- Tokenizer: 17,082,730 bytes, SHA-256 `0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39`.
- ZIP contains runtime worker, encoder, model, vendor bundles, index, catalog, scripts and evidence JSON.

## Reported by Muse, not independently rerun here
- Node 72/72 Top10 exact, Chromium Top1 72/72, Chromium Top10 exact 57/72; R@1 40/59, R@5 55/59; p50 55.7ms, p95 125.7ms.
- MIT upstream model license and Xenova revision evidence in delivered provenance.

## Integration blockers / independent findings
1. `scripts/check-index-regression.mjs` requires CLI arguments, repo catalog, v0.6 cases, V1.5 reference, four overrides, local Transformers.js installation and a model at hardcoded `/tmp/scene500-e5-local/`; it is not self-contained. Direct invocation without those prerequisites fails.
2. Worker encoder's abort handler removes the pending request but does not remove its AbortSignal listener; `dispose()` clears pending requests without rejecting their promises. Fix both.
3. 160MB cold transfer and iPhone Safari NOT_RUN are launch blockers. GitHub Pages custom COOP/COEP headers are unavailable; test single-thread fallback under Pages headers.
4. No production branch changes until end-to-end mobile QA.

Decision: accept as an experimental engineering artifact, not production-ready.
