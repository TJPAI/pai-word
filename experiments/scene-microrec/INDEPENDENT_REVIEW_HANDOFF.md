# Scene500 independent blind review handoff

Input artifact: `scene-microrec-ab-results/semantic-blind-input-500.json`, generated from `scene500-recommendation/catalog-v0.2.json` and 500 unapproved English candidates. It intentionally omits ChatGPT's first-pass judgments, revisions and rationales.

Reviewer requirements:
1. Work only from blind input before reading `semantic-review-pilot.mjs` or other first-pass files.
2. Return one unique scene_id per record, verdict PASS, REVISE or REJECT, and individual rationale (at least 30 characters).
3. For REVISE, add `revised_en`. Verify meaning against Chinese name, description and confusing neighboring scenes.
4. Record actual external reviewer identity and the source GitHub Actions blind input run ID. Do not attribute ChatGPT's first-pass reviews to an independent reviewer.
5. Deliver `independent-blind-review-results.json` with schema `scene500-independent-review-v1`, status `IN_PROGRESS` or `COMPLETE`, reviewer, blind_input_run and items. COMPLETE requires exactly 500 records.
6. Run `node experiments/scene-microrec/validate-independent-review.mjs --write`. CI validates completeness and provenance format, not the truthfulness of claims.
7. Keep production and training blocked until an actual separate approval, new teacher/student training and blind A/B quality assessment. Approval must not be inferred from a passing structural CI.

Example unapproved structure (illustrative; never submit as an audited result):
```json
{"schema":"scene500-independent-review-v1","status":"AWAITING_EXTERNAL_REVIEW","reviewer":"","blind_input_run":"","items":[]}
```
