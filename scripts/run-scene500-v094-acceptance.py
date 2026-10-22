#!/usr/bin/env python3
"""Run the real V0.9.4 ZIP against a checked-out Scene500 catalog; no fake QA PASS."""
import argparse, hashlib, json, pathlib, subprocess, tempfile, zipfile
def digest(data): return hashlib.sha256(data).hexdigest()
def run():
    p=argparse.ArgumentParser()
    p.add_argument('--zip', required=True)
    p.add_argument('--catalog', default='scene500-recommendation/catalog-v0.2.json')
    p.add_argument('--holdout', default='scene500-recommendation/query-holdout-v0.2.json')
    p.add_argument('--out-dir', default='scene500-recommendation/qa-output-v094')
    p.add_argument('--expected-zip-sha256', default='97bec415608047adb915d72b2f11b3989e003f7306ab0d93871d9478bde845c1')
    a=p.parse_args()
    root=pathlib.Path(__file__).resolve().parent.parent
    data=pathlib.Path(a.zip).read_bytes()
    if digest(data)!=a.expected_zip_sha256: raise ValueError('ZIP_SHA_MISMATCH')
    catalog=(root/a.catalog).resolve()
    holdout=(root/a.holdout).resolve()
    if not catalog.is_file() or not holdout.is_file(): raise FileNotFoundError('Missing actual Scene500 catalog or holdout')
    output=(root/a.out_dir).resolve()
    output.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(a.zip) as z:
        file_name='zh-core20k-v094.min.json'
        manifest=json.loads(z.read('zh-core20k-v094-manifest.json'))
        raw=z.read(file_name)
        for name,record in manifest.get('files',{}).items():
            actual=z.read(name)
            if len(actual)!=record['bytes'] or digest(actual)!=record['sha256']:
                raise ValueError('MANIFEST_ASSET_MISMATCH: '+name)
        if len(raw)!=1354769: raise ValueError('COMPACT_ASSET_SIZE_MISMATCH')
        if manifest.get('data_version')!='0.9.4-rc.2' or manifest.get('contract_version')!='1.1':
            raise ValueError('UNEXPECTED_V094_CONTRACT_VERSION')
        lex=json.loads(raw)
        if len(lex.get('terms',[]))!=20000: raise ValueError('TERM_COUNT_MISMATCH')
        if len(set(x.get('id') for x in lex['terms']))!=20000: raise ValueError('TERM_ID_COLLISION')
        with tempfile.TemporaryDirectory(prefix='scene500-v094-') as temp:
            input_path=pathlib.Path(temp)/file_name
            input_path.write_bytes(raw)
            edges=output/'v094-lexical-associations.json'
            report=output/'v094-lexical-evaluation.json'
            subprocess.run(['node',str(root/'scripts/build-scene500-v094-lexical.cjs'),str(input_path),str(catalog),str(edges)],check=True,cwd=root)
            subprocess.run(['node',str(root/'scripts/evaluate-scene500-v094.mjs'),str(input_path),str(catalog),str(edges),str(holdout),str(report)],check=True,cwd=root)
            result=json.loads(report.read_text())
            receipt={'status':'diagnostic_not_production_ready','zip_sha256':digest(data),'compact_sha256':digest(raw),
              'catalog_sha256':digest(catalog.read_bytes()),'terms':20000,'associations':result['association_edges'],
              'baseline':{k:result['baseline'][k] for k in ('recall_at5','mrr_at10','ndcg_at5')},
              'hybrid':{k:result['hybrid'][k] for k in ('recall_at5','mrr_at10','ndcg_at5')},
              'manifest_verified':True,'manifest_contract_version':manifest['contract_version']}
            (output/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
            print(json.dumps(receipt,ensure_ascii=False))
if __name__=='__main__':run()
