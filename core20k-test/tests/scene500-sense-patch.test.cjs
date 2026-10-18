const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const script=path.join(__dirname,'..','scripts','apply-scene500-sense-review.cjs');
function tmp(){return fs.mkdtempSync(path.join(os.tmpdir(),'pai-scene500-'))}
function write(file,obj){fs.writeFileSync(file,JSON.stringify(obj,null,2))}
function membership(extra={}){return {schemaVersion:2,scenes:{cs096:{entries:[{lemma:'paper',sceneRank:3,...extra}]}}}}
function patch(overrides={}){return {schema:'pai-word-scene500-membership-patch-v1',mutationApplied:false,errors:[],patches:[{sceneId:'cs096',lemma:'paper',sceneRank:3,coreRank:123,kuId:'ku-paper-academic',senseBindingReviewed:true,senseBindingMethod:'manual_review',senseReviewNote:'学术论文',senseReviewedAt:'2026-10-17T00:00:00.000Z',senseReviewedBy:'test',...overrides}]}}
function run(dir,m,p,args=[]){const mf=path.join(dir,'membership.json'),pf=path.join(dir,'patch.json'),out=path.join(dir,'out.json');write(mf,m);write(pf,p);const stdout=execFileSync(process.execPath,[script,'--membership',mf,'--patch',pf,'--output',out,...args],{encoding:'utf8'});return {stdout,out,json:JSON.parse(fs.readFileSync(out,'utf8'))}}

test('applies an explicitly reviewed KU to a copy, not the source',()=>{
  const d=tmp(),source=membership();
  const mf=path.join(d,'membership.json'),pf=path.join(d,'patch.json'),out=path.join(d,'out.json');write(mf,source);write(pf,patch());
  execFileSync(process.execPath,[script,'--membership',mf,'--patch',pf,'--output',out],{encoding:'utf8'});
  const original=JSON.parse(fs.readFileSync(mf,'utf8')),updated=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(original.scenes.cs096.entries[0].kuId,undefined);
  assert.equal(updated.scenes.cs096.entries[0].kuId,'ku-paper-academic');
  assert.equal(updated.scenes.cs096.entries[0].senseBindingReviewed,true);
  assert.equal(updated.scenes.cs096.entries[0].senseBindingMethod,'manual_review');
});

test('rejects a sceneRank mismatch',()=>{
  const d=tmp(),mf=path.join(d,'m.json'),pf=path.join(d,'p.json'),out=path.join(d,'o.json');write(mf,membership());write(pf,patch({sceneRank:4}));
  assert.throws(()=>execFileSync(process.execPath,[script,'--membership',mf,'--patch',pf,'--output',out],{stdio:'pipe'}),/Command failed/);
  assert.equal(fs.existsSync(out),false);
});

test('refuses to replace a reviewed different KU',()=>{
  const d=tmp(),mf=path.join(d,'m.json'),pf=path.join(d,'p.json'),out=path.join(d,'o.json');write(mf,membership({kuId:'ku-existing',senseBindingReviewed:true,senseBindingMethod:'manual_review'}));write(pf,patch());
  assert.throws(()=>execFileSync(process.execPath,[script,'--membership',mf,'--patch',pf,'--output',out],{stdio:'pipe'}),/Command failed/);
  assert.equal(fs.existsSync(out),false);
});

test('refuses a patch that still contains review errors',()=>{
  const d=tmp(),mf=path.join(d,'m.json'),pf=path.join(d,'p.json'),out=path.join(d,'o.json');write(mf,membership());const p=patch();p.errors=[{key:'cs096:paper',reason:'ku_id_not_in_candidates'}];write(pf,p);
  assert.throws(()=>execFileSync(process.execPath,[script,'--membership',mf,'--patch',pf,'--output',out],{stdio:'pipe'}),/Command failed/);
  assert.equal(fs.existsSync(out),false);
});
