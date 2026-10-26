import gzip, json, sys
from pathlib import Path
p = Path(sys.argv[1] if len(sys.argv)>1 else 'data/core20k-runtime.json.gz')
d = json.loads(gzip.decompress(p.read_bytes()))
print('root', type(d).__name__, list(d)[:12] if isinstance(d, dict) else len(d))
def walk(x, path='$'):
    if isinstance(x, dict):
        if any(v in ('reservation', 'cancellation') for v in x.values() if isinstance(v, str)):
            print(path, json.dumps(x, ensure_ascii=False)[:3000])
        for k,v in x.items(): walk(v, path+'.'+str(k))
    elif isinstance(x, list):
        if any(v in ('reservation', 'cancellation') for v in x if isinstance(v, str)):
            print(path, json.dumps(x, ensure_ascii=False)[:3000])
        else:
            for i,v in enumerate(x): walk(v, path+'['+str(i)+']')
walk(d)
