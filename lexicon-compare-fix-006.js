// Complete the remaining batch-001 synonym distinctions: 3 words × 3 dedicated examples.
(function(){
  function fix(word,scene,words,note,examples){
    const w=WORDS.find(x=>x.w===word);if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples};
  }

  fix('shift','work',['shift','change','transition'],'shift 常指方向或重点的转移；change 最广，表示一般改变；transition 强调从一种状态逐步过渡到另一种状态。',[
    'The company shifted its focus to enterprise clients.',
    'The merger changed the reporting structure.',
    'The team is transitioning to a new platform.'
  ]);
  fix('shift','daily',['shift','move','change'],'shift 常指位置或时间的小幅调整；move 强调移动位置；change 是最普通的“改变”。',[
    'Can we shift the meeting to Friday?',
    'Please move the chair closer to the window.',
    'I changed my appointment to next Monday.'
  ]);

  fix('source','academic',['source','reference','evidence'],'source 是信息来源；reference 是引用或参考条目；evidence 是支持结论的证据。',[
    'The article cites several primary sources.',
    'The reference list contains forty papers.',
    'The experiment provides strong evidence for the hypothesis.'
  ]);
  fix('source','work',['source','supplier','origin'],'source 可指获取资源的来源；supplier 是具体供应商；origin 强调起源或出处。',[
    'We need a reliable source of components.',
    'The supplier can deliver within two weeks.',
    'The team traced the defect to its origin.'
  ]);

  fix('access','tech',['access','permission','entry'],'access 是访问或使用系统的能力；permission 是授权；entry 更强调进入某处或系统的动作。',[
    'Users can access the dashboard remotely.',
    'Admin permission is required to change this setting.',
    'Biometric entry is enabled at the data center.'
  ]);
  fix('access','public',['access','availability','entry'],'access 强调能否获得或使用公共资源；availability 强调资源是否存在并可获得；entry 更偏进入某地点。',[
    'The policy improves access to healthcare.',
    'Service availability is limited in rural areas.',
    'Museum entry is free for children under twelve.'
  ]);

  fix('apply','academic',['apply','use','implement'],'apply 强调把方法用于具体对象；use 最普通，表示使用；implement 强调把算法或方案真正实现。',[
    'We applied the model to a new dataset.',
    'The study used a standard calibration procedure.',
    'The team implemented the algorithm in software.'
  ]);
  fix('apply','work',['apply','request','submit'],'apply for 表示正式申请职位或机会；request 是提出请求；submit 强调提交材料。',[
    'She applied for the position.',
    'He requested two days of annual leave.',
    'She submitted her application yesterday.'
  ]);

  fix('assume','academic',['assume','suppose','presume'],'assume 是为推理暂且设定；suppose 较通用，可表示假设；presume 常基于已有迹象作推断。',[
    'We assume the noise is Gaussian.',
    'Suppose the channel remains constant during each frame.',
    'From the evidence, we presume the device was offline.'
  ]);
  fix('assume','work',['assume','take on','accept'],'assume responsibility 较正式；take on 强调开始承担新的职责；accept 强调同意承担责任或任务。',[
    'She assumed responsibility for the project.',
    'He took on a new leadership role.',
    'She accepted responsibility for the final decision.'
  ]);

  fix('available','daily',['available','free','accessible'],'available 表示某物可获得或某人有空；free 更强调时间空闲；accessible 强调容易到达或使用。',[
    'Is this seat available?',
    'I am free after three o’clock.',
    'The trail is accessible by bus.'
  ]);
  fix('available','work',['available','ready','accessible'],'available 表示资源或人员可用；ready 表示已经准备好；accessible 强调可以访问或取得。',[
    'The report will be available tomorrow.',
    'The system is ready for deployment.',
    'The archive is accessible to all team members.'
  ]);

  fix('benefit','work',['benefit','advantage','value'],'benefit 是带来的实际好处；advantage 是相对于其他选择的优势；value 强调产生的价值。',[
    'Flexible hours benefit both staff and managers.',
    'Low latency gives the product a competitive advantage.',
    'The new dashboard creates value by reducing manual work.'
  ]);
  fix('benefit','health',['benefit','effect','improvement'],'benefit 是健康方面的好处；effect 是任何效果，可能好也可能坏；improvement 是状态变好的结果。',[
    'Regular exercise provides cardiovascular benefits.',
    'The medication had a mild sedative effect.',
    'The treatment produced a measurable improvement in mobility.'
  ]);

  fix('capacity','work',['capacity','ability','capability'],'capacity 强调可承受的工作量或潜在容量；ability 是人的一般能力；capability 常指组织或系统能完成什么。',[
    'The team is operating at full capacity.',
    'Her ability to negotiate helped close the deal.',
    'The department has the capability to support larger projects.'
  ]);
  fix('capacity','tech',['capacity','bandwidth','capability'],'capacity 是系统可承载的总量；bandwidth 常指通信链路的数据传输能力；capability 是系统具备的功能能力。',[
    'The battery has a capacity of 5,000 mAh.',
    'The link provides 100 Mbps of bandwidth.',
    'The new sensor adds offline processing capability.'
  ]);

  fix('compare','academic',['compare','contrast','evaluate'],'compare 可同时看相同点和不同点；contrast 更强调差异；evaluate 是判断表现、价值或质量。',[
    'We compared the two algorithms under identical conditions.',
    'The discussion contrasts centralized and distributed designs.',
    'The study evaluates each method on three datasets.'
  ]);
  fix('compare','finance',['compare','benchmark','evaluate'],'compare 是一般比较；benchmark 是与基准或行业标杆比较；evaluate 是综合评估价值或表现。',[
    'Compare the fees before choosing an account.',
    'We benchmarked the fund against the market index.',
    'Analysts evaluated the company before the acquisition.'
  ]);

  fix('condition','academic',['condition','constraint','assumption'],'condition 是结论成立或实验所需条件；constraint 是限制；assumption 是分析前预先作出的假设。',[
    'The result holds under mild conditions.',
    'The optimization includes a power constraint.',
    'The derivation relies on a simplifying assumption.'
  ]);
  fix('condition','health',['condition','disease','disorder'],'condition 是最宽泛的健康状况；disease 通常指有较明确病理机制的疾病；disorder 常指功能或结构异常。',[
    'Diabetes is a chronic condition.',
    'The patient was diagnosed with an autoimmune disease.',
    'The clinic specializes in sleep disorders.'
  ]);
})();
