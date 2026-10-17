const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');

function boot(){
  delete require.cache[require.resolve('../scene-search.js')];
  global.window=global;
  global.state={records:{}};
  global.save=()=>{};
  global.openScene=id=>id;
  delete global.PAI_SCENE500_CANDIDATES;
  const defs={
    cs018:['租房看房并询问居住条件','看房、房东、租约、水电与居住条件',['租房','看房','房东','租约','合同','水电','公寓','rent','landlord','lease','utilities']],
    cs043:['预订酒店并确认房型和政策','订房、房型、价格、取消与入住政策',['酒店','订房','预订','房型','取消','住宿','hotel','booking','reservation']],
    cs044:['酒店入住、房间与服务沟通','前台、入住、房间设施与酒店服务',['酒店入住','入住','前台','房间','住宿','hotel','check in','front desk']],
    cs046:['机场值机、托运和安检','值机、登机牌、行李托运与机场安检',['机场','值机','托运','行李','安检','登机牌','airport','check in','luggage','security']],
    cs047:['登机、航班延误与改签','登机、延误、取消、转机与改签',['航班','登机','延误','取消','改签','转机','飞机','flight','delay','board']],
    cs049:['过海关、签证与边境问答','入境、海关、签证、护照与边境问答',['入境','海关','签证','边境','护照','美国入境','customs','immigration','visa','passport']],
    cs076:['安排、参加和主持会议','日程、议程、讨论、汇报与会议决定',['会议','工作会议','商务会议','主持会议','议程','meeting','agenda','schedule']],
    cs079:['与客户沟通、服务和处理投诉','客户需求、支持、投诉与解决方案',['客户','客服','投诉','客户沟通','服务','client','customer','complaint','support']],
    cs088:['讨论人工智能和机器人应用','AI、机器人、算法、自动化与智能应用',['人工智能','ai','机器人','无人机','智能','算法','自动化','robot','drone','machine learning']],
    cs090:['工厂生产、自动化和质量控制','生产、自动化、设备、检测与质量控制',['工厂','生产','自动化','质量控制','仓储','仓库','盘点','物流','factory','warehouse','inventory','automation']],
    cs092:['阅读论文并总结研究不足','论文、研究方法、结果、证据与研究不足',['论文','研究','学术','文献','paper','research','study']],
    cs096:['学术会议报告、提问和答辩','会议报告、演讲、提问、讨论与学术社交',['学术会议','开会','会议报告','报告','答辩','学术交流','conference','academic conference','presentation']]
  };
  window.PAI_SCENE500={specs:Object.entries(defs).map(([id,[name,desc,tags]])=>({id,name,desc,tags}))};
  const units={};let rank=1000;
  for(const id of Object.keys(defs))units[id]=[{w:{rank:rank++,w:id}}];
  global.allUnits=id=>units[id]||[];
  require('../scene-search.js');
  return window.PAI_SCENE_SEARCH;
}

test('multi-intent academic travel query covers distinct intents',()=>{
  const api=boot();
  const ids=api.search('我要去美国参加学术会议，还要坐飞机和住酒店。','all',5).map(x=>x.id);
  assert.equal(ids[0],'cs096');
  assert.ok(ids.includes('cs049'));
  assert.ok(ids.some(id=>id==='cs043'||id==='cs044'));
  assert.ok(ids.some(id=>id==='cs046'||id==='cs047'));
  assert.equal(ids.length,5);
});

test('rental query favors rental scene and rejects weak noise',()=>{
  const api=boot();
  const ids=api.search('第一次租房，需要和房东沟通水电和合同','all',5).map(x=>x.id);
  assert.equal(ids[0],'cs018');
  assert.ok(!ids.includes('cs044'));
});

test('drone warehouse query spans automation and AI scenes',()=>{
  const api=boot();
  const ids=api.search('我要做无人机仓库盘点项目','all',5).map(x=>x.id);
  assert.ok(ids.includes('cs088'));
  assert.ok(ids.includes('cs090'));
});

test('difficulty excludes scenes with no words in the selected rank band',()=>{
  const api=boot();
  assert.equal(api.search('租房','high',5).length,0);
});

test('opening a recommendation persists its difficulty before delegating to existing openScene',()=>{
  const api=boot();
  let opened=null;global.openScene=id=>(opened=id);
  api.open('cs018','common');
  assert.equal(opened,'cs018');
  assert.equal(state.scene500DifficultyByScene.cs018,'common');
  assert.equal(state.scene500Recent[0],'cs018');
});

test('reviewed playable count is not presented as total candidate-pool size',()=>{
  const api=boot();
  const inv=api.inventory('cs018','all');
  assert.equal(inv.reviewedCount,1);
  assert.equal(inv.candidateCount,null);
  assert.equal(inv.candidatePoolStatus,'not_loaded');
  assert.equal(api.wordCount('cs018','all'),1);
});

test('candidate pool count stays separate when candidate inventory is available',()=>{
  const api=boot();
  global.PAI_SCENE500_CANDIDATES={summary:{candidatesByScene:{cs018:347}}};
  const inv=api.inventory('cs018','all');
  assert.equal(inv.reviewedCount,1);
  assert.equal(inv.candidateCount,347);
  assert.equal(inv.candidatePoolStatus,'available');
});
