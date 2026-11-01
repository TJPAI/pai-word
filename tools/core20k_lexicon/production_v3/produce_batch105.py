#!/usr/bin/env python3
"""Complete Batch105 from actual V93 minus all existing KU Sense IDs; never overwrite."""
import json, pathlib, random, subprocess, sys
BASE=pathlib.Path(__file__).resolve().parent
OUT=BASE/"ku_drafts/v2"
def records(pattern):
    for p in sorted(BASE.glob(pattern)):
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.strip(): yield json.loads(line)
def git(*args):
    return subprocess.run(["git",*args],check=True,capture_output=True,text=True).stdout.strip()
def main():
    all_senses=list(records("recovery/v93_register_20261030/shards/senses_*.jsonl"))
    if len(all_senses)!=27471 or len({x["teaching_sense_id"] for x in all_senses})!=27471: raise RuntimeError("V93 register mismatch")
    covered={x["teaching_sense_id"] for x in records("ku_drafts/v*/ku_*.jsonl") if x.get("teaching_sense_id")}
    pending=sorted((x for x in all_senses if x["teaching_sense_id"] not in covered),key=lambda x:(int(x["rank"]),x["teaching_sense_id"]))
    print("SOURCE",len(all_senses),"COVERED",len(covered),"PENDING",len(pending),flush=True)
    if len(pending)>500: raise RuntimeError("More than 500 pending; manual examination required")
    eligible=[]
    for x in pending:
        zh=[v["value"].strip() for v in x.get("zh_candidates",[]) if isinstance(v,dict) and isinstance(v.get("value"),str) and v["value"].strip()]
        if not x.get("lemma") or not x.get("definition_en") or not zh: raise RuntimeError("ineligible "+x["teaching_sense_id"])
        eligible.append((x,list(dict.fromkeys(zh))))
    pool={}
    for x in all_senses:
        lemma=x.get("lemma")
        if lemma: pool.setdefault(str(x.get("pos","")),set()).add(lemma)
    global_pool=sorted({x.get("lemma") for x in all_senses if x.get("lemma")})
    OUT.mkdir(parents=True,exist_ok=True)
    for offset in range(0,len(eligible),50):
        group=offset//50+1
        path=OUT/f"ku_recognition_105_{group:02d}.jsonl"
        if path.exists(): raise RuntimeError("Batch105 file unexpectedly exists: "+str(path))
        output=[]
        for x,zh in eligible[offset:offset+50]:
            word=x["lemma"]
            candidates=[v for v in sorted(pool.get(str(x.get("pos","")),set())) if v!=word]
            if len(candidates)<3: candidates=[v for v in global_pool if v!=word]
            rng=random.Random(x["teaching_sense_id"])
            distractors=rng.sample(candidates,3)
            options=[word,*distractors]
            rng.shuffle(options)
            row={"ku_id":"staging:cg-enlex-ku-v2:"+x["teaching_sense_id"]+":recognition:01",
                 "teaching_sense_id":x["teaching_sense_id"],"rank":x["rank"],"lemma":word,"pos":x.get("pos"),
                 "ku_type":"sense_recognition","render_kind":"sense_recognition",
                 "question":"Choose the word matching this meaning: "+x["definition_en"],
                 "options":options,"response":word,"gloss_en":x["definition_en"],
                 "gloss_zh":zh[0],"gloss_zh_candidates":zh,
                 "gloss_zh_status":"SOURCE_CANDIDATE_NOT_EDITORIALLY_SELECTED",
                 "source_pack":"v93_recovered_register",
                 "qa_flags":["semantic_distractor_review_pending","cross_batch_coverage_recheck_pending","chinese_gloss_editorial_selection_pending"],
                 "draft":True,"production_ready":False,"release_eligible":False}
            assert len(set(options))==4 and word in options
            output.append(row)
        path.write_text("".join(json.dumps(x,ensure_ascii=False,separators=(",",":"))+"\n" for x in output),encoding="utf-8")
        git("add",str(path))
        git("commit","-m",f"CG-ENLEX Batch105 group {group:02d}: {len(output)} grounded draft KUs")
        git("push","origin","HEAD:experiment/enlex-v3-production-rebuild-20261030")
        print("COMMITTED",path.name,len(output),git("rev-parse","HEAD"),flush=True)
    print("DONE",len(eligible),flush=True)
if __name__=="__main__": main()
