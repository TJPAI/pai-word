#!/usr/bin/env python3
"""Train an INT8 shared query encoder from REAL teacher vectors.
No bundled/fabricated teacher outputs. Use --input validated encoding export.
Train/validation split by stable scene_id; evaluation labels are never read.
Prototype vectors are pooled teacher projections; encoded model is NOT certified.
"""
import argparse, collections, hashlib, json, math, pathlib, re
import numpy as np
def tokens(s):
 s=s.casefold()
 out=[]
 for word in re.findall(r'[\u3400-\u9fff]+|[a-z0-9]+',s):
  if re.search(r'[\u3400-\u9fff]',word):
   out.extend(word[i:i+2] for i in range(len(word)-1))
   out.extend(word[i:i+3] for i in range(len(word)-2))
  else:
   out.append(word)
   out.extend(word[i:i+3] for i in range(max(0,len(word)-2)))
 return sorted(set(out))
def features(s,buckets):
 out=collections.Counter()
 for t in tokens(s):
  h=int.from_bytes(hashlib.blake2s(t.encode(),digest_size=4).digest(),'little')
  out[h%buckets]+=1 if h&256 else -1
 mag=math.sqrt(sum(v*v for v in out.values())) or 1
 return [(i,v/mag) for i,v in out.items() if v]
def main():
 p=argparse.ArgumentParser()
 p.add_argument('--input',required=True);p.add_argument('--output',required=True)
 p.add_argument('--buckets',type=int,default=2048);p.add_argument('--dim',type=int,default=96)
 p.add_argument('--epochs',type=int,default=6);p.add_argument('--learning-rate',type=float,default=.12)
 a=p.parse_args()
 data=json.loads(pathlib.Path(a.input).read_text())
 assert data['schema']=='scene-microrec-embedding-export-v1'
 assert data['teacher']['model_id'] and data['teacher']['revision']
 items=data['vectors']; assert items and all(len(x['teacher_vector'])==data['dimension'] for x in items)
 ids=sorted({x['scene_id'] for x in items}); assert len(ids)>=2
 X=np.asarray([x['teacher_vector'] for x in items],dtype=np.float32)
 assert np.isfinite(X).all()
 # Fixed projection shared by query and scenes; deterministic without fitted leakage.
 rng=np.random.default_rng(42); proj=rng.standard_normal((X.shape[1],a.dim)).astype(np.float32)/math.sqrt(X.shape[1])
 targets=X@proj
 norms=np.maximum(np.linalg.norm(targets,axis=1,keepdims=True),1e-8);targets/=norms
 W=np.zeros((a.buckets,a.dim),dtype=np.float32)
 train=[i for i,x in enumerate(items) if int.from_bytes(hashlib.sha256(x['scene_id'].encode()).digest()[:2],'little')%10<8]
 valid=[i for i in range(len(items)) if i not in set(train)]
 assert train and valid
 for epoch in range(a.epochs):
  for idx in train:
   ff=features(items[idx]['text'],a.buckets)
   if not ff:continue
   pred=sum((W[j]*w for j,w in ff),np.zeros(a.dim,dtype=np.float32))
   error=targets[idx]-pred
   for j,w in ff:W[j]+=a.learning_rate*w*error
 def avg_error(indices):
  es=[]
  for idx in indices:
   ff=features(items[idx]['text'],a.buckets)
   if ff:
    pred=sum((W[j]*w for j,w in ff),np.zeros(a.dim,dtype=np.float32))
    pn=np.linalg.norm(pred)
    if pn>1e-8:es.append(float(np.dot(pred/pn,targets[idx])))
  return float(np.mean(es)) if es else None
 scale=float(max(np.max(np.abs(W)),1e-8)/127)
 q=np.rint(W/scale).clip(-127,127).astype(np.int8)
 prototype=[]
 for scene_id in ids:
  idx=[i for i,x in enumerate(items) if x['scene_id']==scene_id]
  v=targets[idx].mean(axis=0); v/=max(np.linalg.norm(v),1e-8)
  prototype.append(v)
 P=np.asarray(prototype,dtype=np.float32)
 pscale=float(max(np.max(np.abs(P)),1e-8)/127)
 pq=np.rint(P/pscale).clip(-127,127).astype(np.int8)
 package={'schema':'scene-microrec-int8-student-v1','teacher':data['teacher'],'source_catalog_sha256':data['source_catalog_sha256'],'hash':'blake2s-32','seed':42,'buckets':a.buckets,'dimension':a.dim,'weight_scale':scale,'prototype_scale':pscale,'scene_ids':ids,'weights_b64':__import__('base64').b64encode(q.tobytes()).decode(),'prototypes_b64':__import__('base64').b64encode(pq.tobytes()).decode(),'diagnostics':{'train_examples':len(train),'validation_examples':len(valid),'train_cosine':avg_error(train),'validation_cosine':avg_error(valid),'quality_certified':False}}
 payload=json.dumps(package,separators=(',',':')).encode()
 pathlib.Path(a.output).write_bytes(payload)
 print(json.dumps({'status':'INT8_STUDENT_TRAINED_NO_QUALITY_CERTIFICATION','model_bytes':len(payload),'limit_bytes':2000000,'validation_cosine':package['diagnostics']['validation_cosine'],'real_teacher':data['teacher']['model_id']}))
 if len(payload)>2000000:raise SystemExit('MODEL_EXCEEDS_2MB')
if __name__=='__main__':main()
