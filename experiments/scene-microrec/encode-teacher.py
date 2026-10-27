#!/usr/bin/env python3
"""Optional offline teacher embedding. Does NOT run in normal GitHub CI.
Requires explicitly installed sentence-transformers and locally available weights.
Writes real vectors only if a real teacher is successfully loaded."""
import argparse, hashlib, json, pathlib
def main():
 p=argparse.ArgumentParser();p.add_argument("--jobs",required=True);p.add_argument("--model",required=True);p.add_argument("--revision",required=True);p.add_argument("--output",required=True);p.add_argument("--license",required=True);a=p.parse_args()
 from sentence_transformers import SentenceTransformer
 jobs=json.loads(pathlib.Path(a.jobs).read_text())
 assert jobs["schema"]=="scene-microrec-teacher-jobs-v1"
 assert jobs["status"]=="UNENCODED_NO_TEACHER_USED"
 assert jobs["task_count"]==len(jobs["tasks"])
 model=SentenceTransformer(a.model,revision=a.revision)
 queries=[("query: " if x["kind"]=="example" else "passage: ")+x["text"] for x in jobs["tasks"]]
 vectors=model.encode(queries,batch_size=32,normalize_embeddings=True,show_progress_bar=True)
 data={"schema":"scene-microrec-embedding-export-v1","teacher":{"family":"multilingual-e5","model_id":a.model,"revision":a.revision,"license":a.license},"source_catalog_sha256":jobs["catalog_sha256"],"dimension":int(vectors.shape[1]),"vectors":[{"scene_id":x["scene_id"],"kind":x["kind"],"text":x["text"],"teacher_vector":[float(v) for v in vec]} for x,vec in zip(jobs["tasks"],vectors)]}
 pathlib.Path(a.output).write_text(json.dumps(data,ensure_ascii=False,separators=(",",":")))
 print(json.dumps({"status":"REAL_ENCODINGS_WRITTEN","count":len(data["vectors"]),"dimension":data["dimension"],"sha256":hashlib.sha256(pathlib.Path(a.output).read_bytes()).hexdigest()}))
if __name__=="__main__":main()
