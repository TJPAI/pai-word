import json, pathlib, subprocess, sys, tempfile
import numpy as np
root=pathlib.Path(__file__).parent
with tempfile.TemporaryDirectory() as td:
 d=pathlib.Path(td)
 jobs={'schema':'scene-microrec-embedding-export-v1','teacher':{'family':'multilingual-e5','model_id':'SYNTHETIC_TEST_ONLY','revision':'test','license':'test'},'source_catalog_sha256':'synthetic-only','dimension':24,'vectors':[]}
 for scene in range(1,51):
  for i in range(3):
   vector=np.zeros(24,dtype=float);vector[scene%24]=1
   jobs['vectors'].append({'scene_id':f'S{scene:03d}','text':f'test object {scene} variation {i}','kind':'example','teacher_vector':vector.tolist()})
 (d/'vectors.json').write_text(json.dumps(jobs))
 command=[sys.executable,str(root/'train-student.py'),'--input',str(d/'vectors.json'),'--output',str(d/'student.json'),'--buckets','128','--dim','16','--epochs','2']
 run=subprocess.run(command,capture_output=True,text=True,check=True)
 out=json.loads((d/'student.json').read_text())
 assert out['schema']=='scene-microrec-int8-student-v1'
 assert out['diagnostics']['quality_certified'] is False
 assert len(out['scene_ids'])==50
 assert len((d/'student.json').read_bytes())<2000000
 node=subprocess.run(['node',str(root/'test-student-runtime.mjs'),str(d/'student.json')],capture_output=True,text=True,check=True)
 print('PASS_SYNTHETIC_PIPELINE_ONLY',run.stdout.strip(),node.stdout.strip())
