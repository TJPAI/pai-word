// PAI Word synonym distinctions: original 7 words + lexicon batch 001.
(function(){
  function add(word,scene,words,note,a,b){
    const w=WORDS.find(x=>x.w===word); if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples:[a,b]};
  }

  add('issue','work',['issue','problem','matter'],'issue 较中性，指需要处理或讨论的事项；problem 明确表示困难或故障；matter 更泛指事情。','We need to discuss the staffing issue.','The server has a serious problem.');
  add('issue','academic',['issue','question','problem'],'issue 强调值得讨论的议题；question 强调待回答的问题；problem 常指待解决的难题。','The paper addresses an ethical issue.','The study asks an important research question.');
  add('issue','public',['issue','problem','concern'],'issue 是公共议题；problem 强调实际困难；concern 强调令人担忧之处。','Housing affordability is a major policy issue.','Traffic congestion is a serious urban problem.');
  add('issue','finance',['issue','release','offer'],'issue 是正式发行证券；release 多指发布信息或产品；offer 在金融里强调向投资者发售。','The company issued new shares.','The bank offered the bonds to institutional investors.');

  add('interest','social',['interest','curiosity','hobby'],'interest 是较广的兴趣；curiosity 强调好奇心；hobby 是长期从事的业余爱好。','She has a strong interest in jazz.','His curiosity led him to ask more questions.');
  add('interest','finance',['interest','return','yield'],'interest 是借贷产生的利息；return 是投资总回报；yield 常指按价格计算的收益率。','The loan carries 4% interest.','The bond offers a yield of 3.8%.');
  add('interest','public',['interest','benefit','stake'],'interest 常指个人或群体的利益；benefit 是具体好处；stake 强调与结果相关的利害关系。','The rule protects the public interest.','Local residents have a direct stake in the decision.');

  add('approach','work',['approach','method','strategy'],'approach 是总体处理思路；method 是具体做法；strategy 是为实现目标制定的整体计划。','We adopted a phased approach to the rollout.','This method cuts the processing time in half.');
  add('approach','academic',['approach','method','framework'],'approach 是研究路径；method 是具体方法；framework 是组织概念或分析的框架。','The study uses a data-driven approach.','The experiment uses a Bayesian estimation method.');
  add('approach','social',['approach','contact','address'],'approach 强调主动接近并开始交流；contact 强调建立联系；address 强调向某人讲话或处理某议题。','She approached her manager after the meeting.','She contacted her manager by email.');

  add('deploy','tech',['deploy','install','release'],'deploy 强调把系统投入运行环境；install 强调安装；release 强调正式发布版本。','We deployed the model to production.','We installed the software on the server.');
  add('deploy','public',['deploy','dispatch','station'],'deploy 强调有计划地部署资源；dispatch 强调派出；station 强调长期驻守某地。','The city deployed extra crews after the storm.','The agency dispatched two teams immediately.');
  add('deploy','work',['deploy','assign','allocate'],'deploy 强调把人或能力投入使用；assign 强调分配任务；allocate 强调分配资源额度。','We deployed a small team to the project.','The manager assigned each engineer a task.');

  add('plot','culture',['plot','story','narrative'],'plot 是事件如何展开的情节结构；story 是整个故事；narrative 更强调叙述方式和视角。','The film has a simple plot.','The story follows a family across three generations.');
  add('plot','academic',['plot','chart','graph'],'plot 作动词强调把变量关系画出来；chart 更常指图表呈现；graph 强调坐标关系图。','We plotted error against SNR.','The chart summarizes the monthly results.');
  add('plot','public',['plot','plan','scheme'],'plot 通常含秘密或非法意图；plan 中性；scheme 可中性也可带可疑意味。','Police uncovered a plot to steal data.','The city announced a plan to improve transit.');

  add('symptom','health',['symptom','sign','condition'],'symptom 是患者感受到的症状；sign 是可客观观察的体征；condition 是疾病或健康状态本身。','A sore throat is a common symptom.','A high temperature can be a clinical sign.');
  add('symptom','work',['symptom','cause','indicator'],'symptom 是深层问题的外在表现；cause 是根因；indicator 是提示某种状态的指标。','High turnover may be a symptom of poor management.','Low retention is an indicator of employee dissatisfaction.');

  add('estimate','academic',['estimate','calculate','predict'],'estimate 是基于数据作近似估计；calculate 强调按公式精确计算；predict 强调预测未来或未知结果。','We estimate the position from noisy measurements.','We calculate the exact distance from the known coordinates.');
  add('estimate','work',['estimate','quote','forecast'],'estimate 是初步估算；quote 是向客户正式报价；forecast 是对未来的预测。','Can you estimate how long the migration will take?','The supplier quoted us $12,000 for the work.');
  add('estimate','finance',['estimate','valuation','forecast'],'estimate 是近似判断；valuation 是正式估值；forecast 是对未来财务指标的预测。','Analysts estimate annual revenue at $8 million.','The formal valuation placed the company at $50 million.');

  add('ability','work',['ability','skill','competence'],'ability 是一般能力；skill 是训练形成的具体技能；competence 强调达到工作要求的胜任能力。','Her ability to explain complex ideas is valuable.','Writing clearly is a professional skill.');
  add('ability','academic',['ability','aptitude','skill'],'ability 是已经具备的能力；aptitude 更偏潜在天赋；skill 是通过训练获得的具体技能。','The test measures reasoning ability.','The assessment is designed to identify mathematical aptitude.');

  add('account','finance',['account','balance','statement'],'account 是账户；balance 是账户余额；statement 是一段时期的账户对账单。','She opened a savings account.','Her account balance is $2,400.');
  add('account','academic',['account','explanation','description'],'account 是较系统的叙述或解释；explanation 强调说明原因；description 主要描述特征或过程。','The paper gives a detailed account of the experiment.','The authors provide an explanation for the unexpected result.');

  add('charge','finance',['charge','fee','cost'],'charge 是收取费用这一行为或收费项目；fee 常指服务费；cost 是实际成本或价格。','The hotel charges for late checkout.','The bank applies a monthly service fee.');
  add('charge','tech',['charge','power','energize'],'charge 强调给电池储能；power 强调给设备供电；energize 是使电路带电或激活。','Charge the battery before use.','The adapter powers the device during operation.');

  add('claim','academic',['claim','argument','finding'],'claim 是需要证据支持的主张；argument 是推理链条；finding 是研究得到的结果。','The authors make a strong theoretical claim.','The main finding is supported by three experiments.');
  add('claim','public',['claim','state','assert'],'claim 常暗示真实性仍待验证；state 中性地陈述；assert 更强势地断言。','The company claims the process reduces waste.','The report states that emissions fell last year.');

  add('conduct','academic',['conduct','perform','carry out'],'conduct 较正式，常与 research/study 搭配；perform 常用于实验或具体操作；carry out 较通用。','We conducted a controlled study.','The technician performed the calibration procedure.');
  add('conduct','work',['conduct','lead','run'],'conduct 强调正式组织过程；lead 强调领导；run 更口语，表示负责日常运作。','She conducted five interviews.','He led the project team for six months.');

  add('context','academic',['context','background','setting'],'context 是理解信息所需的上下文；background 是更广的背景知识；setting 强调具体环境。','The result must be interpreted in context.','The introduction provides the necessary background.');
  add('context','social',['context','situation','circumstance'],'context 强调言行所处的语境；situation 是当前情形；circumstance 常指影响事件的外部条件。','The comment sounds rude out of context.','In that situation, staying silent was reasonable.');

  add('contract','work',['contract','agreement','deal'],'contract 是具有正式约束力的合同；agreement 更广泛；deal 更口语，强调交易或安排。','Both parties signed the contract.','We reached an agreement on the delivery date.');
  add('contract','public',['contract','outsource','commission'],'contract with 强调通过合同委托；outsource 强调外包；commission 强调正式委托某项工作。','The city contracted with a private operator.','The agency outsourced its IT support.');

  add('decline','finance',['decline','drop','fall'],'decline 常表示持续或较正式的下降；drop 更强调明显下跌；fall 是最普通的“下降”。','Sales declined throughout the quarter.','The share price dropped 12% in one day.');
  add('decline','social',['decline','refuse','reject'],'decline 是较礼貌正式的拒绝；refuse 更直接；reject 常用于拒绝提议、申请或方案。','She politely declined the invitation.','The committee rejected the proposal.');

  add('deliver','work',['deliver','complete','provide'],'deliver 强调按承诺交付成果；complete 强调完成任务；provide 强调提供资源或服务。','The team delivered the project on time.','We completed all testing before launch.');
  add('deliver','daily',['deliver','send','ship'],'deliver 强调送达到收件人；send 只表示发出；ship 多指通过物流运输。','The package was delivered this morning.','The seller shipped the order yesterday.');

  add('demand','finance',['demand','need','consumption'],'demand 是有购买意愿和能力的市场需求；need 是一般需要；consumption 是实际消费量。','Demand for electric vehicles remains strong.','Electricity consumption peaked in July.');
  add('demand','work',['demand','require','request'],'demand 语气强，表示强烈要求；require 表示客观需要；request 是礼貌请求。','The role demands strong communication skills.','The job requires three years of experience.');

  add('evidence','academic',['evidence','proof','data'],'evidence 是支持判断的证据；proof 表示足以证明；data 是原始或处理后的数据，不一定能直接支持结论。','The experiments provide strong evidence for the hypothesis.','The dataset contains measurements from 500 trials.');
  add('evidence','public',['evidence','proof','clue'],'evidence 是可用于判断事实的证据；proof 是决定性证明；clue 是线索。','Investigators collected evidence from the scene.','A receipt provided a useful clue.');

  add('feature','tech',['feature','function','capability'],'feature 是产品功能或特性；function 强调具体功能作用；capability 强调系统能做到什么。','The update adds a new privacy feature.','The device has the capability to operate offline.');
  add('feature','academic',['feature','variable','attribute'],'feature 是用于描述或建模的特征；variable 是可变化的量；attribute 是对象的属性。','The model uses spatial features as input.','Temperature is one of the measured variables.');

  add('impact','public',['impact','effect','consequence'],'impact 强调显著影响；effect 是一般效果；consequence 常强调后果。','The policy had a major impact on housing costs.','One consequence was a rise in waiting times.');
  add('impact','work',['impact','effect','influence'],'impact 常强调可见的业务结果；effect 是一般效果；influence 更偏潜移默化的作用。','The outage had little impact on customers.','Her leadership style influenced the whole team.');

  add('maintain','tech',['maintain','repair','support'],'maintain 是持续维护；repair 是故障后修复；support 是为用户或系统提供持续支持。','The team maintains the platform.','The technician repaired the failed sensor.');
  add('maintain','work',['maintain','preserve','sustain'],'maintain 是保持既有状态；preserve 强调保护不受损；sustain 强调长期维持。','We maintain high safety standards.','The company needs to sustain growth over time.');

  add('measure','academic',['measure','assess','evaluate'],'measure 强调用量化手段测量；assess 是判断程度或状态；evaluate 是综合判断价值或表现。','We measured the positioning error.','We assessed the reliability of the method.');
  add('measure','public',['measure','action','policy'],'measure 是为达到目的采取的具体措施；action 是一般行动；policy 是较系统、长期的政策。','The city introduced measures to reduce traffic.','The government adopted a new housing policy.');

  add('policy','public',['policy','rule','law'],'policy 是组织或政府的总体方针；rule 是具体规则；law 是具有法律强制力的法律。','The city adopted a new housing policy.','The building has a rule against smoking indoors.');
  add('policy','work',['policy','procedure','guideline'],'policy 规定原则和边界；procedure 规定具体步骤；guideline 是建议性指导。','The company updated its remote-work policy.','The procedure explains how to request access.');

  add('reserve','travel',['reserve','book','hold'],'reserve 与 book 都表示预订；book 更日常；hold 强调暂时保留位置或房间。','We reserved a table for eight.','I booked a hotel room online.');
  add('reserve','finance',['reserve','fund','capital'],'reserve 是为未来风险预留的资金；fund 是特定用途资金；capital 是用于经营或投资的资本。','The bank increased its cash reserves.','The project is financed by a dedicated fund.');

  add('secure','tech',['secure','protect','encrypt'],'secure 是整体确保系统安全；protect 是一般保护；encrypt 专指用加密保护数据。','We secured the server before launch.','Sensitive data are encrypted at rest.');
  add('secure','work',['secure','obtain','win'],'secure 强调经过努力成功获得；obtain 中性地“获得”；win 常指竞争后赢得。','The team secured funding for the project.','The company won a major government contract.');

  add('shift','work',['shift','change','transition'],'shift 常指方向或重点的转移；change 最广；transition 强调从一种状态逐步过渡到另一种状态。','The company shifted its focus to enterprise clients.','The team is transitioning to a new platform.');
  add('shift','daily',['shift','move','change'],'shift 常指位置或时间的小幅调整；move 是移动；change 是改变。','Can we shift the meeting to Friday?','Please move the chair closer to the window.');

  add('source','academic',['source','reference','evidence'],'source 是信息来源；reference 是引用或参考条目；evidence 是支持结论的证据。','The article cites several primary sources.','The reference list contains forty papers.');
  add('source','work',['source','supplier','origin'],'source 可指获取资源的来源；supplier 是具体供应商；origin 强调起源或出处。','We need a reliable source of components.','The supplier can deliver within two weeks.');

  add('access','tech',['access','permission','entry'],'access 是访问能力；permission 是授权；entry 多指进入某处或进入系统的动作。','Users can access the dashboard remotely.','Admin permission is required to change this setting.');
  add('access','public',['access','availability','entry'],'access 强调能否获得或使用公共资源；availability 强调是否可获得；entry 更偏进入某地点。','The policy improves access to healthcare.','Service availability is limited in rural areas.');

  add('apply','academic',['apply','use','implement'],'apply 强调把方法用于具体对象；use 最普通；implement 强调把方案真正实施。','We applied the model to a new dataset.','The team implemented the algorithm in software.');
  add('apply','work',['apply','request','submit'],'apply for 表示正式申请；request 是请求；submit 强调提交材料。','She applied for the position.','She submitted her application yesterday.');

  add('assume','academic',['assume','suppose','presume'],'assume 是为推理暂且设定；suppose 较口语，可表示假设；presume 常基于已有迹象作推断。','We assume the noise is Gaussian.','From the evidence, we presume the device was offline.');
  add('assume','work',['assume','take on','accept'],'assume responsibility 较正式；take on 强调开始承担；accept 强调同意承担。','She assumed responsibility for the project.','He took on a new leadership role.');

  add('available','daily',['available','free','accessible'],'available 表示可获得或有空；free 表示时间上空闲或免费；accessible 强调容易到达或使用。','Is this seat available?','I am free after three o’clock.');
  add('available','work',['available','ready','accessible'],'available 表示资源或人员可用；ready 表示已经准备好；accessible 强调可以访问。','The report will be available tomorrow.','The system is ready for deployment.');

  add('benefit','work',['benefit','advantage','value'],'benefit 是带来的好处；advantage 是相对优势；value 强调产生的价值。','Flexible hours benefit both staff and managers.','Low latency gives the product a competitive advantage.');
  add('benefit','health',['benefit','effect','improvement'],'benefit 是健康方面的好处；effect 是任何效果；improvement 是状态变好这一结果。','Regular exercise provides cardiovascular benefits.','The treatment produced a measurable improvement in mobility.');

  add('capacity','work',['capacity','ability','capability'],'capacity 强调可承受的工作量或潜力；ability 是人的一般能力；capability 常指组织或系统具备的能力。','The team is operating at full capacity.','The new platform adds analytics capability.');
  add('capacity','tech',['capacity','bandwidth','capability'],'capacity 是系统可承载总量；bandwidth 常指通信带宽；capability 是能完成哪些功能。','The battery has a capacity of 5,000 mAh.','The link provides 100 Mbps of bandwidth.');

  add('compare','academic',['compare','contrast','evaluate'],'compare 可看相同点和不同点；contrast 更强调差异；evaluate 是判断优劣或价值。','We compare the two algorithms under identical conditions.','The discussion contrasts centralized and distributed designs.');
  add('compare','finance',['compare','benchmark','evaluate'],'compare 是一般比较；benchmark 是与基准或行业标杆比较；evaluate 是综合评估。','Compare the fees before choosing an account.','We benchmarked the fund against the market index.');

  add('condition','academic',['condition','constraint','assumption'],'condition 是成立或实验所需条件；constraint 是限制；assumption 是预先假设。','The result holds under mild conditions.','The optimization includes a power constraint.');
  add('condition','health',['condition','disease','disorder'],'condition 是最宽泛的健康状况；disease 通常有明确病理；disorder 常指功能或结构异常。','Diabetes is a chronic condition.','The patient was diagnosed with an autoimmune disease.');
})();
