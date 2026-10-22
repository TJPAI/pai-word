const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/prepare-scene500-chinese20k.cjs');
function run(words){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-intake-'));
 try{
  const src=path.join(dir,'in.json'),dst=path.join(dir,'out.json');
  fs.writeFileSync(src,JSON.stringify({meta:{version:'test',quality_status:'unverified'},words}));
  const p=cp.spawnSync(process.execPath,[script,src,dst],{encoding:'utf8'});
  return {status:p.status,stderr:p.stderr,output:fs.existsSync(dst)?JSON.parse(fs.readFileSync(dst,'utf8')):null};
 }finally{fs.rmSync(dir,{force:true,recursive:true})}
}
test('full 20K intake keeps membership, identity, provenance and zero unverified links',()=>{
 const terms=Array.from({length:20000},(_,i)=>'测试词'+String(i).padStart(5,'0'));
 const a=run(terms);
 assert.equal(a.status,0,a.stderr);
 assert.equal(a.output.word_count,20000);
 assert.equal(a.output.words[0].term,terms[0]);
 assert.equal(a.output.words[19999].source_rank,20000);
 assert.equal(a.output.provenance.independent_coverage_verified,false);
 assert.ok(a.output.words.every(x=>x.scene_links.length===0&&x.association_status==='not_generated'));
});
test('intake rejects wrong count and duplicates',()=>{
 assert.notEqual(run(['测试词']).status,0);
 const terms=Array.from({length:20000},(_,i)=>'测试词'+i);terms[15]=terms[14];
 assert.notEqual(run(terms).status,0);
});
