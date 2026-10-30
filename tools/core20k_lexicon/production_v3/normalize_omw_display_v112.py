#!/usr/bin/env python3
"""Source-preserving OMW lexeme display draft normalization. Never semantic-certify."""
import json,sys,re,collections
src,out=sys.argv[1:3]
counts=collections.Counter()
def transform(s):
 for m,k in [('+的人','PERSON'),('+的','ADJ'),('+地','ADV')]:
  if s.endswith(m) and s.count('+')==1:return s.replace(m,m[1:]),'DISPLAY_DRAFT_'+k
 return s,'REVIEW_COMPLEX_MARKER' if '+' in s else 'NO_CHANGE'
with open(src,encoding='utf8') as f,open(out,'w',encoding='utf8') as g:
 for line in f:
  row=json.loads(line);results=[]
  for lexeme in row['chinese_lexemes']:
   display,status=transform(lexeme);counts[status]+=1
   results.append({'source_lexeme':lexeme,'display_candidate':display,'status':status,'certified_gloss':False})
  row['normalized_lexemes']=results
  row['gloss_zh_status']='SOURCE_LINKED_DISPLAY_DRAFT_NOT_CERTIFIED'
  row['production_ready']=False
  g.write(json.dumps(row,ensure_ascii=False)+'\n')
print(dict(counts))
