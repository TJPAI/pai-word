# Scene1341 Live Master Preview — CG-MAIN / CG-MASTER Interface

Updated 2026-11-15. This is the **data-only, no-rebuild preview contract**. It does not authorize publication or SRS writes.

## Deployed frontend / source of truth

- CG-MAIN owns the static original Scene1341 Scene500-parity UX. It is rebuilt/deployed **once when live data mode is introduced**, but not on compatible Master content edits.
- CG-MASTER owns the data branch `cg-master-kaikki-evidence-intake-20261111` of `TJPAI/pai-word`. On EVERY page visit or explicit “检查最新 Master” action the browser fetches its latest Git HEAD, fetches the newest complete full-page manifest, then freezes the exact commit SHA for **every** gzip shard read.
- GitHub REST tree inspection and raw gzip HTTP fetches happen client-side; `cache:no-store`. Each source shard must match **both** the expected Git blob SHA-1 and byte SHA256 **before** decompression. Source rows must be contiguous and unique. No mixed-version partial results.
- Latest Master display and exact short SHA are shown in the separate Settings page; missing/conflicting/unfinished data falls back to previously verified V190 and, if that too fails, original V171 + legacy source-pinned cards. Both remain TEST_ONLY. No certification, SRS, or Scene500 data modifications.
- Learning display is updated only for previously existing, exactly identified Scene1341 cards. Identity gate: `record_id`, `source_final_row`, `scene_id`, normalized `expression`, normalized `cue_zh`, normalized `meaning_zh`. Unmatched records MUST NOT be advertised as playable fully authored/approved units.
- Newest unambiguous **test** IPA is displayed ONLY for `KAIKKI_EXACT_UNIQUE_HEADWORD_TEST_ONLY` and `CMUDICT113_EXACT_ARPABET_CONVERTED_TEST_ONLY` with a complete IPA envelope, and remains explicitly not Sense/QC approved. Multiple/uncertain readings remain HOLD. Existing question/answer teaching content is preserved where the incoming row lacks an approved replacement. `examples[]` has 1–3 bilingual pairs; missing synonym/antonym/disambiguation evidence stays hidden.

## Supported immediate delivery protocol

Complete first-batch full-page `CGMASTER_V<version>_MANIFEST_<YYYYMMDD>.json` in `tools/scene1341_master/qa_reports/`, with:
- `version`, `source_final_rows:[1,3000]`, authoritative `source_master_sha256`, `formal_ready:0`, `srs_eligible:false`.
- `counts.examples_filled`, `counts.test_ipa_nonempty`, `counts.usage_note_filled`, `counts.collocations_filled`.
- Exactly three `shards` with 1,000 complete `jsonl.gz` records each, each `name`, `records`, `git_blob_sha1`, and `sha256`; commit manifest **after** the data files.
- Each row retains `record_id`, `source_final_row`, `scene_id`, `question_page`, `answer_page`, candidate provenance, `release_allowed:false` and `srs_eligible:false`.
- If a new highest-version manifest concerns a different row range (e.g., 3001–6000), the current first-batch preview must continue to load the highest compatible 1–3000 full-page source. Incomplete candidate manifests do not silently gain readiness.

## Multi-batch / new-scene feed (next integration contract)

For batches beyond the already wired 1–3000 source associations, CG-MASTER should publish an **atomic authoritative feed index** at
`tools/scene1341_master/qa_reports/CGMASTER_LIVE_FEED.json`.
Suggested format:

```json
{
 "schema_version": "scene1341-live-feed/v1",
 "source_master_sha256": "62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986",
 "formal_ready": 0,
 "srs_eligible": false,
 "batches": [
  {
   "first_source_final_row": 1,
   "last_source_final_row": 3000,
   "version": "V190",
   "records": 3000,
   "shards": [{"name": "FILE.jsonl.gz", "records": 1000, "git_blob_sha1": "...", "sha256": "..."}],
   "counts": {"examples_filled": 1461, "test_ipa_nonempty": 1478, "usage_note_filled": 1461, "collocations_filled": 1461}
  }
 ]
}
```

CG-MASTER should append or replace only verified complete batches in a single published feed commit. No Global Sense invented IDs, no excluded HOLD rows, no sense-scene count conflation. For full 1,341-scene scale, client-side feed consumption and lazy **per-scene** loading are necessary; this is a separate integration milestone and is **not** claimed implemented by the current first-batch runtime.

## Safety / audit

- Never equate a source association with a certified Global Sense or a complete learning unit. Never silently promote TEST_ONLY to Ready.
- QA reviews the Sense/POS/regional audio and answer content independently. `qa_approved`, provenance and sample content must be explicit.
- No iPhone Safari real-device pass has yet been claimed; CI validates source and logic but is not a device browser substitute.
- Repository file/API availability requires publicly accessible GitHub endpoints; HTTP/rate limiting triggers visible fallback, not silently stale data.

## Tests

`node tools/integration/test-scene1341-live-master-refresh.mjs`
`node tools/integration/test-scene1341-v190-main-answer-intake.mjs`

Current first-batch demonstrator automatically detects a **simulated V191 without frontend rebuild**, rejects incomplete newest delivery, and ignores unrelated newer batch manifests while maintaining a validated first batch.
