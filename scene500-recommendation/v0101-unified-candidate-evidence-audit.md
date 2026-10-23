# V0.10.1 real candidate evidence audit (2026-10-23)

Input: 827 unique review-only candidates, SHA256 `4083e6a9661c46ad5f931e3b689a53352b938cc698f22949ca2b73fe89f9615e`.
Reference: actual 500-scene catalog and V0.10.1 term identities.

- 827 candidate pairs audited.
- **0** matches with exact scene name, alias, action or object fields.
- **827** therefore require a separate semantic/sense review before any release. Lack of exact match does not mean a candidate is wrong.
- **0** reviewed associations approved by this check.
- The prioritization queue is a *derivative* of the semantic workset, not an independent source; its duplicated presence must never increase evidence count.
- The unified queue's 827 proposals each have exactly one distinct source family under this provenance policy.

The primary constraint on growth is not duplicate aggregation or increased fuzzy matching, but independently evaluated lexical-sense↔scene evidence and QA on Top5 precision. This audit cannot substitute for human semantics review or certified deployment.
