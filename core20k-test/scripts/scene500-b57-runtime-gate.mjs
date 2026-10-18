// B57: conservative, pure validation of Scene500 -> KU candidates.
// Not loaded by the application. No SRS, membership, ranking or main mutations.
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const blank = v => v == null || String(v).trim() === '';
const candidateIds = v => String(v || '').split('|').map(x=>x.trim()).filter(Boolean);
export function validateSceneKuBridge(sceneRows, catalogRows, opts={}) {
  if (!Array.isArray(sceneRows) || !Array.isArray(catalogRows)) throw Error('Expected arrays');
  const failures=[], statuses=[], sceneKeys=new Set(), senseKeys=new Set(), kuKeys=new Set();
  const catalogBySense=new Map();
  for (const c of catalogRows) {
    const sense=String(c.proposed_sense_key||'').trim(), ku=String(c.proposed_sense_ku_key||'').trim();
    if (!sense.startsWith('B55_PROPOSAL_SENSE_') || !ku.startsWith('B55_PROPOSAL_KU_SENSE_')) failures.push({type:'INVALID_PROPOSAL_CATALOG',lemma:c.lemma});
    if (senseKeys.has(sense) || kuKeys.has(ku)) failures.push({type:'DUPLICATE_PROPOSAL_ID',lemma:c.lemma});
    senseKeys.add(sense); kuKeys.add(ku); catalogBySense.set(sense,c);
    if (!blank(c.target_ku_id) || !blank(c.target_sense_id) || !blank(c.target_word_id)) failures.push({type:'UNEXPECTED_TARGET_IN_PROPOSAL',lemma:c.lemma});
  }
  for (const row of sceneRows) {
    const key=String(row.scene_id||'')+'|'+String(row.lemma||'').toLowerCase();
    if (sceneKeys.has(key)) failures.push({type:'DUPLICATE_SCENE_LEMMA',key});
    sceneKeys.add(key);
    const reasons=[];
    if (!/^S(00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(String(row.scene_id||''))) reasons.push('INVALID_SCENE_ID');
    if (!/^(true|True|TRUE|1)$/.test(String(row.core20k_member))) reasons.push('NOT_CORE20K');
    const keys=candidateIds(row.candidate_sense_proposal_keys);
    if (!keys.length || keys.some(k=>!catalogBySense.has(k))) reasons.push('MISSING_SENSE_PROPOSAL');
    if (keys.some(k=>catalogBySense.has(k) && String(catalogBySense.get(k).lemma||'').toLowerCase()!==String(row.lemma||'').toLowerCase())) reasons.push('CROSS_LEMMA_PROPOSAL');
    if (keys.length!==1) reasons.push('SENSE_SELECTION_PENDING');
    if (!blank(row.target_ku_id) || !blank(row.target_sense_id) || !blank(row.target_word_id)) reasons.push('TARGET_ID_NOT_VERIFIED');
    // Evidence, explicit human review and canonical runtime IDs MUST come from a separately audited approval workflow.
    reasons.push('NO_INDEPENDENT_SCENE_EVIDENCE_GATE','NO_CANONICAL_RUNTIME_KU_MAPPING');
    statuses.push({scene_id:row.scene_id,lemma:row.lemma,scene_rank_v40:row.scene_rank_v40,
      proposed_sense_key:keys.length===1?keys[0]:'',production_eligible:false,
      status:'HOLD',blockers:[...new Set(reasons)].join('|')});
  }
  if (opts.expectedRows!=null && sceneRows.length!==opts.expectedRows) failures.push({type:'ROW_COUNT',actual:sceneRows.length,expected:opts.expectedRows});
  if (opts.expectedCatalog!=null && catalogRows.length!==opts.expectedCatalog) failures.push({type:'CATALOG_COUNT',actual:catalogRows.length,expected:opts.expectedCatalog});
  return {pass:failures.length===0,failures,counts:{sceneRows:sceneRows.length,catalogRows:catalogRows.length,distinctScenes:new Set(sceneRows.map(r=>r.scene_id)).size,proposedSingleSense:statuses.filter(x=>x.proposed_sense_key).length,productionEligible:0},statuses};
}
