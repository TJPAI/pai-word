// Four-source contract gate for the existing PAI Word app.
// Additive only: it NEVER creates S001->csNNN aliases or writes learning/SRS state.
export const FOUR_LINE_CONTRACT='pai-word-four-line-integration-v1';
const sid=id=>/^S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(id);
const text=x=>typeof x==='string'&&x.trim().length>0;
export function validateFourLineIntegration({catalog,english,activeSceneMembership,zhRuntime,associations,teaching,sceneMappings=[]}={}){
 const errors=[],warnings=[];
 const reject=(code)=>errors.push(code);
 if(catalog?.schema!=='pai-scene500-recommendation-catalog-v0.2'||catalog.scene_count!==500||
    !catalog.scenes||Object.keys(catalog.scenes).length!==500||
    Object.keys(catalog.scenes).some(id=>!sid(id)||!text(catalog.scenes[id]?.name)))
   reject('INVALID_SCENE500_CATALOG');
 if(!english||!Array.isArray(english.words)||english.words.length!==20000||
    !(english.byKU instanceof Map)||!(english.byRank instanceof Map))
   reject('ENGLISH_CORE20K_UNAVAILABLE');
 if(zhRuntime==null)warnings.push('CHINESE_V0101_NOT_DELIVERED');
 else if(zhRuntime.data_version!=='0.10.1-evidence-compat'||zhRuntime.contract_version!=='1.1'||
         zhRuntime.integration_ready!==true||zhRuntime.production_ready!==false||
         !Array.isArray(zhRuntime.terms)||zhRuntime.terms.length!==20000||
         zhRuntime.terms.some(t=>!text(t.term_id)||!text(t.term)||!text(t.normalized_term))||
         new Set(zhRuntime.terms.map(t=>t.term_id)).size!==20000)
   reject('INVALID_CHINESE_V0101');
 if(associations==null)warnings.push('ASSOCIATIONS_NOT_DELIVERED');
 else if(!text(associations.association_version)||!Array.isArray(associations.links)||
         associations.links.length===0||
         associations.links.some(x=>!text(x.term_id)||!sid(x.scene_id)))
   reject('INVALID_SCENE_ASSOCIATIONS');
 if(zhRuntime&&associations&&errors.length===0){
   const terms=new Set(zhRuntime.terms.map(x=>x.term_id));
   if(associations.links.some(x=>!terms.has(x.term_id)||!catalog.scenes[x.scene_id]))
     reject('ASSOCIATION_REFERENCE_MISMATCH');
 }
 if(!activeSceneMembership?.scenes)reject('ACTIVE_MEMBERSHIP_MISSING');
 if(!Array.isArray(sceneMappings))reject('MAPPING_SCHEMA');
 else {
   const from=new Set(),to=new Set();
   for(const m of sceneMappings){
     if(!sid(m?.scene_id)||!text(m?.legacy_id)||!/^cs\d{3}$/.test(m.legacy_id)||
        m?.provenance_verified!==true||!text(m?.source_sha)||!catalog?.scenes?.[m.scene_id]||
        !activeSceneMembership?.scenes?.[m.legacy_id]||
        from.has(m.scene_id)||to.has(m.legacy_id))reject('UNVERIFIED_SCENE_MAPPING');
     else{from.add(m.scene_id);to.add(m.legacy_id);}
   }
 }
 if(!sceneMappings.some(m=>m?.scene_id==='S113'&&m?.provenance_verified===true))
   warnings.push('S113_NOT_PLAYABLE_TAXONOMY_CONFLICT');
 if(teaching==null)warnings.push('NO_CERTIFIED_TEACHING_RELEASE');
 else if(teaching.production_ready!==true||teaching.activation_allowed!==true||
         teaching.status!=='PRODUCTION_READY')
   warnings.push('TEACHING_STAGING_NOT_ACTIVATED');
 // Disallow all activation if there are unverified core references.
 return Object.freeze({
   schema:FOUR_LINE_CONTRACT,
   status:errors.length?'BLOCKED':warnings.length?'PARTIAL':'READY',
   errors:Object.freeze(errors),warnings:Object.freeze(warnings),
   capabilities:Object.freeze({
     englishCore20k:!!english?.words&&english.words.length===20000&&english.byKU instanceof Map,
     chineseV0101:!!zhRuntime&&errors.indexOf('INVALID_CHINESE_V0101')===-1,
     recommendationHybrid:!!zhRuntime&&!!associations&&!errors.some(x=>x.startsWith('INVALID_')||x.includes('MISMATCH')),
     recommendationSceneNavigation:sceneMappings.length>0&&errors.length===0,
     certifiedTeaching:teaching?.status==='PRODUCTION_READY'&&teaching?.production_ready===true&&teaching?.activation_allowed===true
   }),
   sceneMappings:Object.freeze(errors.length?[]:sceneMappings.map(m=>Object.freeze({scene_id:m.scene_id,legacy_id:m.legacy_id})))
 });
}
