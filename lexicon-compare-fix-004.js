// Complete allow synonym comparisons for the new per-word presentation.
(function(){
  function set(word,scene,words,note,examples){
    const w=WORDS.find(x=>x.w===word);if(!w||!w.s[scene])return;
    w.s[scene].compare={words,note,examples};
  }

  set('allow','work',['allow','permit','enable'],
    'allow 是一般意义上的允许；permit 更正式，常用于制度、规则或授权；enable 强调创造条件或提供能力，使某事能够发生。',[
      'The policy allows employees to work remotely.',
      'The new rules permit staff to work from home two days a week.',
      'Better tools enable the team to work faster.'
    ]);

  set('allow','tech',['allow','enable','grant'],
    'allow 表示允许某项操作或访问；enable 强调开启某项能力或功能；grant 强调正式授予权限。',[
      'The firewall allows access from trusted networks.',
      'This setting enables offline access.',
      'The administrator granted the user access to the repository.'
    ]);
})();