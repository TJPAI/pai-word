// Optional Scene500 V4 projection bridge. Candidate ranking is NOT verified sense membership.
// Deliberately does not change PAI_CORE.byScene or learning eligibility.
export async function loadScene500Projection({url='data/scene500-core20k-v40.json.gz',fetcher=fetch}={}){
  const response=await fetcher(url,{cache:'no-store'});
  if(!response.ok)throw Error('SCENE500_PROJECTION_HTTP_'+response.status);
  const bytes=new Uint8Array(await response.arrayBuffer());
  let raw;
  if(typeof DecompressionStream!=='undefined')raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  else if(globalThis.pako?.ungzip)raw=new TextDecoder().decode(globalThis.pako.ungzip(bytes));
  else throw Error('SCENE500_GZIP_UNSUPPORTED');
  const data=JSON.parse(raw);
  if(data.schema!=='pai-scene500-core20k-coarse-v1'||Object.keys(data.scenes||{}).length!==500)throw Error('SCENE500_PROJECTION_SCHEMA');
  const counts={},seen=new Set();
  for(const [id,scene] of Object.entries(data.scenes)){
    if(!/^S(?:[0-4][0-9][0-9]|500)$/.test(id)||id==='S000')throw Error('SCENE500_SCENE_ID');
    const rows=scene.rows||[];
    if(rows.length<900||rows.length>1000)throw Error('SCENE500_ROW_COUNT:'+id);
    seen.clear();let previous=0;
    for(const [rank,lemma,coreRank,kuId] of rows){
      if(rank!==previous+1||!lemma||!Number.isInteger(coreRank)||coreRank<1||coreRank>20000||seen.has(lemma))throw Error('SCENE500_BAD_ROW:'+id);
      previous=rank;seen.add(lemma);
      // Verify membership identity before any future KU binding. Missing KU is permitted as candidate only.
      const core=globalThis.PAI_CORE;
      if(core?.words?.[coreRank-1]?.w?.toLowerCase()!==lemma.toLowerCase())throw Error('SCENE500_CORE_RANK_MISMATCH:'+id+':'+lemma);
      if(kuId&&core?.byKU?.get(kuId)?.w?.w?.toLowerCase()!==lemma.toLowerCase())throw Error('SCENE500_KU_MISMATCH:'+id+':'+lemma);
    }
    counts[id]=rows.length;
  }
  globalThis.PAI_SCENE500_CANDIDATES={summary:{candidatesByScene:counts},version:'V4.0 Core20K coarse',verifiedSense:false};
  globalThis.PAI_SCENE500_PROJECTION=data;
  return {scenes:Object.keys(counts).length,rows:Object.values(counts).reduce((a,b)=>a+b,0)};
}
