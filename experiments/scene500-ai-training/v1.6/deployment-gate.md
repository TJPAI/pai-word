# V1.6 Pages staging deployment gate (2026-10-24)

## Verified real file sizes (unpacked Muse runtime)
- `models/multilingual-e5-small/onnx/model_quantized.onnx`: 118,308,185 bytes.
- `models/multilingual-e5-small/tokenizer.json`: 17,082,730 bytes.
- `vendor/ort-wasm-simd-threaded.jsep.wasm`: 21,596,019 bytes.
- `assets/scene500-c2-index.json`: 2,011,203 bytes.
- Full runtime: 160,145,233 bytes.
- Patched ZIP: SHA-256 `a0fc661f36744764e466010d11885465732e2306f580c9e3ddc190bb91a181d5`; ZIP integrity test PASS (34 entries).

## Blocker
ONNX is > GitHub's 100 MB normal Git object limit. Do not commit the ONNX into the Git repository. The Drive *view* URL is not a reliable direct download URL for unattended GitHub Actions. No public Pages deployment was performed or claimed.

## Controlled deployment procedure
1. Publish the **exact verified patched ZIP** as a release asset or stable HTTPS object with a direct download URL and recorded SHA-256, without committing model binaries.
2. In the preview repository GitHub Actions workflow, fetch ZIP during the job, compare SHA-256, extract runtime into the intended preview subdirectory, and deploy via `actions/upload-pages-artifact` / `actions/deploy-pages`. Ensure the total published Pages artifact remains within service limits.
3. Ensure all worker, model and WASM paths are relative to deployed subdirectory. Validate no requests target origin root unexpectedly.
4. Run Chromium E2E without COOP/COEP headers, assert `modeUsed === 'e5'` and verify model network requests succeed. Test first visit, repeat visit, offline fallback, aborted query, and concurrent search.
5. Run iPhone Safari real-device test for memory, load time, fallback and lockscreen behavior.
6. Keep production default rules until these tests pass; no changes to `main` or `core20k-rebuild-v1`.

## Independent QA status
- ZIP integrity and file sizes: PASS.
- Index and Worker Node tests: PASS in prior QA.
- Pages deployment: NOT_RUN.
- Pages-equivalent Chromium E2E: NOT_RUN.
- iPhone Safari: NOT_RUN.
