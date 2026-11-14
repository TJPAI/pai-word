#!/usr/bin/env python3
"""V112: source-only Kaikki IPA enrichment for V110/V111 author card JSON(L).
Does not infer pronunciations, merge senses, or certify cards.
Usage: python build_v112_kaikki_ipa.py --cards cards.jsonl.gz --kaikki kaikki-en.jsonl.gz --out v112
"""
import argparse,collections,gzip,hashlib,json,pathlib,unicodedata
def opener(p,mode='rt'):
 return gzip.open(p,mode,encoding='utf-8') if str(p).endswith('.gz') else open(p,mode,encoding='utf-8')
def norm(x):return ' '.join(unicodedata.normalize('NFKC',str(x or '')).casefold().split())
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1<<20),b''):h.update(b)
 return h.hexdigest()
def rows(path):
 with opener(path) as f:
  if str(path).endswith(('.jsonl','.jsonl.gz')):
   for line in f:
    if line.strip():yield json.loads(line)
  else:
   val=json.load(f)
   if isinstance(val,list):yield from val
   elif isinstance(val,dict):
    for key in ('cards','rows','records','items','projections'):
     if isinstance(val.get(key),list):yield from val[key];return
    raise ValueError('No known card array: explicit conversion required')
def spelling(row):
 for k in ('english_expression','expression','word','target_expression'):
  if isinstance(row.get(k),str) and row[k].strip():return row[k]
 for p in ('question_page','answer_page'):
  v=row.get(p)
  if isinstance(v,dict):
   for k in ('english_expression','expression','word'):
    if isinstance(v.get(k),str) and v[k].strip():return v[k]
 return None
def pronunciations(row):
 out=[]
 # Kaikki native JSONL: sounds is an array; ipa must be an explicit native field
 for s in row.get('sounds') or []:
  if isinstance(s,dict) and isinstance(s.get('ipa'),str) and s['ipa'].strip():
   out.append({'ipa':s['ipa'].strip(),'tags':s.get('tags') or [],'audio':{k:s[k] for k in ('audio','ogg_url','mp3_url','wav_url') if isinstance(s.get(k),str)}})
 return out
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cards',required=True);ap.add_argument('--kaikki',required=True,nargs='+');ap.add_argument('--out',required=True);a=ap.parse_args()
 output=pathlib.Path(a.out);output.mkdir(parents=True,exist_ok=True)
 cardlist=list(rows(a.cards)); targets={norm(spelling(c)) for c in cardlist if spelling(c)}
 matched=collections.defaultdict(list); source={}
 for path in a.kaikki:
  p=pathlib.Path(path);ph=sha(p);source[p.name]=ph
  with opener(p) as f:
   for ln,line in enumerate(f,1):
    if not line.strip():continue
    obj=json.loads(line);w=norm(obj.get('word'))
    if w not in targets:continue
    for x in pronunciations(obj):
     item={**x,'kaikki_word':obj['word'],'kaikki_pos':obj.get('pos'),'source_file':p.name,'source_sha256':ph,'source_line':ln}
     key=(x['ipa'],tuple(x['tags']),obj.get('pos'))
     if all((z['ipa'],tuple(z['tags']),z['kaikki_pos'])!=key for z in matched[w]):matched[w].append(item)
 out=output/'CGMASTER_V112_KAIKKI_IPA_CANDIDATES.jsonl.gz';c=collections.Counter();scenes=collections.defaultdict(lambda:collections.Counter())
 with opener(out,'wt') as f:
  for i,row in enumerate(cardlist,1):
   word=spelling(row);sc=row.get('scene_id') or 'UNSPECIFIED';options=matched.get(norm(word),[])
   existing=row.get('ipa') or ((row.get('question_page') or {}).get('ipa') if isinstance(row.get('question_page'),dict) else None)
   status='EXISTING_IPA_PRESERVED' if existing else ('KAIKKI_NATIVE_IPA_CANDIDATES_UNSELECTED' if options else 'NO_NATIVE_IPA_MATCH')
   record={'input_row':i,'scene_id':sc,'source_row_id':row.get('final_source_row') or row.get('source_final_row'),'source_sense_id':row.get('sense_id') or row.get('source_sense_id'),'expression':word,'existing_ipa_unchanged':existing,'candidate_ipa':options,'status':status,'selected_ipa':existing,'automatic_ipa_authorization':False,'release_allowed':False}
   f.write(json.dumps(record,ensure_ascii=False)+'\\n');c[status]+=1;scenes[sc][status]+=1
 report={'version':'V112','kind':'NATIVE_KAIKKI_IPA_CANDIDATES_ONLY','input_card_sha256':sha(a.cards),'input_card_count':len(cardlist),'kaikki_sources_sha256':source,'counts':dict(c),'per_scene':{s:dict(v) for s,v in sorted(scenes.items())},'candidate_file_sha256':sha(out),'candidate_file_bytes':out.stat().st_size,'certified':0,'release_allowed':False,'notes':['Exact headword evidence is not sense or pronunciation approval','Native IPA only, no fabricated transliteration or TTS','Existing IPA preserved; homographs, accents and POS remain unselected','Source card rows immutable']}
 rp=output/'CGMASTER_V112_KAIKKI_IPA_REPORT.json';rp.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'counts':dict(c),'candidates_sha256':report['candidate_file_sha256'],'report_sha256':sha(rp)},ensure_ascii=False))
if __name__=='__main__':main()
