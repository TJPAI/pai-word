#!/usr/bin/env python3
"""Validate and safely extract Muse multilingual E5 ZIP. Standard library only."""
import argparse, hashlib, json, pathlib, zipfile
FILES = {
 "config.json", "tokenizer.json", "tokenizer_config.json",
 "special_tokens_map.json", "onnx/model_quantized.onnx"
}
def sha256(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
 return h.hexdigest()
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("zip",type=pathlib.Path)
 ap.add_argument("--dest",type=pathlib.Path,default=pathlib.Path("e5-local"))
 ns=ap.parse_args()
 with zipfile.ZipFile(ns.zip) as z:
  items=[i for i in z.infolist() if not i.is_dir()]
  names=[pathlib.PurePosixPath(i.filename) for i in items]
  for n in names:
   if n.is_absolute() or ".." in n.parts:
    raise ValueError("Unsafe ZIP member path")
  if len(names)!=len(set(names)):raise ValueError("Duplicate ZIP members")
  if set(str(n) for n in names)!=set("multilingual-e5-small/"+x for x in FILES):
   raise ValueError("Unexpected file list: "+repr(sorted(map(str,names))))
  if z.testzip() is not None:raise ValueError("Corrupt ZIP")
  for i in items:
   p=ns.dest / i.filename
   p.parent.mkdir(parents=True,exist_ok=True)
   with z.open(i) as source, p.open("wb") as dest:
    while True:
     data=source.read(1024*1024)
     if not data:break
     dest.write(data)
  for name in FILES:
   if name.endswith(".json"):
    json.loads((ns.dest/"multilingual-e5-small"/name).read_text())
  info=[{"name":str(n),"bytes":(ns.dest/n).stat().st_size,
         "sha256":sha256(ns.dest/n)} for n in names]
 manifest={"model":"Xenova/multilingual-e5-small","zip_sha256":sha256(ns.zip),
           "file_count":len(info),"files":info,
           "runtime_inference_tested":False}
 out=ns.dest/"model-file-manifest.json"
 out.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
 print(json.dumps({"pass":True,"zip_sha256":manifest["zip_sha256"],
                   "files":len(info),"manifest":str(out),
                   "inference_tested":False},ensure_ascii=False,indent=2))
if __name__=="__main__": main()
