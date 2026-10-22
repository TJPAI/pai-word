# Chinese Core20K V0.9.1 — candidate extraction QA

Development branch: `chinese-core20k-dev`. Existing stable app branch remains untouched.

Local (conversation-file) artifact: `zh-core20k-v0.9.1-keyword-candidates.zip`

SHA-256: `323cfbe03150d3ec2dcfd77ffb18880ae532a098dfc29ca9d070faa838179442`

New runtime module: `zh_core20k_keyword_candidates.mjs`, companion QA `qa_zh_core20k_keyword_candidates.mjs`. Their JS sources and 20,000-term JSON are packaged locally **but not yet committed to GitHub**.

Test: 12 illustrative Chinese sentences; 27/28 hand-specified keywords found (96.43% recall, vs 75% for previous greedy longest-match baseline). `登机` is absent from this membership. Overlapping matching allows both compound and constituent words. This is candidate recall, **not segmentation precision**, recommendation relevance or independent corpus coverage. False positives are possible.

Runtime note: measured trie construction ~4.1 seconds on local Node harness; never perform this construction synchronously on the app home main thread. Prefer Web Worker or prebuilt index and lazy load.

Open quality blockers: independent general frequency, POS, traditional/simplified, multi-domain coverage, segmentation benchmarking. No membership or term-ID edits made.

Follow existing adapter contract and QA files in user-facing deliverable zip.
