#!/usr/bin/env python3
"""Batch evidence production for all KU-empty lexical headwords; never manufacture certified Senses.
One ECDICT download and indexed OEWN lookup, streaming JSONL and explicit QA.
"""
import csv,gzip,io,json,pathlib,urllib.request,collections,hashlib,re
import wn
out=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch-all")
out.mkdir(parents=True,exist_ok=True)
raw=pathlib.Path("data/core20k-runtime.json.gz").read_bytes()
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:words=json.load(f)["headwords"]
assert len(words)==20000 and [w[0] for w in words]==list(range(1,20001))
struct=("pron.","det.","conj.","prep.","aux.","modal","interj.")
target=[]
for w in words:
 rank,lemma,pos,ipa,kus,*_=w
 if not kus and not any(k in str(pos).lower() for k in struct):target.append(w)
assert len(target)>6000
byword={w[1].casefold():w for w in target}
url="https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
req=urllib.request.Request(url,headers={"User-Agent":"PAIWord-Lexicon-Research/1.0"})
dictrows={}
with urllib.request.urlopen(req,timeout=180) as response:
 reader=csv.DictReader(io.TextIOWrapper(response,encoding="utf-8-sig",errors="replace",newline=""))
 for row in reader:
  word=str(row.get("word","")).casefold()
  if word in byword and word not in dictrows:dictrows[word]=row
lex=wn.Wordnet(lexicon="oewn:2025")
stats=collections.Counter();seen=set()
with (out/"missing_lexical_sense_evidence.jsonl").open("w",encoding="utf8") as f:
 for rank,lemma,pos,ipa,kus,*_ in target:
  row=dictrows.get(lemma.casefold(),{})
  en=str(row.get("definition") or "").strip();zh=str(row.get("translation") or "").strip()
  external=[];ids=set()
  for word in lex.words(lemma):
   for sense in word.senses():
    if sense.id in ids:continue
    ids.add(sense.id);syn=sense.synset()
    if syn.definition():external.append({"oewn_sense_id":sense.id,"pos":syn.pos,"gloss_en":syn.definition()})
  flags=[]
  if not external:flags.append("NO_OEWN_SENSE")
  if not zh:flags.append("NO_ECDICT_CHINESE")
  if not en:flags.append("NO_ECDICT_ENGLISH")
  if len(external)>1:flags.append("MULTIPLE_ENGLISH_SENSES")
  if "\n" in zh or ";" in zh or "；" in zh:flags.append("MULTIPLE_CHINESE_ENTRIES")
  if lemma.casefold() in ("an","eta"):flags.append("KNOWN_HOMOGRAPH_FALSE_MATCH")
  x={"rank":rank,"lemma":lemma,"headword_id":f"core20k:rank:{rank}",
   "frozen_pos":pos,"ecdict_definition_en_wordlevel":en,"ecdict_translation_zh_wordlevel":zh,
   "oewn_sense_candidates":external,"flags":flags,"canonical_sense_id":None,
   "review_status":"SOURCE_EVIDENCE_PENDING_SENSE_SPECIFIC_BILINGUAL_QA",
   "release_eligible":False,"production_ready":False}
  f.write(json.dumps(x,ensure_ascii=False)+"\n")
  stats["headwords"]+=1;stats["oewn_matched"]+=bool(external);stats["ecdict_bilingual"]+=bool(en and zh)
  stats["oewn_sense_candidates"]+=len(external)
  for flag in flags:stats["flag:"+flag]+=1
  assert rank not in seen;seen.add(rank)
assert stats["headwords"]==len(target) and len(seen)==len(target)
manifest={"scope":"all blank-KU nonstructural frozen headwords","frozen_sha256":hashlib.sha256(raw).hexdigest(),
"stats":dict(stats),"certified_sense":0,"certified_ku":0,"wordlevel_zh_is_not_sense_translation":True}
(out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print("V21_ALL_EMPTY_BATCH_PASS",json.dumps(manifest,ensure_ascii=False))
