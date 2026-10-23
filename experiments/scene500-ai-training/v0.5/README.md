# Scene500 V0.5 semantic anchor prototype

A compact bilingual **rule-based anchor layer**, NOT a trained semantic model. The goal is to catch known failures from the character n-gram baseline without claiming general semantic understanding.

Rules: 13 scene anchors. Probe examples: 18, authored after the V0.4 hardcases; they are development diagnostics, not blinded gold tests. Positive hits: 12/14; zero-label probes with any recommendation: 0/4. These figures do NOT measure production accuracy.

**Important:** A zero-label probe may still have a valid scene (e.g. bank account => S403). Do not interpret absence of a rule hit as correct rejection. This prototype only emits anchor matches, so it cannot replace the full recommender. Overlapping terms and false positives require QA.

All scene IDs refer to the canonical 500-scene taxonomy, identical to perf-preview. This branch does not modify the app.
