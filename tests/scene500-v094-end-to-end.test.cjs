const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('end-to-end V094 candidate builder and evaluator run against generated 20K/500 fixture',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-e2e-'));
 try{
  const terms=Array.from({length:20000},(_,i)=>({id:'zh_'+i.toString(16).padStart(20,'0'),t:'无关词'+i,n:'无关词'+i,s:0}));
  terms[0]={...terms[0],t:'登机牌',n:'登机牌'};
  const scenes=Object.fromEntries(Array.from({length:500},(_,i)=>['S'+String(i+1).padStart(3,'0'),{name:'实验场景'+i,aliases:[],actions:[],objects:[],description_enriched:'',example_queries:[],quality:'draft_unverified'}]));
  scenes.S104={...scenes.S104,name:'机场值机',aliases:['办理登机牌'],objects:['登机牌']};
  const files=['lex.json','cat.json','links.json','holdout.json','report.json'].map(x=>path.join(dir,x));
  fs.writeFileSync(files[0],JSON.stringify({version:'0.9.4-rc.2',terms}));
  fs.writeFileSync(files[1],JSON.stringify({scene_count:500,scenes}));
  fs.writeFileSync(files[3],JSON.stringify({cases:[{query:'我要办理登机牌',relevantSceneIds:['S104']}]}));
  const build=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/build-scene500-v094-lexical.cjs'),...files.slice(0,3)],{encoding:'utf8'});
  assert.equal(build.status,0,build.stderr);
  const evalResult=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/evaluate-scene500-v094.mjs'),...files],{encoding:'utf8'});
  assert.equal(evalResult.status,0,evalResult.stderr);
  const out=JSON.parse(fs.readFileSync(files[4],'utf8'));
  assert.equal(out.association_edges>0,true);
  assert.equal(out.hybrid.labeled_queries,1);
  assert.equal(out.baseline.labeled_queries,1);
  assert.ok(Number.isFinite(out.hybrid.ndcg_at5));
  assert.equal(out.status,'diagnostic_unreviewed_not_blind');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});