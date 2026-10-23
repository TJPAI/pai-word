#!/usr/bin/env python3
"""Research-only Scene500 TF-IDF retrieval baseline; never deploy without audited labels."""
import argparse
import json
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).resolve().parent

def load_jsonl(path):
    with Path(path).open(encoding="utf-8") as fp:
        return [json.loads(line) for line in fp if line.strip()]

def text_units(text):
    # English words count as one unit, Han ideographs as one, punctuation as one.
    return len(re.findall(r"[A-Za-z]+(?:['’-][A-Za-z]+)*|[\u3400-\u9fff]|[0-9]|[^\s]", text))

def train(train_rows):
    queries = [r["query"] for r in train_rows]
    model = TfidfVectorizer(analyzer="char", ngram_range=(1, 3), min_df=1, sublinear_tf=True)
    matrix = model.fit_transform(queries)
    return model, matrix

def recommend(query, model, matrix, rows, limit=10, threshold=0.20):
    vector = model.transform([query])
    scores = cosine_similarity(vector, matrix).ravel()
    by_scene = {}
    for i in scores.argsort()[::-1]:
        score = float(scores[i])
        if score < threshold:
            break
        for label in rows[int(i)]["labels"]:
            scene_id = label["scene_id"]
            by_scene[scene_id] = max(by_scene.get(scene_id, 0.0), score)
    return sorted(by_scene, key=lambda x: (-by_scene[x], x))[:limit]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--query")
    parser.add_argument("--threshold", type=float, default=0.20)
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()
    rows = load_jsonl(ROOT / "weak-semantic-seeds.jsonl")
    draft = load_jsonl(ROOT / "evaluation-draft.jsonl")
    assert rows and all(1 <= text_units(r["query"]) <= 20 for r in rows)
    train_queries = {r["query"] for r in rows}
    assert not train_queries.intersection(r["query"] for r in draft), "Evaluation leakage"
    assert all(0 <= len(r["labels"]) <= 10 for r in rows)
    model, matrix = train(rows)
    print(json.dumps({"training_weak_rows":len(rows),
        "evaluation_drafts":len(draft), "gold_samples":0,
        "model":"char_tfidf_nearest_neighbors", "threshold":args.threshold},
        ensure_ascii=False))
    if args.query:
        print(json.dumps({"query":args.query,
            "predicted_scene_ids":recommend(args.query, model, matrix, rows,
                args.limit, args.threshold)}, ensure_ascii=False))
    else:
        for row in draft:
            if not row["expected_scene_ids"]:
                continue
            found = recommend(row["query"], model, matrix, rows, 5, args.threshold)
            print(json.dumps({"query":row["query"], "candidate_expected":row["expected_scene_ids"],
                "predicted":found}, ensure_ascii=False))
        print("Draft predictions above are diagnostic only; no accuracy claim without audited gold.")
if __name__ == "__main__":
    main()
