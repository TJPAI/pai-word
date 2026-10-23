#!/usr/bin/env python3
"""Non-destructive external frequency overlay for PAI Word Chinese Core20K.
Usage: python scripts/zh_core20k_frequency_overlay.py MASTER.json FREQ.csv OUTDIR --term-column Word --count-column WCount
Accepts UTF-8 csv/tsv. Does not infer general frequency from input order.
"""
import argparse,csv,hashlib,json,pathlib,collections,datetime
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument("master");p.add_argument("frequency_table");p.add_argument("outdir");p.add_argument("--term-column",required=True);p.add_argument("--count-column",required=True);p.add_argument("--document-frequency-column");p.add_argument("--source-id",default="SUBTLEX-CH");p.add_argument("--source-uri",default="https://doi.org/10.1371/journal.pone.0010729");a=p.parse_args()
 root=pathlib.Path(a.outdir);root.mkdir(parents=True,exist_ok=True)
 data=json.loads(pathlib.Path(a.master).read_text(encoding="utf-8"));records=data["records"];assert len(records)==20000 and len({r["term_id"] for r in records})==20000
 assert all(r["term_id"]=="zh_"+hashlib.sha256(r["term"].encode()).hexdigest()[:20] for r in records)
 freq={};duplicates=[];invalid=0
 with open(a.frequency_table,encoding="utf-8-sig",newline="") as f:
  sample=f.read(8192);f.seek(0);dialect=csv.excel_tab if "\t" in sample.splitlines()[0] else csv.excel
  rd=csv.DictReader(f,dialect=dialect)
  needed=[a.term_column,a.count_column]+([a.document_frequency_column] if a.document_frequency_column else [])
  if not set(needed).issubset(rd.fieldnames or []): raise ValueError(f"Missing columns {needed}; available: {rd.fieldnames}")
  for row in rd:
   term=row[a.term_column].strip()
   try: count=float(row[a.count_column]);assert count>=0
   except (ValueError,AssertionError,TypeError): invalid+=1;continue
   if not term:invalid+=1;continue
   df=None
   if a.document_frequency_column:
    try:df=float(row[a.document_frequency_column])
    except (ValueError,TypeError):pass
   if term in freq:duplicates.append(term);continue
   freq[term]=(count,df)
 if duplicates:raise ValueError(f"Duplicate source terms require resolution, e.g. {duplicates[:10]}")
 results=[];matched=0
 for r in records:
  v=freq.get(r["term"]);matched+=v is not None
  results.append({"term_id":r["term_id"],"term":r["term"],"source_id":a.source_id if v else None,"source_token_count":v[0] if v else None,"source_document_frequency":v[1] if v else None,"source_rank":None,"general_frequency_rank":None,"general_frequency_score":None,"match_type":"exact" if v else "unmatched"})
 # Rank all distinct positive source frequencies; ties get the same rank.
 counts=sorted({v[0] for v in freq.values() if v[0]>0},reverse=True);ranks={v:i+1 for i,v in enumerate(counts)}
 for row in results:
  if row["source_token_count"] is not None:row["source_rank"]=ranks.get(row["source_token_count"])
 out=root/"frequency-evidence-overlay.json";out.write_text(json.dumps({"schema_version":"1.0","source_id":a.source_id,"source_uri":a.source_uri,"scope":"source-specific; NOT general corpus frequency","records":results},ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
 qa={"status":"external_evidence_only_unfrozen","master_sha256":sha(a.master),"source_sha256":sha(a.frequency_table),"master_count":len(records),"distinct_source_terms":len(freq),"matched_terms":matched,"unmatched_terms":len(records)-matched,"invalid_source_rows":invalid,"source_frequency_ranked":sum(x["source_rank"] is not None for x in results),"general_frequency_rank_populated":0,"member_changes":0,"term_id_changes":0,"source_uri":a.source_uri,"overlay_sha256":sha(out),"warning":"Exact-form matching only. Source-specific counts are not cross-domain ranks; segmentation and usage rights must be independently audited."}
 (root/"frequency-evidence-QA.json").write_text(json.dumps(qa,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(qa,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
