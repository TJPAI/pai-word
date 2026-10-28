#!/usr/bin/env python3
"""Conservative deterministic article repair on generated staging drafts. Never certifies semantic quality."""
import json,pathlib,re,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
paths=sorted(root.glob("bilingual_sense_ku_curated_batch[0-9][0-9].jsonl"))
changes=[]; inspected=0
silent_h={"honest","honor","honour","hour","heir","honorable","honourable"}
consonant_u={"university","unicorn","uniform","unilateral","union","unique","unit","useful","user","usual","ubiquitous","european","eulogy"}
for path in paths:
    lines=[json.loads(s) for s in path.read_text(encoding="utf8").splitlines() if s.strip()]
    modified=False
    for r in lines:
        inspected+=1;word=r["correct_answer"];lemma=r["lemma"]
        if not re.fullmatch("[a-zA-Z]+",word):continue
        if len(word)<2:continue
        # Restrict to high-confidence written-vowel phonetic classes; exceptional cases are review-only.
        if lemma in silent_h: expected="an"
        elif lemma in consonant_u:expected="a"
        elif word[0].lower() in "aeiou" and not word.lower().startswith(("one","once","eu","uni","use","ura")):expected="an"
        elif word[0].lower() in "bcdfghjklmnpqrstvwxyz" and not word.lower().startswith(("hon","hour","heir")):expected="a"
        else:continue
        m=re.search(r"\b(a|an)(\s+)___\b",r["prompt"],re.I)
        if not m or m.group(1).lower()==expected:continue
        old=r["prompt"]
        start,end=m.span(1)
        new=old[:start]+(expected.capitalize() if old[start].isupper() else expected)+old[end:]
        assert new.count("___")==1
        assert r["context_en"]==old.replace("___",word)
        r["prompt"]=new
        r["context_en"]=new.replace("___",word)
        modified=True
        changes.append({"rank":r["rank"],"lemma":lemma,"draft_ku_id":r["draft_ku_id"],"before":old,"after":new,"repair_type":"DETERMINISTIC_ARTICLE_AGREEMENT","independent_semantic_certified":False})
    if modified:path.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in lines),encoding="utf8")
(root/"editorial_article_repairs.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in changes),encoding="utf8")
print("ARTICLE_REPAIR_PASS",json.dumps({"inspected":inspected,"repaired":len(changes),"still_require_independent_semantic_qa":inspected},ensure_ascii=False))
