# V1.6 C2 intent truncation audit — corrected finding

Date: 2026-10-24. Source: GitHub `scene500-ai-training-pilot`, `scene500-recommendation/catalog-v0.2.json` and all four `v1.4/semantic-overrides*.json` files.

The earlier claim that 197 scenes had >=12 fields before intents **does not establish any C2 intent loss**. Those 197 scenes were drawn from the entire 500-scene catalog, not the 229 overridden scenes. An audit of the actual 229 overrides, using the committed builder's ordering and 12-field/360-character caps, finds:

| Variant | Any intent retained | All intents retained |
|---|---:|---:|
| C2 | 229/229 | 229/229 |
| P1 (2-intent budget) | 229/229 | 181/229 |
| P2 (4-intent budget) | 229/229 | 229/229 |
| P3 | 229/229 | 229/229 |

All 229 C2 descriptions and their query_intents fit the current builder; maximum computed passage length across overridden scenes is 157 characters, well below 360. P1 discards intents in 48 scenes by design. This is a real-data deterministic construction audit executed through connected GitHub file reads, **not** E5 inference or local Node end-to-end execution.

**Decision:** C2 remains the preferred provisional configuration; do not prioritize P1/P2/P3 model evaluation on an unsubstantiated truncation concern. Preserve v1.6 ablation scripts as research utilities, but prioritize browser model loading, C2 vector index, and end-to-end QA. Existing test-intent-priority.mjs tests only 'any intent', not 'all intents', and therefore would not flag P1's partial loss.
