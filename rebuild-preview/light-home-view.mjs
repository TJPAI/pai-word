const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
// Settings/statistics require persisted state + compact metadata, never teaching data.
export function createLightPanels({element,getState,budget,save,home}){
 const defaults={goodWithin:2,hardWithin:5,goodShow:2,hardShow:4,againShow:6,repeatCount:3,repeatGap:1};
 const names={goodWithin:'想起了：点击阈值（秒）',hardWithin:'模糊：点击阈值（秒）',goodShow:'想起了：答案展示（秒）',hardShow:'模糊：答案展示（秒）',againShow:'没想起：答案展示（秒）',repeatCount:'重读次数',repeatGap:'每遍读完后的间隔（秒）'};
 const row=(label,body)=>`<label class="setting-row"><span>${label}</span>${body}</label>`;
 const select=(key,values,value)=>`<select data-setting="${key}">${values.map(([v,l])=>`<option value="${v}" ${String(value)===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
 const check=(key,value)=>`<input type="checkbox" data-setting="${key}" ${value?'checked':''}>`;
 function render(kind){
  const s=getState(),b=budget();let body;
  if(kind==='stats')body=[['已学习义项',b.studied],['旧版待确认记录',Object.keys(s.legacySrsPending||{}).length],['知道',s.stats?.known||0],['不知道',s.stats?.unknown||0],['到期复习',b.due],['今日新词',`${b.dailyCompleted}/${b.dailyLimit}`]].map(([l,v])=>`<div class="stat-row"><span>${l}</span><b>${v}</b></div>`).join('');
  else body=row('每日新词',select('newPerDay',[25,50,100,200].map(n=>[n,n]),b.dailyLimit))+row('每轮单词数',select('wordsPerRound',[10,25,50].map(n=>[n,n]),b.roundLimit))+row('发音口音',select('voiceAccent',[['us','美音'],['gb','英音']],s.voiceAccent||'us'))+[['hideWord','隐藏单词（听音模式）',s.hideWord===true],['showCollocations','显示高频搭配',s.showCollocations!==false],['showExamples','显示可用例句',s.showExamples!==false],['showCompare','显示近义 / 易混词辨析',s.showCompare!==false],['auto:question','进入题目页自动读单词',s.autoPronounce?.question!==false],['auto:swipe','进入答案页自动读单词',s.autoPronounce?.swipe!==false]].map(([k,l,v])=>row(l,check(k,v))).join('')+'<h3>点击节奏</h3>'+Object.entries(defaults).map(([k,v])=>row(names[k],`<input type="number" data-setting="timing:${k}" min="${k==='repeatGap'?0:k==='repeatCount'?1:.1}" max="${k==='repeatCount'?10:60}" step="${k==='repeatCount'?1:.1}" value="${esc(s.tapTiming?.[k]??v)}">`)).join('')+'<button data-panel-action="reset">恢复默认节奏</button>';
  element.innerHTML=`<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" data-panel-action="home">‹</button><h2>${kind==='stats'?'统计':'设置'}</h2></div><div class="panel-block">${body}</div></div>`;
 }
 element.addEventListener('click',e=>{const action=e.target.closest('[data-panel-action]')?.dataset.panelAction;if(action==='home')home();if(action==='reset'){const s=getState(),before=s.tapTiming;s.tapTiming={...defaults};try{save();render('settings')}catch(error){s.tapTiming=before;alert('保存失败：'+error.message)}}});
 element.addEventListener('change',e=>{
  const k=e.target.dataset.setting;if(!k)return;const s=getState(),before=JSON.parse(JSON.stringify(s));
  if(k.startsWith('timing:')){const key=k.slice(7),v=Number(e.target.value);if(e.target.value===''||!Number.isFinite(v))return;s.tapTiming={...defaults,...s.tapTiming,[key]:Math.max(key==='repeatCount'?1:key==='repeatGap'?0:.1,Math.min(key==='repeatCount'?10:60,v))};s.tapTiming.repeatCount=Math.round(s.tapTiming.repeatCount);s.tapTiming.hardWithin=Math.max(s.tapTiming.goodWithin,s.tapTiming.hardWithin)}
  else if(k.startsWith('auto:'))s.autoPronounce={question:true,swipe:true,...s.autoPronounce,[k.slice(5)]:e.target.checked};
  else if(k==='newPerDay'||k==='wordsPerRound'){const n=Number(e.target.value);if(!(k==='newPerDay'?[25,50,100,200]:[10,25,50]).includes(n))return;s[k]=n;if(k==='newPerDay')s.daily=null}
  else s[k]=e.target.type==='checkbox'?e.target.checked:e.target.value;
  try{save();render('settings')}catch(error){for(const key of Object.keys(s))delete s[key];Object.assign(s,before);render('settings');alert('保存失败：'+error.message)}
 });
 return {render};
}
