// Experimental explicit replacement reranker. No production imports.
// Safety-first: only an explicit "不要 X，改 Y" pair with exact scene phrase anchors.
// Never interpret learning about negation (不同意/拒绝请求) as a negative scene.
const norm=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
const split=raw=>String(raw??'').normalize('NFKC').split(/[，,。；;！？!?]/u).map(x=>x.trim()).filter(Boolean);
const NEG=/^(?:不要|不想|不愿|别|避免)/u;
const POS=/^(?:改为|改成|改去|改坐|改乘|改吃|改喝|改点|换成|换去|换坐|换乘|转而|而是|我要|我想要|我选择|选择|改打|自己)/u;
const VERB=/^(?:乘坐|搭乘|准备|乘|坐|吃|喝|点|叫|去|打|开|做|订)/u;
const anchors=scene=>[scene?.name,...(scene?.aliases||[])].filter(x=>typeof x==='string'&&norm(x).length>=2);
export function rerankExplicitReplacementCandidate(snapshot,query,{catalog,limit=5}={}){
 const original=snapshot?.results||[];
 const safeLimit=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):5;
 const unchanged=()=>({...snapshot,results:original.slice(0,safeLimit),candidateOnly:true,replacementApplied:false});
 const clauses=split(query);
 // Only the simple two-clause imperative form is eligible. Avoid concessions,
 // double negatives, quotation, metalinguistic questions and recovery statements.
 if(clauses.length!==2||/(?:怎么说|怎么表达|如何表达|想了解|想学习|学会|虽然|但是|不过|还是|不是不|\bhow\b)/iu.test(query))return unchanged();
 const [negativeClause,positiveClause]=clauses;
 const nm=NEG.exec(negativeClause),pm=POS.exec(positiveClause);
 if(!nm||!pm)return unchanged();
 const negative=norm(negativeClause.slice(nm[0].length));
 const positive=norm(positiveClause.slice(pm[0].length));
 if(negative.length<2||positive.length<2)return unchanged();
 const match=(scene,part)=>anchors(scene).some(x=>{
  const v=norm(x),p=norm(part),stem=v.replace(VERB,'');
  // Prefix/suffix phrase anchoring; never match a token in the middle of a word.
  return p===v||p.startsWith(v)||p.endsWith(v)||
   (stem.length>=2&&(p===stem||p.startsWith(stem)||p.endsWith(stem)));
 });
 const negativeIds=new Set(original.filter(x=>match(catalog?.scenes?.[x.sceneId],negative)).map(x=>x.sceneId));
 const positiveIds=new Set(original.filter(x=>match(catalog?.scenes?.[x.sceneId],positive)).map(x=>x.sceneId));
 // Ambiguity and missing positive retrieval: never rerank.
 if(negativeIds.size!==1||positiveIds.size!==1)return unchanged();
 const negId=[...negativeIds][0],posId=[...positiveIds][0];
 if(negId===posId)return unchanged();
 const rows=original.map(row=>({...row,scoreCandidate:row.score,
  replacementNegative:row.sceneId===negId,replacementPositive:row.sceneId===posId}));
 // Stable promotion of an already-retrieved positive scene and demotion of the
 // explicitly rejected scene. Preserve relative order of all other results.
 const positiveRow=rows.find(x=>x.sceneId===posId);
 const rest=rows.filter(x=>x.sceneId!==posId&&x.sceneId!==negId);
 const negativeRow=rows.find(x=>x.sceneId===negId);
 const ordered=[positiveRow,...rest,negativeRow].filter(Boolean);
 return {...snapshot,results:ordered.slice(0,safeLimit).map((row,i)=>({...row,rank:i+1})),
  total:ordered.length,candidateOnly:true,replacementApplied:true,
  replacementEvidence:{negativeSceneId:negId,positiveSceneId:posId}};
}
