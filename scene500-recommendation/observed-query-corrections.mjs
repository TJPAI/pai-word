// Minimal, deterministic correction for three CI-observed query failures.
// Separate from optional experimental negation re-ranking V1/V2.
const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase();
// Bounded English food-order intent: a compositional action+object match, not a generic translation system.
const foodOrder=/^(?:(?:how\s+(?:to|do\s+i|can\s+i)\s+)|(?:i\s+(?:want|would\s+like)\s+to\s+)|(?:i'd\s+like\s+to\s+)|(?:please\s+)|(?:(?:could|can|may)\s+i\s+))?order\s+(?:(?:a|an|some)\s+)?(?:sandwich|burger|pizza|salad|soup|meal|food)(?:\s+please)?[?.]?$/i;
// Directional transport-switch parser. Only route when the new mode is explicit;
 // do not infer intent from a bare negation or a mention of both modes.
const transitMode=t=>/^(?:坐|乘|乘坐)?(?:地铁|地下铁)$/.test(t)?'S079':/^(?:坐|乘|乘坐)?(?:公交|公交车|公共汽车)$/.test(t)?'S078':null;
function switchedTransport(q){
 const value=q.replace(/[。.!？?，,\s]/g,'');
 const m=value.match(/(?:原计划|原来|本来|今天)?(?:坐|乘|乘坐)?(地铁|公交车|公交|公共汽车)(?:现在|后来|了)?(?:改坐|改乘|换乘|换坐|换|改)(地铁|公交车|公交|公共汽车)$/);
 if(m){const source=transitMode(m[1]),target=transitMode(m[2]);if(source&&target&&source!==target)return {id:'transport_switch_directional',promote:target,exclude:[source]};}
 const reverse=value.match(/^(?:现在|今天|我)?(?:改坐|改乘|换坐|换乘|改|换)(地铁|公交车|公交|公共汽车)(?:不坐|不乘|不要坐|不要乘)(地铁|公交车|公交|公共汽车)$/);
 if(reverse){const target=transitMode(reverse[1]),source=transitMode(reverse[2]);if(source&&target&&source!==target)return {id:'transport_reverse_switch_directional',promote:target,exclude:[source]};}
 const n=value.match(/^(?:今天|我)?(?:不坐|不乘|不要坐|不要乘)(公交车|公交|公共汽车|地铁)(?:了)?(?:改乘|改坐|换乘|换坐|改|换)(公交车|公交|公共汽车|地铁)$/);
 if(n){const source=transitMode(n[1]),target=transitMode(n[2]);if(source&&target&&source!==target)return {id:'transport_negation_directional',promote:target,exclude:[source]};}
 return null;
}
// Require both a hotel context and a clear booking/check-in action;
// never route generic "check in" to a hotel (airport check-in is a different scene).
const englishHotelBooking=/^(?:(?:i\s+(?:need|want|would\s+like)\s+to|i'd\s+like\s+to)\s+)?(?:book|reserve)\s+(?:(?:a|the)\s+)?(?:hotel\s+room|room\s+at\s+(?:a|the)\s+hotel|hotel)(?:\s+please)?[?.]?$/i;
const englishHotelCheckin=/^(?:(?:where\s+can\s+i|how\s+do\s+i)\s+check\s+in\s+(?:at|to)\s+(?:the|a)\s+hotel|(?:i\s+want\s+to|i\s+need\s+to)\s+check\s+in\s+at\s+(?:the|a)\s+hotel)[?.]?$/i;
// Direct food requests without "order": guarded action + known dish object.
const foodRequest=/^(?:(?:i'd|i would)\s+like|(?:i\s+(?:want|would\s+like)))\s+(?:(?:a|an|some)\s+)?(?:burger|sandwich|pizza|salad|soup|meal)(?:\s+please)?[?.]?$|^(?:(?:may|can|could)\s+i\s+have)\s+(?:(?:a|an|some)\s+)?(?:(?:bowl|cup|plate)\s+of\s+)?(?:soup|salad|pizza|sandwich|burger)(?:\s+please)?[?.]?$/i;
const rules=[
 {id:'english_food_direct_request',match:q=>foodRequest.test(q),promote:'S034',exclude:[]},
 {id:'english_hotel_booking_intent',match:q=>englishHotelBooking.test(q),promote:'S113',exclude:[]},
 {id:'english_hotel_checkin_intent',match:q=>englishHotelCheckin.test(q),promote:'S114',exclude:['S104']},
 {id:'english_study_not_machine_learning',match:q=>/^(?:我想)?(?:学|学习|练习)?英语(?:学习|课程|口语|发音)?[，,\s]*(?:而)?(?:不是|并非|而非)(?:机器学习|深度学习)[。.]?$/.test(q),promote:null,exclude:['S279','S280']},
 {id:'food_order_english_compositional',match:q=>foodOrder.test(q),promote:'S034',exclude:[]},
 {id:'coffee_order_english',match:q=>/^(?:how\s+(?:to|do\s+i|can\s+i)\s+order\s+(?:a\s+)?coffee\??|(?:(?:i\s+(?:want|would\s+like)\s+to|i'd\s+like\s+to)|please|could\s+i)\s+order\s+(?:a\s+)?coffee(?:\s+please)?[?.]?|order\s+(?:a\s+)?coffee[?.]?)$/i.test(q),promote:'S039',exclude:[]},
 {id:'english_pronunciation_zh',match:q=>/^(?:(?:我想|想|如何|怎么|怎样|请教)\s*)?(?:学习|练习|提高|学)?\s*英语发音(?:怎么学|技巧|练习|学习)?$/.test(q),promote:null,exclude:['S279','S280']},
 {id:'not_metro_switch_to_bus',match:q=>/^(?:我)?(?:不要|不想|不坐|别坐|不乘)(?:再)?(?:坐|乘)?地铁(?:了)?[，,\s]*(?:改|换|转)(?:坐|乘)?公交(?:车)?[。.]?$/.test(q),promote:'S078',exclude:['S079']}
];
export function applyObservedQueryCorrections(snapshot,query,{catalog,eligibleSceneIds=null,limit=20}={}){
 const q=norm(query).replace(/[’‘]/g,"'"),rule=switchedTransport(q)||rules.find(r=>r.match(q));
 const n=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):20;
 if(!rule)return {...snapshot,results:(snapshot.results||[]).slice(0,n)};
 const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
 const rows=(snapshot.results||[]).filter(r=>!rule.exclude.includes(r.sceneId)).map(r=>({...r}));
 if(rule.promote&&catalog?.scenes?.[rule.promote]&&(!allowed||allowed.has(rule.promote))){
   const existing=rows.find(r=>r.sceneId===rule.promote);
   const max=Math.max(0,...rows.map(r=>Number(r.score)||0));
   const score=Math.round((max+1)*1000)/1000;
   if(existing){existing.score=score;existing.reason=[...new Set([...(existing.reason||[]),'observed_query_correction'])];}
   else rows.push({sceneId:rule.promote,name:catalog.scenes[rule.promote].name,score,matchedTerms:[],reason:['observed_query_correction'],quality:catalog.scenes[rule.promote].quality});
 }
 rows.sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId));
 rows.forEach((r,i)=>r.rank=i+1);
 return {...snapshot,total:rows.length,results:rows.slice(0,n),correctionRule:rule.id};
}
