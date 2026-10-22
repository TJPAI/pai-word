// Additive Scene500 semantic ranker. No mutation of learning state or original Scene500 datasets.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PAI_SCENE_SEMANTIC=api;
})(typeof window!=='undefined'?window:null,function(){
  const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
  const uniq=a=>[...new Set(a.filter(Boolean))];
  function score(query,scene){
    const q=norm(query);
    if(!q)return 0;
    const phrases=uniq([scene.name,...(scene.aliases||[])]).map(norm).filter(x=>x.length>=2);
    const actions=uniq(scene.actions||[]).map(norm).filter(x=>x.length>=2);
    const objects=uniq(scene.objects||[]).map(norm).filter(x=>x.length>=2);
    const examples=uniq(scene.example_queries||[]).map(norm);
    let n=0;
    for(const p of phrases)if(q.includes(p))n+=p===norm(scene.name)?20:12;
    let actionHits=0,objectHits=0;
    for(const p of actions)if(q.includes(p)){n+=7;actionHits++}
    for(const p of objects)if(q.includes(p)){n+=4;objectHits++}
    if(actionHits&&objectHits)n+=10;
    const desc=norm(scene.description_enriched||'');
    const grams=uniq([...q].slice(0,-1).map((c,i)=>c+q[i+1])).filter(p=>/[^a-z0-9]/i.test(p));
    n+=Math.min(5,grams.filter(g=>desc.includes(g)).length*.5);
    if(examples.some(p=>p===q))n+=16;
    return Math.round(n*100)/100;
  }
  function rank(query,scenes,{limit=20,minScore=3}={}){
    const n=Math.max(0,Math.min(500,Math.floor(Number(limit)||0)));
    return Object.entries(scenes||{}).map(([id,s])=>({id,name:s.name,score:score(query,s)}))
      .filter(x=>x.score>=minScore)
      .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,n);
  }
  function page(rows,pageIndex,pageSize=5){
    const size=Math.max(1,Math.floor(pageSize)||5),p=Math.max(0,Math.floor(pageIndex)||0);
    return rows.slice(p*size,(p+1)*size);
  }
  return {score,rank,page};
});
