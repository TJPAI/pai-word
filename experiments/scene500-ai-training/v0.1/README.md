# Scene500 AI-training pilot v0.1

Source: `data/scene500-taxonomy-20x25-v1.txt` on `core20k-rebuild-v1`; blob SHA `fc9d621f8ce885d3dc2384ccae9b1a7336e1055c`.

Important: `data/scene-taxonomy-v2.json` is a DIFFERENT ID-to-name mapping and MUST NOT be mixed with this catalog.

- 500 verified IDs, 4 template-generated examples per scene when <=20 Unicode code points.
- Training data marked `weak_seed` / `unreviewed`, **NOT gold truth**. The 14 extra cases are review candidates, not validated labels.
- Empty labels in `gap_candidate` mean **not yet mapped** (NOT negative/no-scene truth).
- Do not train or evaluate without filtering unreviewed and establishing independent gold/test sets.
- English token-count rules require separate validator (one English word equals one unit); Unicode length checks are only preliminary.
- Do not ship this as a production model.
