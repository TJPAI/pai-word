/* Scene1341 live multi-batch feed contract — TEST_ONLY, never enables SRS.
 * All reads in a session MUST use one immutable commit. No cross-version joins.
 */
const SOURCE='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const ID=/^SC50-\d{4}$/;
const HASH40=/^[0-9a-f]{40}$/;
const HASH64=/^[0-9a-f]{64}$/;
const fail=(code)=>{throw Error('MASTER_FEED_'+code);};
export function validateLiveFeed(feed){
 if(!feed||feed.schema_version!=='scene1341-live-feed/v1'||feed.source_master_sha256!==SOURCE||
    feed.formal_ready!==0||feed.srs_eligible!==false||!Array.isArray(feed.batches))
   fail('CONTRACT');
 const ranges=[],seen=new Set();
 for(const b of feed.batches){
  const first=b.first_source_final_row,last=b.last_source_final_row;
  if(!Number.isSafeInteger(first)||first<1||!Number.isSafeInteger(last)||last<first||
     !Number.isSafeInteger(b.records)||b.records!==last-first+1||
     !/^V\d+$/.test(b.version)||!Array.isArray(b.shards)||!b.shards.length)fail('BATCH');
  if(!Array.isArray(b.scene_ids)||!b.scene_ids.length||
     b.scene_ids.some(s=>!ID.test(s)||Number(s.slice(5))>1341))fail('SCENES');
  if(new Set(b.scene_ids).size!==b.scene_ids.length)fail('DUPLICATE_SCENE');
  if(b.shards.reduce((n,s)=>n+s.records,0)!==b.records)fail('SHARD_TOTAL');
  for(const s of b.shards){
   if(!Number.isSafeInteger(s.records)||s.records<1||
      typeof s.name!=='string'||!/^CGMASTER_[A-Za-z0-9_.-]+\.jsonl\.gz$/.test(s.name)||
      !HASH40.test(s.git_blob_sha1)||!HASH64.test(s.sha256))fail('SHARD');
  }
  const key=first+':'+last;
  if(seen.has(key))fail('DUPLICATE_RANGE');
  seen.add(key);ranges.push([first,last]);
 }
 ranges.sort((a,b)=>a[0]-b[0]);
 for(let i=1;i<ranges.length;i++)if(ranges[i][0]<=ranges[i-1][1])fail('OVERLAP');
 return Object.freeze({batchCount:feed.batches.length,associationCount:feed.batches.reduce((n,b)=>n+b.records,0)});
}
export function selectSceneBatches(feed,sceneId){
 validateLiveFeed(feed);
 if(!ID.test(sceneId)||Number(sceneId.slice(5))>1341)fail('SCENE_ID');
 return feed.batches.filter(b=>b.scene_ids.includes(sceneId)).sort((a,b)=>a.first_source_final_row-b.first_source_final_row);
}
export async function resolveLiveFeed({fetchImpl=fetch,commit}={}){
 if(!HASH40.test(commit||''))fail('COMMIT');
 const path='tools/scene1341_master/qa_reports/CGMASTER_LIVE_FEED.json';
 const url='https://raw.githubusercontent.com/TJPAI/pai-word/'+commit+'/'+path;
 const response=await fetchImpl(url,{cache:'no-store'});
 if(!response.ok)fail('HTTP_'+response.status);
 const feed=await response.json();
 const stats=validateLiveFeed(feed);
 return Object.freeze({commit,feed,stats,formalReady:0,canWriteSrs:false});
}
