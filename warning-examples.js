// PAI Word: concrete examples for every usage warning in the current experience set.
const WARNING_EXAMPLES={
'issue::work':{bad:'We have a serious problem to discuss: the meeting time.',good:'We have an issue to discuss: the meeting time.',why:'普通待处理事项用 issue 更自然；problem 往往明确带有“出了问题”的负面意味。'},
'issue::academic':{bad:'This paper studies an error of research ethics.',good:'This paper studies an issue in research ethics.',why:'学术语境中的 issue 常指值得讨论的议题，并不意味着存在“错误”。'},
'issue::public':{bad:'Housing affordability is a public problem everyone is debating.',good:'Housing affordability is a major public issue.',why:'公共讨论对象通常用 issue；problem 更强调其负面后果。'},
'issue::finance':{bad:'The company problem new shares to raise capital.',good:'The company issued new shares to raise capital.',why:'金融中的 issue 可作动词，表示“发行（股票、债券等）”。'},
'interest::social':{bad:'I am interest in classical music.',good:'I am interested in classical music.',why:'interest 是名词/动词；形容“某人感兴趣”要用 be interested in。'},
'interest::finance':{bad:'The bank pays a 4% interest rate to my account every year.',good:'The account pays 4% interest per year.',why:'interest 是“利息”；interest rate 是“利率”。两者不要互换。'},
'interest::public':{bad:'The policy protects the interests in history.',good:'The policy protects the public interest.',why:'interest/interests 在公共语境可表示“利益/权益”，不能机械理解为“兴趣”。'},
'approach::work':{bad:'We need a new method to manage the whole transformation strategy.',good:'We need a new approach to managing the whole transformation.',why:'总体思路更适合 approach；method 通常偏具体方法或步骤。'},
'approach::academic':{bad:'The paper proposes a theoretical method based on a new worldview.',good:'The paper proposes a new theoretical approach.',why:'研究框架、理论视角往往用 approach；method 更偏可执行技术步骤。'},
'approach::social':{bad:'She approached to her manager about the schedule.',good:'She approached her manager about the schedule.',why:'approach 作动词通常直接接宾语，不加 to。'},
'deploy::tech':{bad:'I deployed the app on my laptop by double-clicking the installer.',good:'We deployed the app to the production server.',why:'deploy 强调发布到运行环境；单机安装通常用 install。'},
'deploy::public':{bad:'The city installed more firefighters after the storm.',good:'The city deployed more firefighters after the storm.',why:'人员或资源被调往现场时用 deploy，而不是 install。'},
'deploy::work':{bad:'We installed two senior engineers on the urgent project.',good:'We deployed two senior engineers to the urgent project.',why:'把人员能力投入任务可用 deploy；install 不用于这种人员调配。'},
'plot::culture':{bad:'The movie has a good story plot about a family.',good:'The movie has a simple plot but a moving story.',why:'plot 强调事件如何展开的“情节结构”；story 指更广义的“故事”。'},
'plot::academic':{bad:'We plotted temperature with time.',good:'We plotted temperature against time.',why:'表达两个变量关系时，常用 plot A against B。'},
'plot::public':{bad:'They made a plot for next year’s marketing campaign.',good:'Police uncovered a plot to steal confidential data.',why:'plot 表“密谋”时通常含秘密、非法或不正当意味；普通计划用 plan。'},
'symptom::health':{bad:'A high temperature measured by the nurse is only a symptom.',good:'Fatigue is a symptom; a measured fever can be a clinical sign.',why:'symptom 偏患者主观感受到的症状；sign 常指可客观观察或测量的体征。'},
'symptom::work':{bad:'High turnover is the root cause of poor management.',good:'High turnover may be a symptom of poor management.',why:'比喻义 symptom 强调“外在表现”，不等于根因。'},
'estimate::academic':{bad:'We guessed the parameter from 10,000 observations.',good:'We estimated the parameter from 10,000 observations.',why:'有数据或模型依据的推断通常用 estimate；guess 更像缺乏依据的猜测。'},
'estimate::work':{bad:'Give me an exact rough estimate by noon.',good:'Give me a rough estimate by noon.',why:'rough estimate 本身就是近似值，不应同时要求 exact。'},
'estimate::finance':{bad:'The auditor’s formal valuation is just a random estimate.',good:'Analysts estimate the asset value at about $8 million.',why:'estimate 是近似判断；正式、系统的资产估值通常用 valuation。'}
};

(function(){
  const style=document.createElement('style');
  style.textContent=`.warning-example{margin-top:12px;padding-top:12px;border-top:1px solid #fed7aa}.warning-line{display:grid;grid-template-columns:48px 1fr;gap:8px;margin:7px 0;line-height:1.55}.warning-label{font-weight:800;font-size:12px}.warning-line.bad .warning-label{color:#b91c1c}.warning-line.good .warning-label{color:#047857}.warning-why{margin-top:8px;color:#6b7280;font-size:13px;line-height:1.55}`;
  document.head.appendChild(style);

  function currentKey(){
    if(state.view==='learn'){
      const w=words[wi%words.length];
      const sid=active||senses(w)[0].id;
      return `${w.w}::${sid}`;
    }
    if(state.view==='detail'){
      const w=words.find(x=>x.w===detailWord)||words[0];
      const sid=active||senses(w)[0].id;
      return `${w.w}::${sid}`;
    }
    return null;
  }

  function enhanceWarning(){
    const box=document.querySelector('.warnbox');
    if(!box||box.querySelector('.warning-example'))return;
    const ex=WARNING_EXAMPLES[currentKey()];
    if(!ex)return;
    const wrap=document.createElement('div');
    wrap.className='warning-example';
    wrap.innerHTML=`<div class="warning-line bad"><span class="warning-label">✕ 错误</span><span>${ex.bad}</span></div><div class="warning-line good"><span class="warning-label">✓ 正确</span><span>${ex.good}</span></div><div class="warning-why"><b>为什么：</b>${ex.why}</div>`;
    box.appendChild(wrap);
  }

  const previousRender=render;
  render=function(){previousRender();enhanceWarning()};
  render();
})();