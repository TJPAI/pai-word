# V0.4 semantic hard-case annotations

32 single-pass editorial examples, not independent gold. The 0-scene rows represent **no directly relevant topical Scene500 category**, not proof that no generic learning/communication task could apply. For an ambiguous short query, abstention is preferred until context exists.

Crucial distinctions: `machine learning` => S279; `微积分` => no direct topical scene; `微积分考试` => S141 because the exam task is explicit; `读量子物理论文` => S153 because reading is explicit. Do not silently map bare `量子纠缠` to a research workflow.

Do NOT add these cases to both training and evaluation. They are a dedicated hard-case development set. The existing v0.2 evaluation-draft.jsonl overlaps some examples and is not independent; exclude overlaps from any future final held-out test.

Editorial labels are candidate labels only, subject to blind second review before gold promotion.
