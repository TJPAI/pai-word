#!/usr/bin/env python3
"""Aggregate isolated recognition QA batches, without changing source Sense/KU."""
import collections, json, pathlib, re
B=pathlib.Path(__file__).resolve().parent
ROOT=B/"teaching_qa"
OUT=ROOT/"full_recognition_audit"
OUT.mkdir(parents=True,exist_ok=True)
def parse(path):
    return [json.loads(s) for s in path.read_text(encoding="utf-8").splitlines() if s.strip()]
def write_json(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def write_jsonl(path,rows):
    path.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows),encoding="utf-8")
index=parse(B/"ku_selected_draft_index.jsonl")
recognition=[x for x in index if ":recognition:" in x.get("ku_id","")]
recognition.sort(key=lambda x:(int(re.search(r"rank:(\d+)",x["teaching_sense_id"]).group(1)),x["teaching_sense_id"],x["ku_id"]))
expected=[x["ku_id"] for x in recognition]
expected_set=set(expected)
rows=[]
batch_report=[]
flag_counts=collections.Counter()
conflicts=[]
variants=[]
errors=[]
for n in range(1,56):
    tag=f"{n:03d}"
    directory=ROOT/f"batch{tag}"
    files=sorted(directory.glob(f"qa_recognition_{tag}_*.jsonl"))
    group_counts=[]
    batch_rows=[]
    if len(files)!=10:
        errors.append({"batch":tag,"error":"group_file_count","actual":len(files)})
    for group in range(1,11):
        path=directory/f"qa_recognition_{tag}_{group:02d}.jsonl"
        if not path.exists():
            errors.append({"batch":tag,"group":group,"error":"missing_file"})
            continue
        try: data=parse(path)
        except Exception as exc:
            errors.append({"batch":tag,"group":group,"error":"invalid_jsonl","detail":str(exc)})
            continue
        group_counts.append(len(data))
        target=(max(0,min(50,len(recognition)-(n-1)*500-(group-1)*50)))
        if len(data)!=target:
            errors.append({"batch":tag,"group":group,"error":"wrong_group_size","expected":target,"actual":len(data)})
        for item in data:
            item_id=item.get("ku_id")
            if not item_id: errors.append({"batch":tag,"group":group,"error":"missing_ku_id"})
            for flag in item.get("screening_flags",[]): flag_counts[flag]+=1
            competing=item.get("same_definition_competing_options",[])
            if competing or "same_definition_alternative_answer" in item.get("screening_flags",[]):
                conflicts.append({"batch":tag,"ku_id":item_id,"teaching_sense_id":item.get("teaching_sense_id"),"lemma":item.get("lemma"),"definition_en":item.get("definition_en"),"answer":item.get("answer"),"competing_options":competing,"source":item.get("source"),"source_line":item.get("source_line"),"review_status":"PENDING"})
            if any(f in item.get("screening_flags",[]) for f in ("gloss_variant_review","pos_variant_review","question_contract")):
                variants.append({"batch":tag,"ku_id":item_id,"teaching_sense_id":item.get("teaching_sense_id"),"lemma":item.get("lemma"),"flags":[f for f in item.get("screening_flags",[]) if f in ("gloss_variant_review","pos_variant_review","question_contract")],"source":item.get("source"),"source_line":item.get("source_line")})
        batch_rows.extend(data)
    summary=directory/"summary.json"
    if not summary.exists(): errors.append({"batch":tag,"error":"missing_summary"})
    else:
        try:
            s=json.loads(summary.read_text(encoding="utf-8"))
            if s.get("rows")!=len(batch_rows) or s.get("unique_ku_ids")!=len(set(x.get("ku_id") for x in batch_rows)):
                errors.append({"batch":tag,"error":"summary_mismatch","summary_rows":s.get("rows"),"actual_rows":len(batch_rows)})
        except Exception as exc: errors.append({"batch":tag,"error":"bad_summary","detail":str(exc)})
    expected_ids=expected[(n-1)*500:n*500]
    actual_ids=[x.get("ku_id") for x in batch_rows]
    if actual_ids!=expected_ids:
        errors.append({"batch":tag,"error":"ordered_index_mismatch","expected":len(expected_ids),"actual":len(actual_ids)})
    batch_report.append({"batch":tag,"rows":len(batch_rows),"groups":len(files),"group_sizes":group_counts,"unique_ku_ids":len(set(actual_ids))})
    rows.extend(batch_rows)
actual=[x.get("ku_id") for x in rows]
counts=collections.Counter(actual)
duplicate=[{"ku_id":k,"occurrences":v} for k,v in counts.items() if v>1]
missing=[{"ku_id":k} for k in expected if k not in counts]
unexpected=[{"ku_id":k} for k in counts if k not in expected_set]
if duplicate: errors.append({"error":"cross_batch_duplicate_ku_id","count":len(duplicate)})
if missing: errors.append({"error":"missing_index_ku_id","count":len(missing)})
if unexpected: errors.append({"error":"unexpected_ku_id","count":len(unexpected)})
conflicts.sort(key=lambda x:(x["batch"],x["ku_id"] or ""))
write_jsonl(OUT/"semantic_conflicts_all.jsonl",conflicts)
write_jsonl(OUT/"variant_flags_all.jsonl",variants)
write_jsonl(OUT/"duplicate_ku_ids.jsonl",duplicate)
write_jsonl(OUT/"missing_index_ku_ids.jsonl",missing)
write_jsonl(OUT/"unexpected_ku_ids.jsonl",unexpected)
write_jsonl(OUT/"integrity_issues.jsonl",errors)
write_json(OUT/"batch_inventory.json",batch_report)
summary={"phase":"full_recognition_qa_aggregation","source":"55 existing batch QA JSONL sets and canonical KU index","index_recognition_rows":len(recognition),"index_unique_ku_ids":len(expected_set),"qa_rows":len(rows),"qa_unique_ku_ids":len(counts),"batches":len(batch_report),"group_files":sum(x["groups"] for x in batch_report),"flags":dict(sorted(flag_counts.items())),"semantic_competing_answer_flags":len(conflicts),"gloss_pos_question_flagged_records":len(variants),"cross_batch_duplicate_ids":len(duplicate),"missing_index_ids":len(missing),"unexpected_index_ids":len(unexpected),"integrity_issue_count":len(errors),"structural_inventory_complete":not errors,"semantic_review_certified":False,"release_eligible":False}
write_json(OUT/"summary.json",summary)
print(json.dumps(summary,ensure_ascii=False),flush=True)
if errors: print("WARNING: Full audit inventory has integrity issues; inspect integrity_issues.jsonl",flush=True)
