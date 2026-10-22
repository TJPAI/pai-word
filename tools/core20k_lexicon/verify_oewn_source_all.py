#!/usr/bin/env python3
"""Verify source lineage for normalized Chinese Sense drafts against OEWN 2025. No QA promotion."""
import argparse,gzip,json,collections,hashlib,pathlib
from lxml import etree

def run(draft_file,oewn_file,out_file):
    rows=[json.loads(line) for line in open(draft_file,encoding="utf-8") if line.strip()]
    ids={r["source_sense_id"] for r in rows}
    assert len(rows)==len({r["candidate_key"] for r in rows})
    matched={}; synsets={}
    with gzip.open(oewn_file,"rb") as fh:
        for _,el in etree.iterparse(fh,events=("end",),tag=("{*}LexicalEntry","{*}Synset")):
            if etree.QName(el).localname=="LexicalEntry":
                lemma=el.find("{*}Lemma")
                if lemma is not None:
                    for sense in el.findall("{*}Sense"):
                        if sense.get("id") in ids:
                            matched[sense.get("id")]=(lemma.get("writtenForm"),lemma.get("partOfSpeech"),sense.get("synset"))
            else:
                synsets[el.get("id")]=[(d.text or "").strip() for d in el.findall("{*}Definition")]
            el.clear()
    flags=collections.Counter()
    with open(out_file,"w",encoding="utf-8") as out:
        for r in rows:
            f=matched.get(r["source_sense_id"]); errors=[]
            if f is None:errors.append("MISSING_SOURCE_SENSE")
            else:
                if f[0].casefold()!=r["lemma"].casefold():errors.append("LEMMA_MISMATCH")
                if f[1]!=r["pos"]:errors.append("POS_MISMATCH")
                if r["gloss_en"].strip() not in synsets.get(f[2],[]):errors.append("GLOSS_MISMATCH")
            if not (r.get("gloss_zh_draft") or "").strip():errors.append("MISSING_ZH")
            if r.get("production_ready") or r.get("dictionary_verified"):errors.append("PREMATURE_APPROVAL")
            flags.update(errors)
            out.write(json.dumps({"candidate_key":r["candidate_key"],"source_sense_id":r["source_sense_id"],"flags":errors,"production_ready":False},ensure_ascii=False,sort_keys=True)+"\n")
    print(json.dumps({"records":len(rows),"original_sense_ids_found":len(matched),"issues":dict(flags),"independent_semantic_validation":0},indent=2))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--drafts",required=True);ap.add_argument("--oewn",required=True);ap.add_argument("--out",required=True)
    a=ap.parse_args();run(a.drafts,a.oewn,a.out)
