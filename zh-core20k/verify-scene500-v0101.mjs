// Release gate: full Chinese Core20K V0.10.1 vs existing Scene500 association identity.
// Usage: node zh-core20k/verify-scene500-v0101.mjs <runtime.json> <associations.json>
// This script never mutates runtime membership or association content.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export function verifyScene500V0101(runtime, associations) {
  const errors=[];
  const fail=(code,detail)=>{ if(errors.length<30) errors.push({code,detail}); };
  if(runtime?.data_version!=='0.10.1-evidence-compat' || runtime?.runtime_version!=='0.9.4-rc.2-compatible' ||
     runtime?.contract_version!=='1.1' || runtime?.integration_ready!==true ||
     runtime?.production_ready!==false) fail('RUNTIME_CONTRACT','Incorrect release flags or versions');
  const terms=runtime?.terms;
  if(!Array.isArray(terms)||terms.length!==20000) fail('TERM_COUNT',terms?.length);
  const byId=new Map(),bySurface=new Set();
  for(const t of Array.isArray(terms)?terms:[]){
    if(!/^zh_[a-f0-9]{20}$/.test(t?.term_id??'') || typeof t?.term!=='string' ||
       !t.term || typeof t.normalized_term!=='string') {fail('INVALID_TERM',t?.term_id);continue;}
    if(byId.has(t.term_id)) fail('DUPLICATE_TERM_ID',t.term_id);
    if(bySurface.has(t.term)) fail('DUPLICATE_TERM',t.term);
    byId.set(t.term_id,t);bySurface.add(t.term);
  }
  const links=associations?.links;
  if(!Array.isArray(links)||links.length!==3553) fail('ASSOCIATION_COUNT',links?.length);
  const seen=new Set(),sceneIds=new Set(),linkedIds=new Set();
  for(const l of Array.isArray(links)?links:[]){
    const t=byId.get(l?.term_id);
    if(!t) fail('MISSING_FOREIGN_KEY',l?.term_id);
    else if(t.term!==l.term) fail('TERM_SURFACE_MISMATCH',l.term_id);
    if(!/^S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(l?.scene_id??'')) fail('SCENE_ID_INVALID',l?.scene_id);
    const k=l?.term_id+'|'+l?.scene_id;
    if(seen.has(k)) fail('DUPLICATE_ASSOCIATION',k);
    seen.add(k);sceneIds.add(l?.scene_id);linkedIds.add(l?.term_id);
  }
  // Report rather than assert scene_count=500: only 3,553 edges, not necessarily all scenes linked.
  return {ok:errors.length===0,term_count:byId.size,edge_count:links?.length??0,
    linked_terms:linkedIds.size,linked_scenes:sceneIds.size,errors};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  assert.equal(process.argv.length,4,'Usage: node verify-scene500-v0101.mjs runtime.json associations.json');
  const result=verifyScene500V0101(...process.argv.slice(2).map(p=>JSON.parse(fs.readFileSync(p,'utf8'))));
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
}
