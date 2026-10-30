#!/usr/bin/env python3
"""Upload and verify V179 frozen Sense JSONL shards. Requires GITHUB_TOKEN.
Usage: python upload_v179_shards.py /path/to/core20k_v179_persistence_shards.zip
This does not modify Runtime. Uses content-addressed verification and refuses conflicts.
"""
import hashlib, json, os, sys, time, urllib.request, urllib.error, zipfile, base64
repo="TJPAI/pai-word"
branch="experiment/enlex-v3-production-rebuild-20261030"
root="tools/core20k_lexicon/production_v3/editorial/v179_persistence/"
token=os.environ["GITHUB_TOKEN"]
def api(method,path,data=None):
    url="https://api.github.com/repos/"+repo+"/"+path
    body=json.dumps(data).encode() if data is not None else None
    req=urllib.request.Request(url,body,headers={"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},method=method)
    for trial in range(5):
        try:
            with urllib.request.urlopen(req,timeout=45) as f:return json.load(f)
        except urllib.error.HTTPError as exc:
            if exc.code not in (429,500,502,503,504):raise
        time.sleep(2**trial)
    raise RuntimeError("GitHub API retry exhausted: "+path)
def main(source):
    with zipfile.ZipFile(source) as z:
        m=json.loads(z.read("manifest.json"))
        names=sorted(n for n in z.namelist() if n.startswith("shards/") and n.endswith(".jsonl"))
        assert len(names)==9
        for name in names:
            raw=z.read(name)
            expected=m.get(name,{})
            assert len(raw)==expected["bytes"]
            assert hashlib.sha256(raw).hexdigest()==expected["sha256"],name
            dest=root+name
            try:
                existing=api("GET","contents/"+dest+"?ref="+branch)
            except urllib.error.HTTPError as e:
                if e.code!=404:raise
                existing=None
            if existing is None:
                result=api("PUT","contents/"+dest,{"message":"ENLEX: persist V179 frozen Sense shard "+name,"content":base64.b64encode(raw).decode(),"branch":branch})
                print("COMMITTED",name,result["commit"]["sha"])
            else:
                current=api("GET","git/blobs/"+existing["sha"])
                b=base64.b64decode(current["content"])
                assert b==raw,"Conflicting existing shard: "+name
                print("EXISTS_MATCH",name)
            final=api("GET","contents/"+dest+"?ref="+branch)
            blob=api("GET","git/blobs/"+final["sha"])
            remote=base64.b64decode(blob["content"])
            assert hashlib.sha256(remote).hexdigest()==expected["sha256"],"Remote SHA mismatch: "+name
            print("VERIFIED",name,len(remote))
        print("ALL_9_SHARDS_VERIFIED")
if __name__=="__main__":main(sys.argv[1])
