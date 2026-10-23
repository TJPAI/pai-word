# V0.9 label-quality audit (20 selected V0.6 items)

The 72-item v0.6 evaluation set is NOT gold. This audit identified 20 examples where single-label assumptions, abstention interpretation or safety context need explicit review. 4 ambiguous examples, 11 multi-scene examples, and additional out-of-taxonomy/safety-sensitive cases.

## Critical finding

Top-5 recall against a single arbitrarily chosen scene may underestimate good recommendations, while accepting any loosely related scene may overestimate them. The original H015 `I'd like to rent a bicycle` was mapped to S083 shared bicycles without evidence that it was a shared bicycle. H035 chatbot answer quality was mapped to S278 prompt design without explicit prompt intent. H060 quantum experiment was tagged as no-scene despite mentioning an experiment; whether S156 is valid depends on user intent.

## Evaluation policy

1. Freeze the original v0.6 labels. Preserve original results for reproducibility; **do not silently rewrite** baseline metrics.
2. Store adjudication as an overlay, not training labels. Every label carries `review_status`.
3. Distinguish primary/secondary scene relevance, out-of-taxonomy, ambiguous and noise; allow multiple valid scenes only when justified by the literal query.
4. For no-match evaluation, only score verified topical non-matches, not ambiguous task queries.
5. Require independent blind review by a separate annotator and adjudicate disagreements before calling any set gold.
6. Avoid medical advice or triage behavior in scene recommendation; safety-sensitive prompts need separate handling.

No model inference or deployment performed in v0.9.
