// High-frequency synonym comparison completions: 3 words x 3 explicitly aligned examples.
(function(){
  function set(word,scene,words,note,examples){
    const w=WORDS.find(x=>x.w===word); if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples};
  }

  set('assess','academic',['assess','evaluate','measure'],
    'assess 是系统判断程度或状态；evaluate 是按标准综合评价价值或表现；measure 强调用量化手段得到数值。',[
      'We assessed the reliability of the method.',
      'We evaluated the model on three benchmark datasets.',
      'We measured the positioning error in centimeters.'
    ]);
  set('assess','work',['assess','evaluate','review'],
    'assess 强调判断风险、能力或影响；evaluate 强调按标准比较表现；review 强调系统检查已有材料或过程。',[
      'We assessed the project risks before launch.',
      'The committee evaluated three proposals.',
      'The manager reviewed the quarterly report.'
    ]);

  set('evaluate','academic',['evaluate','assess','test'],
    'evaluate 是按标准综合评价；assess 是判断程度或状态；test 是通过实验或测试检验。',[
      'We evaluated the model on three datasets.',
      'We assessed the robustness of the method under noise.',
      'We tested the model under low-light conditions.'
    ]);
  set('evaluate','work',['evaluate','assess','compare'],
    'evaluate 是系统判断方案或表现；assess 强调风险或能力；compare 强调并列比较差异。',[
      'The committee evaluated three proposals.',
      'We assessed the financial risk of the project.',
      'We compared the two suppliers on cost and quality.'
    ]);

  set('identify','academic',['identify','detect','determine'],
    'identify 是识别出具体对象或原因；detect 是发现某物存在；determine 是进一步确定其性质、原因或数值。',[
      'We identified three major sources of error.',
      'The sensor detected an abnormal signal.',
      'Further tests determined the exact cause of the failure.'
    ]);
  set('identify','work',['identify','find','recognize'],
    'identify 较正式，强调明确风险、机会或责任人；find 是一般找到；recognize 强调意识到或认出。',[
      'We identified a major operational risk.',
      'The team found a cheaper supplier.',
      'The manager recognized the need for change.'
    ]);

  set('determine','academic',['determine','identify','decide'],
    'determine 强调通过证据确定；identify 强调识别出对象或原因；decide 是人基于判断作出决定。',[
      'The experiment determined the exact value of the parameter.',
      'The analysis identified three possible causes.',
      'The researchers decided to repeat the experiment.'
    ]);
  set('determine','work',['determine','decide','define'],
    'determine 可表示条件客观决定结果；decide 是人作决策；define 是明确范围、边界或内容。',[
      'Budget constraints determine the project scope.',
      'The steering committee decided to proceed.',
      'The team defined the responsibilities of each role.'
    ]);

  set('establish','academic',['establish','demonstrate','show'],
    'establish 强调证据足以确立事实或关系；demonstrate 强调通过证据展示；show 是最一般的表明。',[
      'The study established a causal relationship.',
      'The experiment demonstrated the feasibility of the method.',
      'The results show a clear improvement in accuracy.'
    ]);
  set('establish','work',['establish','create','set up'],
    'establish 较正式，强调建立并使之稳定；create 强调产生新的事物；set up 更口语，强调搭建或成立。',[
      'The company established a new research group.',
      'The partnership created new business opportunities.',
      'We set up a temporary project team.'
    ]);

  set('indicate','academic',['indicate','suggest','prove'],
    'indicate 表示数据表明某趋势；suggest 语气更谨慎；prove 表示证据足以证明，强度最高。',[
      'The results indicate a small but consistent improvement.',
      'The findings suggest that the effect may be temporary.',
      'The theorem proves that the solution is unique.'
    ]);
  set('indicate','public',['indicate','show','signal'],
    'indicate 是较正式地表明；show 是一般展示或说明；signal 常指某迹象预示变化。',[
      'The figures indicate a modest recovery.',
      'The survey shows strong public support.',
      'Falling demand may signal a slowdown.'
    ]);

  set('obtain','academic',['obtain','acquire','derive'],
    'obtain 是正式的“获得结果或数据”；acquire 强调获取过程；derive 强调从已有数据、公式或假设推导。',[
      'We obtained similar results in all three experiments.',
      'The receiver acquires measurements at ten hertz.',
      'The parameter was derived from the observed data.'
    ]);
  set('obtain','work',['obtain','secure','receive'],
    'obtain 是正式中性的“获得”；secure 强调经过努力成功取得；receive 强调被动收到。',[
      'We obtained final approval last week.',
      'The team secured additional funding for the project.',
      'We received the signed contract this morning.'
    ]);

  set('require','academic',['require','need','demand'],
    'require 表示方法或条件客观要求；need 是最普通的需要；demand 强调高强度要求或资源消耗。',[
      'The method requires only two reference points.',
      'The experiment needs additional calibration data.',
      'Real-time processing demands substantial computing power.'
    ]);
  set('require','work',['require','need','request'],
    'require 表示制度或岗位要求；need 是一般需要；request 是主动提出请求。',[
      'The role requires strong analytical skills.',
      'We need more time to complete the review.',
      'The client requested a revised schedule.'
    ]);
})();
