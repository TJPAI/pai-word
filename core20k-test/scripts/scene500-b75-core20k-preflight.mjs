// B75 non-production Core20K KU preflight. Fail closed; never assigns canonical IDs.
import {verifyRegistry,planSrsMigration} from './scene500-b73-ku-registry.mjs';
const clean = x => String(x??'').trim();
const ok = x => x===true || x==='true' || x==='True' || x==='TRUE' || x===1 || x==='1';
export function inspectProposedContent(rows, legacyKuIds=[]) {
 if (!Array.isArray(rows)) throw new TypeError('Expected content rows');
 const byKey=new Map(), issues=[], scenes=new Set();
 for(const row of rows) {
  const id=clean(row.new_content_proposal_key),scene=clean(row.scene_id),lemma=clean(row.lemma);
  if(!id||!scene||!lemma)issues.push('INCOMPLETE_CONTENT_ROW');
  if(!/^S(00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(scene))issues.push('INVALID_SCENE:'+scene);
  const signature=[lemma,clean(row.proposed_ku_type),clean(row.proposed_pos),clean(row.proposed_gloss_zh)].join('|');
  if(byKey.has(id) && byKey.get(id)!==signature)issues.push('CONFLICTING_PROPOSAL:'+id);
  byKey.set(id,signature);
  const link=scene+'|'+lemma+'|'+id;
  if(scenes.has(link))issues.push('DUPLICATE_SCENE_LINK:'+link);
  scenes.add(link);
  if(ok(row.production_eligible))issues.push('PREMATURE_PRODUCTION_FLAG:'+id);
  if(clean(row.target_ku_id) || clean(row.target_sense_id) || clean(row.target_word_id))issues.push('UNREVIEWED_CANONICAL_ID:'+id);
 }
 const registry=[...byKey].map(([id,s])=>({ku_id:id,word_id:'draft-only',sense_id:'draft-only',ku_type:'sense',semantic_key:s,status:'pending'}));
 const registryResult=verifyRegistry(registry,legacyKuIds);
 return {structurePass:issues.length===0,issues,contentCount:byKey.size,sceneLinkCount:rows.length,
  approved:0,identityReady:false,registryBlocked:registryResult.issues.filter(x=>x.startsWith('NOT_APPROVED')).length};
}
export function planSafeUpgrade(records,oldKnownIds,newKnownIds,transitions=[]) {
 const issues=[];
 for(const t of transitions) {
  if(t.type==='split'||t.type==='merge')issues.push('EXPLICIT_ADJUDICATION_REQUIRED:'+t.from);
  if(t.type==='replace' && t.approved!==true)issues.push('UNAPPROVED_REPLACEMENT:'+t.from);
 }
 if(issues.length)return {pass:false,issues,records:{...records},pending:{},unchanged:true};
 return planSrsMigration(records,oldKnownIds,newKnownIds,transitions);
}
