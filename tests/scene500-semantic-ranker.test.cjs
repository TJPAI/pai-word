const assert=require('node:assert/strict');
const fs=require('node:fs');
const ranker=require('../scripts/scene500-semantic-ranker.cjs');
const overlay=JSON.parse(fs.readFileSync('data/scene500-semantic-overlay-v0.2.json','utf8'));
const scenes=overlay.scenes;
assert.equal(Object.keys(scenes).length,25);
for(const [id,s] of Object.entries(scenes)){
  assert.match(id,/^S0[0-2][0-9]$/);
  for(const f of ['name','description_enriched','aliases','actions','objects','example_queries'])
    assert.ok(s[f]&&(typeof s[f]==='string'?s[f].length:s[f].length>0),id+':'+f);
}
const cases=[
 ['早上起来先刷牙洗脸','S002'],
 ['我去快递柜取包裹','S023'],
 ['洗衣机洗完衣服怎么晾晒','S006'],
 ['塑料瓶如何分类回收','S024'],
 ['我想看电视追剧','S011'],
 ['帮我打包搬家','S021'],
 ['我想和新邻居打招呼','S022'],
 ['厨房洗碗和清洁水槽','S009']
];
for(const [q,want] of cases){
 const result=ranker.rank(q,scenes,{limit:25});
 assert.equal(result[0]?.id,want,q+': '+JSON.stringify(result.slice(0,3)));
}
const contrasts=[
 ['晚上准备睡觉关灯','S025','S001'],
 ['早晨起床准备出门','S001','S025'],
 ['我想收拾房间整理卧室','S004','S005'],
 ['今天打扫拖地做家务','S005','S004'],
 ['洗菜切菜准备做饭','S007','S008'],
 ['全家坐在餐桌一起吃饭','S008','S007'],
 ['我要照看婴儿宝宝','S013','S014'],
 ['照顾老人和长辈','S014','S013']
];
for(const [q,winner,loser] of contrasts){
 const r=ranker.rank(q,scenes,{limit:25,minScore:0});
 assert.ok(r.findIndex(x=>x.id===winner)<r.findIndex(x=>x.id===loser),q);
}
const rows=ranker.rank('起床',scenes,{limit:20,minScore:0});
assert.deepEqual(ranker.page(rows,0).map(x=>x.id),rows.slice(0,5).map(x=>x.id));
assert.deepEqual(ranker.page(rows,1).map(x=>x.id),rows.slice(5,10).map(x=>x.id));
assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
assert.deepEqual(ranker.rank('  ',scenes),[]);
console.log('PASS: 25 schema records, 8 query fixtures, deterministic pagination, unique results, blank query');
