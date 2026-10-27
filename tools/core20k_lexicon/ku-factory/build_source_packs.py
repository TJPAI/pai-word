#!/usr/bin/env python3
"""Fail-closed Core20K runtime inventory and 40 rank-based KU source packs."""
import argparse, gzip, hashlib, json, pathlib, sys, collections
P=pathlib.Path
EXPECTED_SHA="e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b"
def sha(b): return hashlib.sha256(b).hexdigest()
def get(d,keys):
    if not isinstance(d,dict):return None
    for k in keys:
        if k in d and d[k] is not None:return d[k]
    return None
def scan(root):
    candidates=[]
    def visit(x,path,depth):
        if depth>4:return
        if isinstance(x,list):
            if len(x)==20000 and all(isinstance(y,dict) for y in x[:30]):candidates.append((path,x))
        elif isinstance(x,dict):
            for k,v in x.items():
                if isinstance(v,(list,dict)):visit(v,path+"."+str(k),depth+1)
    visit(root,"$",0)
    return candidates
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--runtime",default="data/core20k-runtime.json.gz")
    ap.add_argument("--out",default="tools/core20k_lexicon/ku-factory/source-packs/b500")
    ap.add_argument("--allow-runtime-sha-change",action="store_true")
    a=ap.parse_args()
    base=P(a.out);base.mkdir(parents=True,exist_ok=True)
    raw=P(a.runtime).read_bytes();digest=sha(raw)
    report={"runtime_path":a.runtime,"runtime_size":len(raw),"runtime_sha256":digest,
            "expected_runtime_sha256":EXPECTED_SHA,"sha_match":digest==EXPECTED_SHA}
    def fail(msg):
        report["status"]="BLOCKED";report["error"]=msg
        (base/"source_qa_report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
        print(json.dumps(report,ensure_ascii=False,default=str)[:12000],file=sys.stderr)
        sys.exit(msg)
    if digest!=EXPECTED_SHA and not a.allow_runtime_sha_change:fail("RUNTIME_SHA256_MISMATCH")
    try:root=json.loads(gzip.decompress(raw))
    except Exception as e:fail("RUNTIME_PARSE_FAIL "+str(e))
    report["root_type"]=type(root).__name__
    report["root_keys"]=list(root)[:60] if isinstance(root,dict) else []
    candidates=scan(root)
    report["arrays_of_20000"]=[p for p,_ in candidates]
    if len(candidates)!=1:fail("AMBIGUOUS_HEADWORD_ARRAY_COUNT "+str(len(candidates)))
    path,words=candidates[0]
    rankkeys=("core20k_rank_final","rank","frequency_rank")
    idkeys=("headword_id","word_id")
    lemma_keys=("lemma","headword","word")
    keyed=[];missing=collections.Counter()
    for pos,w in enumerate(words):
        r=get(w,rankkeys);hid=get(w,idkeys);lemma=get(w,lemma_keys)
        if isinstance(r,bool) or not isinstance(r,int):missing["rank"]+=1
        if not isinstance(hid,(str,int)) or not str(hid):missing["headword_id"]+=1
        if not isinstance(lemma,str) or not lemma.strip():missing["lemma"]+=1
        keyed.append((r,hid,lemma,w))
    report["missing_or_invalid_fields"]=dict(missing)
    if missing:fail("MISSING_REQUIRED_WORD_FIELDS")
    ranks=[r for r,_,_,_ in keyed];ids=[str(h) for _,h,_,_ in keyed]
    report.update(headword_count=len(words),unique_ranks=len(set(ranks)),unique_headword_ids=len(set(ids)),runtime_array=path)
    if sorted(ranks)!=list(range(1,20001)) or len(set(ids))!=20000:fail("RANK_OR_HEADWORD_ID_COVERAGE_FAIL")
    keyed.sort(key=lambda x:x[0])
    explicit_sense_keys=("senses","sense_records")
    explicit_ku_keys=("kus","knowledge_units","ku_records")
    counts=collections.Counter()
    records=[]
    for r,h,lemma,w in keyed:
        s=get(w,explicit_sense_keys); ku=get(w,explicit_ku_keys)
        senses=[];kus=[]
        if isinstance(s,list):
            for x in s:
                if isinstance(x,dict):
                    sid=get(x,("sense_id",))
                    status="existing_identified_sense" if sid is not None and str(sid) else "unidentified_sense_candidate"
                    senses.append({"status":status,"source_record":x})
                    counts[status]+=1
        if isinstance(ku,list):
            for x in ku:
                if isinstance(x,dict):
                    kid=get(x,("ku_id",))
                    status="existing_identified_ku" if kid is not None and str(kid) else "unidentified_ku_candidate"
                    kus.append({"status":status,"source_record":x})
                    counts[status]+=1
        if not senses:counts["headwords_missing_explicit_sense"]+=1
        records.append({"rank":r,"headword_id":h,"lemma":lemma,"pos":get(w,("pos","part_of_speech")),
                        "sense_status":"existing_identified" if any(x["status"]=="existing_identified_sense" for x in senses) else "unverified_or_missing",
                        "senses":senses,"kus":kus,"source_record":w})
    report["sense_ku_inventory"]=dict(counts)
    manifest={"schema":"enlex-ku-source-packs-v1","source_runtime_sha256":digest,
              "runtime_array":path,"batch_size":500,"total_headwords":20000,"packs":[]}
    for i in range(40):
        subset=records[i*500:(i+1)*500];n=i+1
        data={"schema":"enlex-ku-source-pack-v1","task_id":f"{n:03d}","runtime_sha256":digest,
              "rank_start":i*500+1,"rank_end":(i+1)*500,"headword_count":500,
              "sense_identity_policy":"Only explicit source sense_id is existing; all others are unverified",
              "words":subset}
        b=(json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(",",":"))+"\n").encode()
        name=f"source_{n:03d}.json";(base/name).write_bytes(b)
        manifest["packs"].append({"task_id":f"{n:03d}","path":name,
                                   "rank_start":i*500+1,"rank_end":(i+1)*500,
                                   "headwords":500,"sha256":sha(b)})
    (base/"source_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    report["status"]="PASS_SOURCE_HEADWORDS_ONLY" if counts["headwords_missing_explicit_sense"] else "PASS_SOURCE_WITH_EXPLICIT_SENSES"
    report["packs_written"]=40
    (base/"source_qa_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
