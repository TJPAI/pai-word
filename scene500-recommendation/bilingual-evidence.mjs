// Conservative bilingual phrase bridge. Experimental; not active in default search.
// Maps vetted English expressions to Chinese scene evidence without modifying Core20K.
const norm=s=>String(s??'').normalize('NFKC').toLowerCase();
const defaults=Object.freeze([
 {en:'machine learning',zh:'机器学习'},
 {en:'data analysis',zh:'数据分析'},
 {en:'presentation',zh:'演示汇报'},
 {en:'meeting',zh:'会议'},
 {en:'check-in',zh:'办理登机手续'},
 {en:'coffee',zh:'咖啡'}
]);
export function extractMixedLanguageEvidence(input,{entries=defaults,maxMatches=10}={}){
 const source=norm(input),matches=[];
 if(!Array.isArray(entries))throw Error('INVALID_BILINGUAL_ENTRIES');
 for(const item of entries){
  if(typeof item?.en!=='string'||typeof item?.zh!=='string'||!item.en.trim()||!item.zh.trim())throw Error('INVALID_BILINGUAL_ENTRY');
  const en=norm(item.en.trim());
  // Require English token boundaries. Do not match 'meeting' in 'premeeting'.
  const pattern=new RegExp('(^|[^a-z0-9])('+en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\ /g,'\\s+')+')(?=$|[^a-z0-9])','g');
  let match;
  while((match=pattern.exec(source))){
   const start=match.index+match[1].length;
   matches.push({start,end:start+match[2].length,english:input.slice(start,start+match[2].length),chinese:item.zh,evidence:'curated_bilingual_phrase'});
   if(match[0].length===0)pattern.lastIndex++;
  }
 }
 // Prefer longest English span and avoid nested duplicate evidence.
 matches.sort((a,b)=>(b.end-b.start)-(a.end-a.start)||a.start-b.start);
 const picked=[];
 for(const m of matches){
  if(picked.some(p=>m.start<p.end&&m.end>p.start))continue;
  picked.push(m);
  if(picked.length>=maxMatches)break;
 }
 return picked.sort((a,b)=>a.start-b.start);
}
export function expandMixedQuery(input,options){
 const matches=extractMixedLanguageEvidence(input,options);
 return {query:String(input??''),expandedQuery:String(input??'')+' '+matches.map(x=>x.chinese).join(' '),matches};
}
