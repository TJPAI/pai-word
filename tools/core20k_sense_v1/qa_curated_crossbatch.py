#!/usr/bin/env python3
"""Cross-batch sense/KU QA; machine checks do not imply independent semantic certification."""
import pathlib,json,gzip,re,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
missing=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch-all")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: words=json.load(f)["headwords"]
files=["bilingual_sense_ku_curated_batch01.jsonl","bilingual_sense_ku_curated_batch02.jsonl","bilingual_sense_ku_curated_batch03.jsonl","bilingual_sense_ku_curated_batch04.jsonl","bilingual_sense_ku_curated_batch05.jsonl","bilingual_sense_ku_curated_batch06.jsonl","bilingual_sense_ku_curated_batch07.jsonl","bilingual_sense_ku_curated_batch08.jsonl","bilingual_sense_ku_curated_batch09.jsonl","bilingual_sense_ku_curated_batch10.jsonl","newly_resolved_sense_ku_editorial.jsonl"]
items=[]
for filename in files:
    p=(missing if filename=='newly_resolved_sense_ku_editorial.jsonl' else root)/filename
    items += [json.loads(line) for line in p.open(encoding="utf8")]
ids=set();lemmas=set();risks=[];counts=collections.Counter();gated=[]
for r in items:
    lemma=r["lemma"];rank=r["rank"];prompt=r["prompt"]
    assert words[rank-1][1].casefold()==lemma
    assert r["headword_id"]==f"core20k:rank:{rank}"
    assert r["draft_ku_id"] not in ids;ids.add(r["draft_ku_id"])
    assert (rank,lemma) not in lemmas;lemmas.add((rank,lemma))
    assert r["oewn_sense_id"] and r["definition_en_source"]
    assert r["gloss_zh_editorial"] and r["question_instruction_zh"]
    assert prompt.count("___")==1
    expected=lemma.title() if lemma in {"friday","wednesday","saturday","thursday","october","january","june","february","november","december","september","april","monday"} else lemma
    assert r["context_en"]==prompt.replace("___",expected)
    expected=lemma.title() if lemma in {"friday","wednesday","saturday","thursday","october","january","june","february","november","december","september","april","monday"} else lemma
    assert r["correct_answer"]==expected and r["acceptable_answers"]==[expected]
    assert r["production_ready"] is False and r["release_eligible"] is False
    assert r["independent_semantic_certified"] is False
    counts["structural_qa_pass"]+=1

    flags=[]
    if re.search(r"\b(?:a|an) ___\b",prompt,re.I):
        flags.append("ARTICLE_SENSITIVITY_REVIEW")
    if lemma in ("environ","artiste","needful"):
        flags.append("REGISTER_OR_WORD_SENSE_USAGE_REQUIRES_REVIEW")
    if flags:
        risks.append({"lemma":lemma,"risk":flags})
        counts["held"]+=1
    else:
        counts["next_review"]+=1
    gated.append({"rank":rank,"lemma":lemma,"draft_ku_id":r["draft_ku_id"],
       "promotion_gate":"HOLD_ASSESSMENT_REVIEW" if flags else "STRUCTURE_ONLY_SAFE_FOR_NEXT_REVIEW",
       "reasons":flags})
summary={"checked":len(items),"distinct_wordheads":len(lemmas),"structural_qa_pass":counts["structural_qa_pass"],"assessment_risks":risks,"held_for_review":counts["held"],"structure_only_safe_for_next_review":counts["next_review"],"independent_semantic_certified":0,"production_ready":0}
assert len(items)>=80
assert counts["held"]+counts["next_review"]==len(items)
(root/"curated_assessment_promotion_gate.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in gated),encoding="utf8")
(root/"curated_crossbatch_qa.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CURATED_CROSSBATCH_QA_PASS",json.dumps(summary,ensure_ascii=False))
