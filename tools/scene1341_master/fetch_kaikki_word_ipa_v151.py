#!/usr/bin/env python3
"""CG-MASTER V151: obtain Kaikki per-headword raw Wiktextract JSONL, preserve provenance,
and build a test-only IPA overlay. Never equate headword pronunciation with Sense approval.

Usage:
 python tools/scene1341_master/fetch_kaikki_word_ipa_v151.py \
   --cards scene_cards.json --out-dir ipa_v151 --workers 6
Optionally --cache-dir may contain previously fetched <sha256(word)>.jsonl files.
Network errors stay FETCH_FAILED, not MISSING_IPA. Formal release remains false.
"""
import argparse, concurrent.futures, hashlib, json, pathlib, time, unicodedata, urllib.error, urllib.parse, urllib.request
from collections import Counter,defaultdict

BASE="https://kaikki.org/dictionary/English/meaning/"
UA="PAI-Word-CG-MASTER/1.0 (Kaikki original-JSONL IPA attribution, noncommercial research)"
def norm(s):
    return unicodedata.normalize("NFKC",str(s or "")).strip().casefold()
def source_url(word):
    # The per-word .jsonl link is published beside the 'raw wiktextract data' panel.
    # Use literal first letters, preserving case for case-sensitive filesystem paths.
    prefix=urllib.parse.quote(word[:1],safe="")
    prefix2=urllib.parse.quote(word[:2],safe="")
    slug=urllib.parse.quote(word,safe="")
    return BASE+prefix+"/"+prefix2+"/"+slug+".jsonl"
def get_raw(word,cache_dir,retries):
    cache=cache_dir/(hashlib.sha256(word.encode("utf8")).hexdigest()+".jsonl")
    url=source_url(word)
    if cache.is_file():
        data=cache.read_bytes()
    else:
        for attempt in range(retries+1):
            try:
                with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=35) as resp:
                    data=resp.read(2_500_001)
                    if len(data)>2_500_000: raise ValueError("word JSONL exceeds safe limit")
                cache.write_bytes(data)
                break
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                if attempt==retries:return {"word":word,"url":url,"status":"FETCH_FAILED","error":str(e)}
                time.sleep(2**attempt)
    digest=hashlib.sha256(data).hexdigest()
    try:
        entries=[json.loads(line) for line in data.decode("utf-8").splitlines() if line.strip()]
        entries=[row for row in entries if row.get("lang_code")=="en" and row.get("word")==word]
    except (ValueError,UnicodeDecodeError) as e:
        return {"word":word,"url":url,"status":"PARSE_FAILED","error":str(e),"sha256":digest}
    choices=[]
    for row in entries:
        pos=row.get("pos")
        for snd in row.get("sounds",[]) or []:
            ipa=snd.get("ipa")
            if not isinstance(ipa,str) or not ipa.strip():continue
            # Preserve native variant tags and audio; never synthesize a reading.
            entry={"ipa":ipa.strip(),"pos":pos,"tags":snd.get("tags") or [],
                   "raw_tags":snd.get("raw_tags") or [],
                   "audio":{k:snd[k] for k in ("audio","ogg_url","mp3_url","wav_url") if snd.get(k)},
                   "source_url":url,"source_raw_sha256":digest}
            if entry not in choices:choices.append(entry)
    return {"word":word,"url":url,"status":"FETCHED" if entries else "NO_EXACT_ENGLISH_ENTRY",
            "sha256":digest,"native_entry_count":len(entries),"native_ipa_candidates":choices}
def build(args):
    source=pathlib.Path(args.cards); raw=source.read_bytes(); doc=json.loads(raw)
    if not isinstance(doc,dict) or not isinstance(doc.get("records"),list):
        raise ValueError("Need Scene1341 JSON with records")
    originals=doc["records"]
    words={r["question_page"]["english_expression"].strip() for r in originals if r.get("question_page",{}).get("english_expression")}
    cache_dir=pathlib.Path(args.cache_dir) if args.cache_dir else pathlib.Path(args.out_dir)/"raw_word_cache"
    cache_dir.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        results=list(executor.map(lambda w:get_raw(w,cache_dir,args.retries),sorted(words)))
    source_by_word={r["word"]:r for r in results}
    report=Counter(); changes=[]; unresolved=[]; records=[]
    for r in originals:
        # Deep copy: never write into the source file.
        card=json.loads(json.dumps(r,ensure_ascii=False))
        q=card["question_page"];w=q["english_expression"].strip()
        ev=source_by_word[w];candidates=ev.get("native_ipa_candidates") or []
        q["ipa_candidates_raw"]=candidates
        q["ipa_source_status"]=ev["status"]
        q["ipa_source_url"]=ev["url"]
        q["ipa_source_raw_sha256"]=ev.get("sha256")
        original=q.get("ipa")
        distinct=sorted({c["ipa"] for c in candidates})
        if original:
            q["ipa_status"]="EXISTING_PRESERVED_UNMODIFIED"
            report["existing_preserved"]+=1
        elif ev["status"]!="FETCHED":
            q["ipa_status"]=ev["status"];report[ev["status"]]+=1
        elif len(distinct)==1 and distinct[0].startswith("/") and distinct[0].endswith("/"):
            # A single pronunciation across all observed POS may be shown in test,
            # but is NOT a certified alignment to the Master Sense.
            q["ipa"]=distinct[0];q["ipa_status"]="NATIVE_SINGLE_READING_TEST_ONLY"
            q["ipa_evidence"]={"source":"Kaikki individual raw wiktextract JSONL",
                 "url":ev["url"],"sha256":ev["sha256"],
                 "variant_tags_preserved":True,"sense_approved":False,"test_only":True}
            q["content_complete"]=True
            report["test_ipa_added"]+=1
            changes.append({"source_final_row":card.get("source_final_row"),"record_id":card.get("record_id"),
                            "word":w,"ipa":distinct[0],"source_raw_sha256":ev["sha256"]})
        elif not candidates:
            q["ipa_status"]="NO_NATIVE_IPA_AT_EXACT_HEADWORD";report["no_native_ipa"]+=1
        else:
            q["ipa_status"]="MULTIPLE_OR_NONPHONEMIC_UNSELECTED";report["variant_unselected"]+=1
            unresolved.append({"source_final_row":card.get("source_final_row"),"word":w,"ipa_variants":distinct})
        card["release_allowed"]=False
        records.append(card)
    out=pathlib.Path(args.out_dir);out.mkdir(parents=True,exist_ok=True)
    patch=out/"CGMASTER_V151_QUESTION_IPA_TEST_OVERLAY.json"
    patch.write_text(json.dumps({**{k:v for k,v in doc.items() if k!="records"},
         "version":"V151","source_cards_sha256":hashlib.sha256(raw).hexdigest(),"records":records,
         "test_only":True,"release_allowed":False},ensure_ascii=False,indent=2)+"\n")
    report_data={"version":"V151","kind":"NATIVE_KAIKKI_PER_WORD_QUESTION_IPA",
        "source_card_sha256":hashlib.sha256(raw).hexdigest(),
        "output_sha256":hashlib.sha256(patch.read_bytes()).hexdigest(),
        "source_url_template":BASE+"{first}/{first2}/{headword}.jsonl",
        "distinct_words":len(words),"total_cards":len(records),"counts":dict(report),
        "source_word_evidence":results,"new_test_ipa":changes,"unselected_variants":unresolved,
        "rules":["Never guess IPA", "Exactly one phonemic IPA across all POS permits TEST_ONLY display",
                 "Multiple readings remain unselected, preserving tags and source URLs",
                 "Source raw JSONL cached with per-word SHA256","Formal Sense/QA/release always deferred"],
        "independent_qa_certified":0,"canonical_sense_certified":0,"release_allowed":False}
    (out/"CGMASTER_V151_IPA_EVIDENCE_REPORT.json").write_text(json.dumps(report_data,ensure_ascii=False,indent=2)+"\n")
    assert len(records)==len(originals)
    assert all(a.get("record_id")==b.get("record_id") and a.get("answer_page")==b.get("answer_page")
               for a,b in zip(records,originals))
    print(json.dumps({"cards":len(records),"unique_words":len(words),"counts":dict(report)},ensure_ascii=False))
if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--cards",required=True)
    ap.add_argument("--out-dir",required=True)
    ap.add_argument("--cache-dir")
    ap.add_argument("--workers",type=int,default=6)
    ap.add_argument("--retries",type=int,default=2)
    a=ap.parse_args()
    if not 1<=a.workers<=12:ap.error("workers must be 1..12")
    build(a)
