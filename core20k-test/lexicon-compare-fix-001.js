// Targeted quality fixes for synonym distinctions found during visual review.
(function(){
  function set(word,scene,words,note,examples){
    const w=WORDS.find(x=>x.w===word); if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples};
  }

  set('challenge','academic',
    ['challenge','problem','limitation'],
    'challenge 是待攻克的研究难题；problem 是已经存在、需要解决的具体问题；limitation 是方法或研究本身的局限。',
    [
      'Robust localization in tunnels remains a major challenge.',
      'Signal blockage is a serious problem in underground environments.',
      'Small sample size is a limitation of the study.'
    ]
  );

  set('challenge','work',
    ['challenge','problem','obstacle'],
    'challenge 是有难度但可应对的任务；problem 是已经存在的问题；obstacle 是阻碍推进的具体障碍。',
    [
      'Hiring enough engineers is a major challenge.',
      'The delayed shipment created a serious production problem.',
      'Budget limits are an obstacle to expansion.'
    ]
  );
})();
