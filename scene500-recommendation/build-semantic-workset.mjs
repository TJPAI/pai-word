// Scene500 semantic candidate overlay V0.1: explicit human-authored topic families.
// This is a RECALL PROPOSAL WORKSET, never a runtime/approved association pack.
// CLI: node scene500-recommendation/build-semantic-workset.mjs runtime.json catalog.json baseline.json output.json
import fs from 'node:fs';
const [lexPath,catPath,assocPath,outPath]=process.argv.slice(2);
if(!lexPath||!catPath||!assocPath||!outPath)throw Error('USAGE: build-semantic-workset.mjs runtime.json catalog.json baseline.json output.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [lex,catalog,baseline]=[lexPath,catPath,assocPath].map(read);
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||catalog.scene_count!==500||baseline.links?.length!==3553)throw Error('INCOMPATIBLE_INPUT');
const groups=[
 {family:'mathematics',words:'数学 代数 几何 微积分 概率 统计学 三角函数 微分 积分 方程 数论 拓扑学 线性代数 概率论 数理逻辑',scenes:['S126','S137','S141','S132','S153']},
 {family:'physical_science',words:'物理 量子力学 相对论 力学 电磁学 热力学 光学 声学 粒子物理 量子物理 核物理 物理学',scenes:['S134','S137','S126','S151','S153']},
 {family:'chemistry',words:'化学 有机化学 无机化学 分析化学 生物化学 化学反应 分子 化合物 元素 化学实验 化学式',scenes:['S134','S156','S126','S137','S153']},
 {family:'astronomy',words:'天文 天文学 宇宙 星系 恒星 行星 黑洞 星云 天体 太阳系 天文望远镜',scenes:['S137','S135','S151','S153','S126']},
 {family:'philosophy',words:'哲学 伦理学 逻辑学 形而上学 认识论 存在主义 实用主义 辩证法 唯物主义 理性主义',scenes:['S132','S137','S153','S144','S126']},
 {family:'public_affairs',words:'政治 政治学 民主 选举 政府 政策 议会 外交 国际关系 公民权利 公共政策',scenes:['S418','S421','S132','S137','S144']},
 {family:'economics',words:'经济 经济学 宏观经济 微观经济 通货膨胀 利率 国内生产总值 市场经济 经济增长 国际贸易 经济政策',scenes:['S421','S137','S132','S153','S126']},
 {family:'biology',words:'生物 生物学 细胞 遗传学 基因 进化论 生态学 微生物 生命科学 生理学 免疫学',scenes:['S134','S156','S137','S153','S126']},
 {family:'history',words:'历史 历史学 考古学 古代史 近代史 史料 文明 历史研究 历史事件',scenes:['S137','S135','S132','S144','S153']},
 {family:'geography',words:'地理 地理学 地质学 地貌 地球科学 火山 地震 地理位置',scenes:['S137','S126','S134','S135','S153']},
 {family:'computer_science',words:'计算机 计算机科学 软件工程 编程 算法 数据结构 人工智能 机器学习 深度学习 神经网络 网络安全 数据分析 数据库',scenes:['S300','S137','S151','S153','S132']},
 {family:'education',words:'教育 教育学 教学法 课程设计 教材 作业 课本 习题 试卷 复习',scenes:['S126','S127','S141','S135','S132']},
 {family:'literature',words:'文学 小说 散文 诗歌 诗词 诗人 作家 文学作品 文学批评 传记',scenes:['S357','S358','S416','S135','S132']},
 {family:'books',words:'书 书籍 图书 读物 教科书 参考书 漫画书 电子书 书本',scenes:['S059','S416','S135','S357','S358']},
 {family:'legal',words:'法律 法学 法规 法庭 诉讼 律师 法律援助 法律咨询 法律责任',scenes:['S410','S233','S137','S421','S132']},
 {family:'career',words:'职业 求职 招聘 简历 面试 工作经验 员工 职位 职业发展',scenes:['S202','S213','S179','S181','S192']},
 {family:'science_methods',words:'科研 科学研究 实验室 学术研究 实验设计 研究方法 研究课题 学术论文',scenes:['S151','S156','S153','S134','S144']}
];
const lexByTerm=new Map(lex.terms.map(t=>[t.term,t]));
const existing=new Set(baseline.links.map(x=>x.term_id+'\u0000'+x.scene_id));
const proposed=new Map(),absent=[];
for(const g of groups){
 for(const word of g.words.split(/\s+/u).filter(Boolean)){
  const t=lexByTerm.get(word);
  if(!t){absent.push({family:g.family,term:word});continue;}
  if(t.stopword_hint===true)continue;
  for(let i=0;i<g.scenes.length;i++){
   const scene_id=g.scenes[i];
   if(!catalog.scenes[scene_id])throw Error('INVALID_SCENE '+scene_id);
   const key=t.term_id+'\u0000'+scene_id;
   if(existing.has(key))continue;
   if(!proposed.has(key))proposed.set(key,{
    term_id:t.term_id,term:t.term,scene_id,scene_name:catalog.scenes[scene_id].name,
    family:g.family,proposed_rank:i+1,relation:'topical_context_candidate',
    evidence_type:'editorial_topic_family',confidence:null,
    status:'review_required_not_approved',release_eligible:false
   });
  }
 }
}
const candidates=[...proposed.values()].sort((a,b)=>a.term_id.localeCompare(b.term_id)||a.proposed_rank-b.proposed_rank||a.scene_id.localeCompare(b.scene_id));
const baselineTerms=new Set(baseline.links.map(x=>x.term_id));
const result={schema:'scene500-semantic-workset-v0.1',status:'NOT_APPROVED',runtime_version:lex.data_version,
 baseline:{links:baseline.links.length,linkedTerms:baselineTerms.size},
 proposed:{links:candidates.length,terms:new Set(candidates.map(x=>x.term_id)).size,
 newlyLinkedTerms:new Set(candidates.filter(x=>!baselineTerms.has(x.term_id)).map(x=>x.term_id)).size,
 families:groups.length,missingTerms:absent.length},
 absent, candidates};
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,proposed:result.proposed},null,2));
