// Non-Sense KUs require an explicit approved learning mode; never re-label as sense.
export function classifyFunctionKU(unit, approvals = {}) {
  if (!unit || !unit.id || !unit.type) return {playable:false,reason:'INVALID_KU'};
  if (unit.type==='sense') return {playable:false,reason:'NOT_FUNCTION_GATE_SCOPE'};
  const a=approvals[unit.id];
  if (!a || a.status!=='approved' || a.ku_type!==unit.type || a.mode!=='function_practice' || !a.reviewer || !a.source_url || !/^https:\/\//.test(a.source_url))
    return {playable:false,reason:'FUNCTION_KU_NOT_APPROVED'};
  return {playable:true,mode:'function_practice',ku_id:unit.id,reason:'EXPLICIT_EDITORIAL_APPROVAL'};
}