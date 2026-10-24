#!/usr/bin/env python3
"""Prepare Pages staging from pinned Muse V1.6 runtime ZIP. No model binary in Git."""
import argparse,hashlib,pathlib,shutil,tempfile,zipfile
EXPECTED='a0fc661f36744764e466010d11885465732e2306f580c9e3ddc190bb91a181d5'
INDEX='eae39123c0f21800990bb68468331de95f1b45e8a7ed086598ac62959e680254'
MODEL='f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193'
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def build(src,out):
 src=pathlib.Path(src);out=pathlib.Path(out)
 if sha(src)!=EXPECTED:raise ValueError('ZIP SHA-256 mismatch')
 with tempfile.TemporaryDirectory() as td:
  tmp=pathlib.Path(td)
  with zipfile.ZipFile(src) as z:
   for entry in z.infolist():
    p=pathlib.PurePosixPath(entry.filename)
    if p.is_absolute() or '..' in p.parts:raise ValueError('Unsafe ZIP path')
    if entry.filename.startswith('runtime/'):
     dest=tmp.joinpath(*p.parts)
     if entry.is_dir():dest.mkdir(parents=True,exist_ok=True)
     else:
      dest.parent.mkdir(parents=True,exist_ok=True)
      with z.open(entry) as f,open(dest,'wb') as w:shutil.copyfileobj(f,w)
  rt=tmp/'runtime'
  if sha(rt/'assets/scene500-c2-index.json')!=INDEX:raise ValueError('Index SHA mismatch')
  if sha(rt/'models/multilingual-e5-small/onnx/model_quantized.onnx')!=MODEL:raise ValueError('Model SHA mismatch')
  if out.exists():shutil.rmtree(out)
  shutil.copytree(rt,out)
  print('PASS verified staging',out,'bytes',sum(p.stat().st_size for p in out.rglob('*') if p.is_file()))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('zip');ap.add_argument('output');a=ap.parse_args();build(a.zip,a.output)
