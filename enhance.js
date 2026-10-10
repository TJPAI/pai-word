// PAI Word enhancement: sense-level spaced repetition + smart due review
const DAY=86400000, MIN=60000;
state.srs=state.srs||{};
state.studyCount=state.studyCount||0;

function srsRec(k){return state.srs[k]||{due:0,interval:0,ease:2.5,reps:0,lapses:0,last:0}}
function dueKeys(){const now=Date.now();return Object.keys(state.srs).filter(k=>state.srs[k].due<=now).sort((a,b)=>state.srs[a].due-state.srs[b].due)}
function upcomingKeys(){const now=Date.now();return Object.keys(state.srs).filter(k=>state.srs[k].due>now).sort((a,b)=>state.srs[a].due-state.srs[b].due)}
function fmtDue(ts){if(!ts)return '现在';const d=ts-Date.now();if(d<=0)return '已到期';if(d<60*MIN)return Math.max(1,Math.round(d/MIN))+' 分钟后';if(d<DAY)return Math.max(1,Math.round(d/(60*MIN)))+' 小时后';return Math.max(1,Math.round(d/DAY))+' 天后'}
function scheduleSense(k,grade){let r=srsRec(k),now=Date.now();r={...r};r.last=now;r.reps=(r.reps||0)+1;
  if(grade===1){r.interval=10*MIN;r.due=now+r.interval;r.ease=Math.max(1.3,(r.ease||2.5)-.2);r.lapses=(r.lapses||0)+1}
  else if(grade===2){r.interval=DAY;r.due=now+r.interval;r.ease=Math.max(1.3,(r.ease||2.5)-.1)}
  else if(grade===3){const prev=r.interval&&r.interval>=DAY?r.interval/DAY:1;const days=Math.max(3,Math.round(prev*(r.ease||2.5)));r.interval=days*DAY;r.due=now+r.interval}
  else {const prev=r.interval&&r.interval>=DAY?r.interval/DAY:2;const days=Math.max(7,Math.round(prev*((r.ease||2.5)+.5)));r.interval=days*DAY;r.due=now+r.interval;r.ease=Math.min(3.2,(r.ease||2.5)+.05)}
  state.srs[k]=r;
}

const baseRate=rate;
rate=function(n){const w=words[wi%words.length],s=active||senses(w)[0].id,k=`${w.w}::${s}`;scheduleSense(k,n);state.studyCount=(state.studyCount||0)+1;baseRate(n)};

function openSenseKey(k){const [w,s]=k.split('::');const ix=words.findIndex(x=>x.w===w);if(ix>=0)wi=ix;active=s;revealed=false;state.view='learn';save();render();window.scrollTo({top:0,behavior:'smooth'})}

const baseHome=home;
home=function(){const due=dueKeys().length,scheduled=Object.keys(state.srs).length,mastered=Object.entries(state.ratings).filter(([,v])=>v===4).length;
return shell(`<div class="hero"><div><h2>今天该学什么，系统替你决定</h2><p>按“单词 × 场景义项”分别安排复习；先处理快遗忘的，再学新内容。</p></div><button class="primary" onclick="${due?'openSenseKey(dueKeys()[0])':'nav(\'learn\')'}">${due?`复习 ${due} 个到期义项`:'开始新学习'}</button></div>
<div class="metric-row"><div class="metric"><span>今日到期</span><strong>${due}</strong></div><div class="metric"><span>已进入调度</span><strong>${scheduled}</strong></div><div class="metric"><span>熟练义项</span><strong>${mastered}</strong></div><div class="metric"><span>累计回答</span><strong>${state.studyCount||0}</strong></div></div>
<div class="grid2"><div class="card"><h3>今天的优先级</h3>${due?dueKeys().slice(0,6).map(k=>{const [w,s]=k.split('::');return `<div class="review-row"><div><b>${w}</b><div class="muted">${sname(s)} · ${fmtDue(state.srs[k].due)}</div></div><button onclick="openSenseKey('${k}')">现在复习</button></div>`}).join(''):`<div class="empty">当前没有到期项目。可以学习新义项。</div>`}</div>
<div class="card"><h3>记忆算法</h3><div class="principle"><b>1 忘记</b><p class="muted">约 10 分钟后再次出现。</p></div><div class="principle"><b>2 模糊</b><p class="muted">约 1 天后复习。</p></div><div class="principle"><b>3 认识</b><p class="muted">间隔按历史表现逐步拉长。</p></div><div class="principle"><b>4 熟练</b><p class="muted">快速扩展到一周、数周乃至更久。</p></div></div></div>`)};

const baseQueue=queue;
queue=function(kind){if(kind==='wrong')return baseQueue(kind);const due=dueKeys(),up=upcomingKeys();return shell(`<div class="hero"><div><h2>智能复习队列</h2><p>只把真正到期的义项放在前面，不按固定列表机械重复。</p></div></div><div class="metric-row"><div class="metric"><span>已到期</span><strong>${due.length}</strong></div><div class="metric"><span>未来已安排</span><strong>${up.length}</strong></div><div class="metric"><span>已调度义项</span><strong>${Object.keys(state.srs).length}</strong></div><div class="metric"><span>累计回答</span><strong>${state.studyCount||0}</strong></div></div><div class="card"><h3>现在应该复习</h3>${due.length?due.map(k=>{const [w,s]=k.split('::');return `<div class="review-row"><div><b>${w}</b><div class="muted">${sname(s)} · 已到期</div></div><button onclick="openSenseKey('${k}')">复习</button></div>`}).join(''):`<div class="empty">没有到期义项。继续学习新内容即可。</div>`}</div>${up.length?`<div class="card" style="margin-top:16px"><h3>之后会出现</h3>${up.slice(0,8).map(k=>{const [w,s]=k.split('::');return `<div class="review-row"><div><b>${w}</b><div class="muted">${sname(s)}</div></div><span class="muted">${fmtDue(state.srs[k].due)}</span></div>`}).join('')}</div>`:''}`)};

const baseStats=stats;
stats=function(){const vals=Object.values(state.ratings),due=dueKeys().length;return shell(`<div class="hero"><div><h2>学习统计</h2><p>统计单位是“场景义项”，而不是只看 headword 数量。</p></div></div><div class="metric-row"><div class="metric"><span>已测义项</span><strong>${vals.length}</strong></div><div class="metric"><span>今日到期</span><strong>${due}</strong></div><div class="metric"><span>熟练义项</span><strong>${vals.filter(x=>x===4).length}</strong></div><div class="metric"><span>累计回答</span><strong>${state.studyCount||0}</strong></div></div><div class="card"><h3>为什么这样排</h3><p class="muted">同一个词的不同含义会形成不同记忆曲线。例如你可以已经熟练掌握 issue 在职场中的“事项”，但金融中的“发行”仍在短间隔复习。</p></div>`)};

save();render();