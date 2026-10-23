# V0.10.1 Scene500 semantic association expansion — first review workset
Date: 2026-10-23

This is NOT a promoted association pack. Runtime still uses the approved existing 3,553 lexical candidate edges.

Real-asset local calculation:
- Source lexicon: V0.10.1-evidence-compat full 20,000 terms.
- Baseline: v094-lexical-v0.2, 3,553 links, 1,613 linked terms.
- Catalog: 500 scenes, same established IDs.
- 17 explicit editorial topic families (mathematics, sciences, humanities, public affairs, computing, literature/books, legal, career).
- 771 **new, nonduplicated REVIEW-ONLY proposals** across 157 terms.
- 121 formerly unlinked term IDs represented.
- 19 proposed glossary expressions absent from current 20k membership (excluded rather than invented).
- Proposed aggregate (NOT an approved combined pack): 4,324 edges, 1,734 distinct linked terms.

Reproduction:
`node scene500-recommendation/build-semantic-workset.mjs <v0101-runtime.json> <catalog.json> <v094-associations.json> <workset-output.json>`

Important methodological limits:
- This first batch uses hand-authored topical family dictionaries, not trained semantic retrieval or an LLM-verified lexicon.
- Matching a subject to `classroom`, `research`, or `discussion` is useful generic context, NOT proof of specific lesson content.
- Exact scene ID and term ID validation are required before any selective promotion; confidence is null.
- All candidate records have `release_eligible=false` and `review_required_not_approved`.
- QA script committed, but its GitHub Actions execution still needs independent confirmation.
- Expansion to broader 20k coverage requires systematic topic taxonomy, multi-sense handling, independent judged precision and negative examples before rollout.

Observed local counts above were measured against the stated real asset triplet with a Python equivalent of the workset algorithm. They are not claims of browser or production integration.
