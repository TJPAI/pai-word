// Opt-in postprocessor. Never wired into production without A/B review.
import {isLocallyNegatedTerm} from './query-intent-candidate.mjs';
export function rerankNegationCandidate(snapshot,query,{catalog,limit=5}={}){
 const all=snapshot?.results||[];
 const rows=all.map(row=>{
  const scene=catalog?.scenes?.[row.sceneId];
  const tokens=[...(row.matchedTerms||[]),scene?.name,...(scene?.aliases||[]),...(scene?.objects||[])].filter(x=>typeof x==='string'&&x.length>=2);
  const negative=tokens.some(t=>isLocallyNegatedTerm(query,t));
  return {...row,negationCandidate:negative,scoreCandidate:negative?Math.max(0,row.score-100):row.score};
 }).sort((a,b)=>b.scoreCandidate-a.scoreCandidate||a.sceneId.localeCompare(b.sceneId));
 const safeLimit=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):5;
 const results=rows.slice(0,safeLimit).map((row,i)=>({...row,rank:i+1}));
 return {...snapshot,results,total:rows.length,candidateOnly:true};
}
