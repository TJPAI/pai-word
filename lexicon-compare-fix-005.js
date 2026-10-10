// Complete synonym distinctions for high-value batch-001 senses.
(function(){
  function set(word,scene,words,note,examples){
    const w=WORDS.find(x=>x.w===word); if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples};
  }

  set('conduct','academic',['conduct','perform','carry out'],'conduct 较正式，常与 research/study 搭配；perform 常用于实验或具体操作；carry out 较通用，强调把计划或任务执行完成。',[
    'We conducted a controlled study.',
    'The technician performed the calibration procedure.',
    'The team carried out a series of field tests.'
  ]);
  set('conduct','work',['conduct','lead','run'],'conduct 强调正式组织并实施某个过程；lead 强调带领人员或项目；run 更口语，常指负责日常运作。',[
    'She conducted five interviews this week.',
    'He led the project team for six months.',
    'She runs the customer support operation.'
  ]);

  set('context','academic',['context','background','setting'],'context 是理解信息所需的上下文；background 是更广泛的背景知识；setting 强调研究或事件发生的具体环境。',[
    'The result must be interpreted in context.',
    'The introduction provides the necessary background.',
    'The experiment was conducted in a controlled laboratory setting.'
  ]);
  set('context','social',['context','situation','circumstance'],'context 强调言行所处的语境；situation 是当前具体情形；circumstance 常指影响事件的外部条件。',[
    'The comment sounds rude out of context.',
    'In that situation, staying silent was reasonable.',
    'Under those circumstances, postponing the meeting made sense.'
  ]);

  set('contract','work',['contract','agreement','deal'],'contract 是具有正式法律约束力的合同；agreement 更广，指双方达成的一致；deal 更口语，强调交易或安排。',[
    'Both parties signed the contract.',
    'We reached an agreement on the delivery date.',
    'The two companies closed the deal last Friday.'
  ]);
  set('contract','public',['contract','outsource','commission'],'contract with 强调通过合同委托外部机构；outsource 强调把原本内部工作外包；commission 强调正式委托某项专门工作。',[
    'The city contracted with a private operator.',
    'The agency outsourced its IT support.',
    'The council commissioned an independent safety review.'
  ]);

  set('decline','finance',['decline','drop','fall'],'decline 常表示较正式或持续的下降；drop 更强调明显、突然的下跌；fall 是最普通、最中性的“下降”。',[
    'Sales declined throughout the quarter.',
    'The share price dropped twelve percent in one day.',
    'Borrowing costs fell after the announcement.'
  ]);
  set('decline','social',['decline','refuse','reject'],'decline 是较礼貌、正式的拒绝；refuse 更直接，强调不愿做；reject 常用于拒绝提议、申请或方案。',[
    'She politely declined the invitation.',
    'He refused to answer the question.',
    'The committee rejected the proposal.'
  ]);

  set('deliver','work',['deliver','complete','provide'],'deliver 强调按承诺交付成果；complete 强调把任务做完；provide 强调提供资源、服务或信息。',[
    'The team delivered the project on time.',
    'We completed all testing before launch.',
    'The vendor provided technical support during deployment.'
  ]);
  set('deliver','daily',['deliver','send','ship'],'deliver 强调送达到收件人；send 只表示把东西发出；ship 多指通过物流系统运输商品。',[
    'The package was delivered this morning.',
    'I sent the documents by email.',
    'The seller shipped the order yesterday.'
  ]);

  set('demand','finance',['demand','need','consumption'],'demand 是有购买意愿和支付能力的市场需求；need 是一般意义上的需要；consumption 是实际发生的消费量。',[
    'Demand for electric vehicles remains strong.',
    'There is a growing need for affordable housing.',
    'Electricity consumption peaked in July.'
  ]);
  set('demand','work',['demand','require','request'],'demand 语气较强，表示强烈要求或高度需要；require 表示客观条件上的需要；request 是礼貌地提出请求。',[
    'The role demands strong communication skills.',
    'The job requires three years of experience.',
    'She requested additional time to finish the report.'
  ]);

  set('evidence','academic',['evidence','proof','data'],'evidence 是支持判断或结论的证据；proof 表示足以证明某事的决定性依据；data 是数据本身，不一定能直接支持结论。',[
    'The experiments provide strong evidence for the hypothesis.',
    'The theorem gives formal proof of the result.',
    'The dataset contains measurements from five hundred trials.'
  ]);
  set('evidence','public',['evidence','proof','clue'],'evidence 是可用于判断事实的证据；proof 是足以确定事实的证明；clue 是帮助调查的线索。',[
    'Investigators collected evidence from the scene.',
    'The video provided proof that the vehicle entered the area.',
    'A receipt provided a useful clue.'
  ]);

  set('feature','tech',['feature','function','capability'],'feature 是产品面向用户的功能或特性；function 强调某个具体功能作用；capability 强调系统整体具备的能力。',[
    'The update adds a new privacy feature.',
    'The search function can be disabled in settings.',
    'The device has the capability to operate offline.'
  ]);
  set('feature','academic',['feature','variable','attribute'],'feature 常指用于分析或建模的特征；variable 是可取不同数值的变量；attribute 是对象本身的属性。',[
    'The model uses spatial features as input.',
    'Temperature is one of the measured variables.',
    'Color is an important attribute of the material.'
  ]);

  set('impact','public',['impact','effect','consequence'],'impact 强调较显著的影响；effect 是一般意义上的作用或效果；consequence 常强调由某事带来的后果。',[
    'The policy had a major impact on housing costs.',
    'The new rule had little effect on traffic volume.',
    'One consequence was a rise in waiting times.'
  ]);
  set('impact','work',['impact','effect','influence'],'impact 常强调可见、可衡量的业务结果；effect 是一般效果；influence 更偏持续、间接的影响。',[
    'The outage had little impact on customers.',
    'The training had a positive effect on response time.',
    'Her leadership style influenced the whole team.'
  ]);

  set('maintain','tech',['maintain','repair','support'],'maintain 是持续维护使系统保持正常；repair 是出现故障后进行修复；support 是持续提供技术或用户支持。',[
    'The team maintains the platform.',
    'The technician repaired the failed sensor.',
    'The vendor supports the software for five years.'
  ]);
  set('maintain','work',['maintain','preserve','sustain'],'maintain 是保持既有状态；preserve 强调保护某种价值或状态不受损；sustain 强调长期维持。',[
    'We maintain high safety standards.',
    'The policy is designed to preserve employee trust.',
    'The company needs to sustain growth over time.'
  ]);

  set('measure','academic',['measure','assess','evaluate'],'measure 强调用量化手段测量；assess 强调判断状态或程度；evaluate 强调按标准综合判断价值或表现。',[
    'We measured the positioning error.',
    'We assessed the reliability of the method.',
    'The reviewers evaluated the model against three benchmarks.'
  ]);
  set('measure','public',['measure','action','policy'],'measure 是为达到目的采取的具体措施；action 是一般行动；policy 是较系统、长期的政策安排。',[
    'The city introduced measures to reduce traffic.',
    'Officials took immediate action after the warning.',
    'The government adopted a new housing policy.'
  ]);

  set('policy','public',['policy','rule','law'],'policy 是政府或组织的总体方针；rule 是具体规则；law 是具有法律强制力的法律。',[
    'The city adopted a new housing policy.',
    'The building has a rule against smoking indoors.',
    'The new law takes effect next January.'
  ]);
  set('policy','work',['policy','procedure','guideline'],'policy 规定原则和边界；procedure 规定具体操作步骤；guideline 是建议性指导，通常没有强制性。',[
    'The company updated its remote-work policy.',
    'The procedure explains how to request access.',
    'The guideline recommends reviewing passwords every six months.'
  ]);

  set('reserve','travel',['reserve','book','hold'],'reserve 与 book 都表示预订，reserve 略正式；book 更日常；hold 强调暂时为某人保留位置或房间。',[
    'We reserved a table for eight.',
    'I booked a hotel room online.',
    'The hotel can hold the room until six o’clock.'
  ]);
  set('reserve','finance',['reserve','fund','capital'],'reserve 是为未来风险或支出预留的资金；fund 是指定用途的一笔资金；capital 是用于经营或投资的资本。',[
    'The bank increased its cash reserves.',
    'The project is financed by a dedicated fund.',
    'The company raised new capital from investors.'
  ]);

  set('secure','tech',['secure','protect','encrypt'],'secure 是整体确保系统或资源安全；protect 是一般意义上的保护；encrypt 专指用加密算法保护数据。',[
    'We secured the server before launch.',
    'The firewall protects the internal network from unauthorized access.',
    'Sensitive data are encrypted at rest.'
  ]);
  set('secure','work',['secure','obtain','win'],'secure 强调经过努力成功获得；obtain 中性地表示获得；win 常表示在竞争中赢得。',[
    'The team secured funding for the project.',
    'We obtained approval from the client.',
    'The company won a major government contract.'
  ]);
})();
