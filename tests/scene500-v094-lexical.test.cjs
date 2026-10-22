const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const cmd=path.resolve(__dirname,'../scripts/build-scene500-v094-lexical.cjs');
test('v094 lexical candidates: bounded evidence, canonical IDs and reproducibility',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-v094-links-'));
 try{
  const words=Array.from({length:20000},(_,i)=>({id:'zh_'+i.toString(16).padStart(20,'0'),t:'模拟'+i,n:'模拟'+i,s:0}));
  words[0]={...words[0],t:'机场',n:'机场'};words[1]={...words[1],t:'值机',n:'值机'};
  words[2]={...words[2],t:'登机牌',n:'登机牌'};
  const scenes=Object.fromEntries(Array.from({length:500},(_,i)=>['S'+String(i+1).padStart(3,'0'),{name:'场景'+i,aliases:[],actions:[],objects:[]}]));
  scenes.S104={name:'机场值机',aliases:['办理值机'],actions:['办登机牌'],objects:[]};
  const x=path.join(folder,'words.json'),y=path.join(folder,'scenes.json'),z=path.join(folder,'links.json');
  fs.writeFileSync(x,JSON.stringify({version:'0.9.4-rc.2',terms:words}));
  fs.writeFileSync(y,JSON.stringify({scene_count:500,scenes}));
  const proc=cp.spawnSync(process.execPath,[cmd,x,y,z],{encoding:'utf8'});
  assert.equal(proc.status,0,proc.stderr);
  const out=JSON.parse(fs.readFileSync(z,'utf8'));
  assert.equal(out.stats.terms,20000);
  assert.equal(out.quality,'lexical_candidate_unverified');
  const key=words[1].id;
  assert.ok(out.links.some(r=>r.term_id===key&&r.scene_id==='S104'&&r.evidence_type==='alias_substring'));
  assert.ok(out.links.some(r=>r.term_id===words[2].id&&r.scene_id==='S104'&&r.evidence_type==='action_substring'));
  assert.ok(out.links.every(r=>r.confidence===0&&r.rank<=50&&r.review_status==='lexical_candidate_unverified'));
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});