// Synonym comparison completions: original core + early production words.
(function(){
  function set(word,scene,words,note,examples){
    const w=WORDS.find(x=>x.w===word); if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples};
  }

  set('issue','work',['issue','problem','matter'],'issue 较中性，指需要处理或讨论的事项；problem 明确表示困难或故障；matter 更泛指事情或待处理事项。',[
    'We need to discuss the staffing issue.',
    'The server has a serious problem.',
    'This matter should be resolved before Friday.'
  ]);
  set('issue','academic',['issue','question','problem'],'issue 强调值得讨论的议题；question 强调待回答的问题；problem 常指待解决的研究难题。',[
    'The paper addresses an important ethical issue.',
    'The study asks a clear research question.',
    'Data sparsity remains a difficult research problem.'
  ]);
  set('issue','public',['issue','problem','concern'],'issue 是公共议题；problem 强调实际困难；concern 强调令人担忧之处。',[
    'Housing affordability is a major policy issue.',
    'Traffic congestion is a serious urban problem.',
    'Air quality remains a major public concern.'
  ]);
  set('issue','finance',['issue','release','offer'],'issue 指正式发行证券；release 多指发布信息或产品；offer 在金融里强调向投资者发售。',[
    'The company issued new shares to raise capital.',
    'The bank released its annual report yesterday.',
    'The bonds were offered to institutional investors.'
  ]);

  set('interest','social',['interest','curiosity','hobby'],'interest 是较广泛的兴趣；curiosity 强调好奇心；hobby 是长期从事的业余爱好。',[
    'She has a strong interest in jazz.',
    'His curiosity led him to ask more questions.',
    'Photography has been her hobby for years.'
  ]);
  set('interest','finance',['interest','return','yield'],'interest 是借贷产生的利息；return 是投资总回报；yield 常指按价格计算的收益率。',[
    'The loan carries four percent interest.',
    'The fund delivered a strong annual return.',
    'The bond currently offers a yield of 3.8 percent.'
  ]);
  set('interest','public',['interest','benefit','stake'],'interest 常指个人或群体的利益；benefit 是具体好处；stake 强调与结果相关的利害关系。',[
    'The rule protects the public interest.',
    'The policy provides a direct benefit to low-income families.',
    'Local residents have a direct stake in the decision.'
  ]);

  set('approach','work',['approach','method','strategy'],'approach 是总体处理思路；method 是具体做法；strategy 是为实现目标制定的整体计划。',[
    'We adopted a phased approach to the rollout.',
    'This method cuts processing time in half.',
    'Our strategy is to enter the market gradually.'
  ]);
  set('approach','academic',['approach','method','framework'],'approach 是研究路径；method 是具体方法；framework 是组织概念或分析的框架。',[
    'The study uses a data-driven approach.',
    'The experiment uses a Bayesian estimation method.',
    'The paper proposes a unified theoretical framework.'
  ]);
  set('approach','social',['approach','contact','address'],'approach 强调主动接近并开始交流；contact 强调建立联系；address 强调向某人讲话或正式处理某议题。',[
    'She approached her manager after the meeting.',
    'She contacted her manager by email.',
    'The chair addressed the audience before the ceremony.'
  ]);

  set('deploy','tech',['deploy','install','release'],'deploy 强调把系统投入运行环境；install 强调安装；release 强调正式发布版本。',[
    'We deployed the model to production.',
    'We installed the software on the server.',
    'The team released version 2.0 last week.'
  ]);
  set('deploy','public',['deploy','dispatch','station'],'deploy 强调有计划地部署资源；dispatch 强调派出；station 强调长期驻守某地。',[
    'The city deployed extra crews after the storm.',
    'The agency dispatched two teams immediately.',
    'Additional officers were stationed near the station.'
  ]);
  set('deploy','work',['deploy','assign','allocate'],'deploy 强调把人或能力投入使用；assign 强调分配任务；allocate 强调分配资源额度。',[
    'We deployed a small team to the project.',
    'The manager assigned each engineer a task.',
    'The director allocated more budget to customer support.'
  ]);

  set('plot','culture',['plot','story','narrative'],'plot 是事件如何展开的情节结构；story 是整个故事；narrative 更强调叙述方式和视角。',[
    'The film has a simple plot.',
    'The story follows a family across three generations.',
    'The novel uses a nonlinear narrative.'
  ]);
  set('plot','academic',['plot','chart','graph'],'plot 作动词强调把变量关系画出来；chart 更常指图表呈现；graph 强调坐标关系图。',[
    'We plotted error against signal-to-noise ratio.',
    'The chart summarizes the monthly results.',
    'The graph shows a nearly linear relationship.'
  ]);
  set('plot','public',['plot','plan','scheme'],'plot 通常含秘密或非法意图；plan 中性；scheme 可中性，也可带可疑意味。',[
    'Police uncovered a plot to steal confidential data.',
    'The city announced a plan to improve public transit.',
    'Investigators exposed a fraudulent investment scheme.'
  ]);

  set('symptom','health',['symptom','sign','condition'],'symptom 是患者感受到或表现出的症状；sign 是可客观观察的体征；condition 是疾病或健康状态本身。',[
    'A sore throat is a common symptom of infection.',
    'A high temperature can be a clinical sign of illness.',
    'Diabetes is a chronic medical condition.'
  ]);
  set('symptom','work',['symptom','cause','indicator'],'symptom 是深层问题的外在表现；cause 是根因；indicator 是提示某种状态的指标。',[
    'High turnover may be a symptom of poor management.',
    'Poor communication was the main cause of the delay.',
    'Low retention is an indicator of employee dissatisfaction.'
  ]);

  set('estimate','academic',['estimate','calculate','predict'],'estimate 是基于数据作近似估计；calculate 强调按公式计算；predict 强调预测未来或未知结果。',[
    'We estimate the position from noisy measurements.',
    'We calculate the exact distance from the known coordinates.',
    'The model predicts future demand from historical data.'
  ]);
  set('estimate','work',['estimate','quote','forecast'],'estimate 是初步估算；quote 是向客户正式报价；forecast 是对未来的预测。',[
    'Can you estimate how long the migration will take?',
    'The supplier quoted us twelve thousand dollars for the work.',
    'The team forecasts stronger sales next quarter.'
  ]);
  set('estimate','finance',['estimate','valuation','forecast'],'estimate 是近似判断；valuation 是正式估值；forecast 是对未来财务指标的预测。',[
    'Analysts estimate annual revenue at eight million dollars.',
    'The formal valuation placed the company at fifty million dollars.',
    'The forecast projects slower revenue growth next year.'
  ]);

  set('ability','work',['ability','skill','competence'],'ability 是一般能力；skill 是训练形成的具体技能；competence 强调达到工作要求的胜任能力。',[
    'Her ability to explain complex ideas is valuable.',
    'Writing clearly is an important professional skill.',
    'The role requires competence in project management.'
  ]);
  set('ability','academic',['ability','aptitude','skill'],'ability 是已经具备的能力；aptitude 更偏潜在天赋；skill 是通过训练获得的具体技能。',[
    'The test measures reasoning ability.',
    'The assessment is designed to identify mathematical aptitude.',
    'Academic writing is a skill that improves with practice.'
  ]);

  set('account','finance',['account','balance','statement'],'account 是账户；balance 是账户余额；statement 是一段时期的账户对账单。',[
    'She opened a savings account.',
    'Her account balance is two thousand four hundred dollars.',
    'The monthly statement lists every transaction.'
  ]);
  set('account','academic',['account','explanation','description'],'account 是较系统的叙述或解释；explanation 强调说明原因；description 主要描述特征或过程。',[
    'The paper gives a detailed account of the experiment.',
    'The authors provide an explanation for the unexpected result.',
    'The report includes a clear description of the procedure.'
  ]);

  set('charge','finance',['charge','fee','cost'],'charge 是收取费用这一行为或收费项目；fee 常指服务费；cost 是实际成本或价格。',[
    'The hotel charges for late checkout.',
    'The bank applies a monthly service fee.',
    'The total cost includes taxes and delivery.'
  ]);
  set('charge','tech',['charge','power','energize'],'charge 强调给电池储能；power 强调给设备供电；energize 指使电路或设备带电。',[
    'Charge the battery before use.',
    'The adapter powers the device during operation.',
    'The technician energized the circuit after the safety check.'
  ]);

  set('claim','academic',['claim','argument','finding'],'claim 是需要证据支持的主张；argument 是支持主张的推理链条；finding 是研究得到的结果。',[
    'The authors make a strong theoretical claim.',
    'The argument relies on two key assumptions.',
    'The main finding is supported by three experiments.'
  ]);
  set('claim','public',['claim','state','assert'],'claim 常暗示真实性仍待验证；state 中性地陈述；assert 更强势地断言。',[
    'The company claims the process reduces waste.',
    'The report states that emissions fell last year.',
    'The spokesperson asserted that the allegations were false.'
  ]);
})();
