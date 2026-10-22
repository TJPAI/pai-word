const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const builder=path.resolve(__dirname,'../scripts/build-scene500-chinese-associations.cjs');
test('candidate builder emits exact lexical edges, no invented semantics',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-links-'));
 try{
  const words=Array.from({length:20000},(_,i)=>'词条'+String(i).padStart(5,'0'));
  words[123]='登机牌';words[124]='机场值机';words[125]='咨询';
  const scenes=Object.fromEntries(Array.from({length:500},(_,i)=>['S'+String(i+1).padStart(3,'0'),{name:'测试场景'+i,aliases:[],actions:[],objects:[]}]));
  scenes.S104={name:'机场值机',aliases:['登机牌'],actions:['咨询'],objects:['登机牌']};
  const src=path.join(dir,'w.json'),cat=path.join(dir,'c.json'),out=path.join(dir,'r.json');
  fs.writeFileSync(src,JSON.stringify({words}));fs.writeFileSync(cat,JSON.stringify({scene_count:500,scenes}));
  const result=cp.spawnSync(process.execPath,[builder,src,cat,out],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const r=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(r.word_count,20000);
  assert.equal(r.terms['登机牌'][0].sceneId,'S104');
  assert.equal(r.terms['登机牌'][0].weight,.8);
  assert.equal(r.terms['机场值机'][0].weight,1);
  assert.equal(r.stats.edges,3);
  assert.equal(r.terms['词条00001'],undefined);
  assert.equal(r.stage,'lexical_candidate_unverified');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
