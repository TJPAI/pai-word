#!/usr/bin/env python3
"""V62 experimental cross-lingual semantic triage. NOT a semantic certification."""
import json, pathlib, statistics, hashlib
import numpy as np
from sentence_transformers import SentenceTransformer
base=pathlib.Path("v59_import/candidates.jsonl")
rows=[json.loads(x) for x in base.read_text(encoding="utf8").splitlines() if x.strip()]
assert len(rows)==200 and len({r["teaching_sense_id"] for r in rows})==200
model_id="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
model=SentenceTransformer(model_id,device="cpu")
source=[r["definition_en"] for r in rows]
target=[r["gloss_zh_machine_candidate"] for r in rows]
se=model.encode(source,batch_size=24,normalize_embeddings=True,show_progress_bar=False)
te=model.encode(target,batch_size=24,normalize_embeddings=True,show_progress_bar=False)
scores=np.sum(se*te,axis=1).tolist()
order=sorted(range(200),key=lambda i:scores[i])
out=[]
for i,r in enumerate(rows):
    x={k:r[k] for k in ("teaching_sense_id","rank","lemma","pos","definition_en","gloss_zh_machine_candidate")}
    x.update({"crosslingual_cosine":round(scores[i],5),"model":model_id,"risk_rank":order.index(i)+1,"semantic_certified":False,"production_ready":False})
    out.append(x)
p=pathlib.Path("v62_results");p.mkdir(exist_ok=True)
body="".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out)
(p/"semantic_triage_200.jsonl").write_text(body,encoding="utf8")
report={"input_count":len(rows),"cosine_median":round(statistics.median(scores),5),"cosine_min":round(min(scores),5),"cosine_max":round(max(scores),5),"output_sha256":hashlib.sha256(body.encode()).hexdigest(),"method":"bilingual sentence embedding cosine; rank for review only; no gold accuracy established","semantic_certified":0,"machine_candidate_count":200}
(p/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
print("REPORT",json.dumps(report));print("LOWEST",json.dumps([out[i] for i in order[:10]],ensure_ascii=False))
