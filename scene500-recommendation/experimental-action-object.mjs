// Experimental, dependency-free action/object intent candidate. NEVER activates without caller opt-in.
// Catalog scene_id authority stays with catalog-v0.2; mappings are provisional editorial semantics.
// "want" can describe an unrelated learning goal; only accept a direct local food request.
const directFoodWant=/\b(?:i\s+want|i'd\s+like|i\s+would\s+like)\s+(?:(?:a|an|some)\s+)?(?:noodles?|salad|sandwich|burger|pizza|soup|meal|dish)\b/i;
const patterns=[
 {id:'food_order',sceneId:'S034',action:/\b(?:order|have|get)\b/i,object:/\b(?:noodles?|salad|sandwich|burger|pizza|soup|meal|dish)\b/i,exclude:/\b(?:cancel|refund|return)\b/i},
 {id:'allergy',sceneId:'S037',action:/\b(?:allergic|allergy|avoid)\b/i,object:/\b(?:peanuts?|shellfish|seafood|food|nuts?)\b/i},
 {id:'restaurant_bill',sceneId:'S041',action:/\b(?:bill|check|tip)\b/i,object:/\b(?:waiter|restaurant|dinner|lunch|wrong|payment)\b/i},
 {id:'hotel_room_booking',sceneId:'S113',action:/\b(?:book|reserve|reservation)\b/i,object:/\b(?:hotel|room|accommodation)\b/i,exclude:/\b(?:cancel|refund)\b/i},
 {id:'hotel_key',sceneId:'S114',action:/\b(?:collect|pick\s+up|check\s+in|receive)\b/i,object:/\b(?:hotel|room\s+key|key\s+card)\b/i},
 {id:'software_fault',sceneId:'S275',action:/\b(?:crash(?:ing|es|ed)?|error|bug|failed?|broken)\b/i,object:/\b(?:app|software|program|application|phone)\b/i},
 {id:'software_development',sceneId:'S296',action:/\b(?:build(?:ing)?|develop(?:ing|ment)?|cod(?:e|ing))\b/i,object:/\b(?:app|software|application|program)\b/i}
];
export const ACTION_OBJECT_CANDIDATE_VERSION='scene500-action-object-prototype-v0.1';
export function actionObjectCandidates(query,{catalog,eligibleSceneIds=null}={}){
 const q=String(query??'').normalize('NFKC').toLowerCase();
 if(!q||q.length>500||!catalog?.scenes)return [];
 // A learning/practice wrapper quotes a language example, not the user's real-world action.
 // Abstain rather than combine the outer learner's intent with an inner quoted dish/action.
 if(/\b(?:practice|learn|study|translate)\s+(?:my\s+)?english\b[^:：]{0,100}[:：]/i.test(q))return [];
 const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
 return patterns.filter(p=>(p.id==='food_order'?(p.action.test(q)||directFoodWant.test(q)):p.action.test(q))&&p.object.test(q)&&(!p.exclude||!p.exclude.test(q))&&catalog.scenes[p.sceneId]&&(!allowed||allowed.has(p.sceneId))).map(p=>({sceneId:p.sceneId,reason:['experimental_action_object'],patternId:p.id,score:10}));
}
export function compareActionObjectCandidates(snapshot,query,{catalog,eligibleSceneIds=null,limit=10}={}){
 const n=Math.max(0,Math.min(10,Number.isFinite(+limit)?Math.floor(+limit):10));
 const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
 const baseline=(snapshot?.results||[]).filter(r=>catalog?.scenes?.[r.sceneId]&&(!allowed||allowed.has(r.sceneId))).slice(0,n);
 const candidates=actionObjectCandidates(query,{catalog,eligibleSceneIds});
 const rows=new Map(baseline.map(r=>[r.sceneId,{...r}]));
 for(const c of candidates){const prev=rows.get(c.sceneId);if(prev){prev.score=Math.max(+prev.score||0,c.score);prev.reason=[...new Set([...(prev.reason||[]),...c.reason])]}else rows.set(c.sceneId,{...c,name:catalog.scenes[c.sceneId].name,quality:catalog.scenes[c.sceneId].quality,matchedTerms:[]});}
 const result=[...rows.values()].sort((a,b)=>(+b.score||0)-(+a.score||0)||a.sceneId.localeCompare(b.sceneId)).slice(0,n).map((r,i)=>({...r,rank:i+1}));
 return {status:'ISOLATED_NONCERTIFIED_EXPERIMENT',baseline,candidates,results:result};
}
