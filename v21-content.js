// Small V2.1 pilot set. This is intentionally tiny: enhanced scoring is enabled only for reviewed items.
// Content status is editorial-reviewed for this pilot, not dictionary/corpus verified.
(function(){
  const VERSION='v2.1-pilot-2026-10-12';
  const units=[
    {
      ku_id:'w_0619_apply_ku01',sense_id:'w_0619_apply_s01',lemma:'apply',sense_zh:'申请',
      capability:'usage-reviewed',quality_status:'editorial_reviewed_v2.1',verification:'editorial_only',
      teaching:{meaning:'申请；正式请求获得职位、机会或资格',usage:'申请职位或机会常用 apply for + 名词。',example_en:'She applied for the position yesterday.',example_zh:'她昨天申请了这个职位。'},
      targets:[
        {target_id:'w_0619_apply_ku01::meaning',type:'meaning'},
        {target_id:'w_0619_apply_ku01::usage::apply_for',type:'usage'}
      ],
      items:[
        {item_id:'apply01_meaning_ctx_a',target_id:'w_0619_apply_ku01::meaning',item_version:1,type:'recall_context',role:'practice',prompt:'在 “She applied for the position yesterday.” 中，apply 表示什么？',answer:'申请'},
        {item_id:'apply01_meaning_ctx_b',target_id:'w_0619_apply_ku01::meaning',item_version:1,type:'recall_context',role:'transfer',prompt:'在 “More than 200 people applied for the internship.” 中，apply 表示什么？',answer:'申请'},
        {item_id:'apply01_usage_a',target_id:'w_0619_apply_ku01::usage::apply_for',item_version:1,type:'choice',role:'practice',prompt:'She ___ the position yesterday.',options:['applied for','applied to','requested for'],answer_index:0,explanation:'申请一个职位通常说 apply for a position。'},
        {item_id:'apply01_usage_b',target_id:'w_0619_apply_ku01::usage::apply_for',item_version:1,type:'choice',role:'transfer',prompt:'If you want the job, you should ___ it before Friday.',options:['apply for','apply to','apply with'],answer_index:0,explanation:'申请某个 job / position / opportunity 通常使用 apply for。'}
      ]
    },
    {
      ku_id:'w_0144_interest_ku03',sense_id:'w_0144_interest_s03',lemma:'interest',sense_zh:'利息',
      capability:'basic-reviewed',quality_status:'editorial_reviewed_v2.1',verification:'editorial_only',
      teaching:{meaning:'利息；借贷资金产生的费用或收益',usage:'interest rate 是“利率”，interest 本身通常指“利息”。',example_en:'You will pay less interest if you repay early.',example_zh:'如果提前还款，你支付的利息会更少。'},
      targets:[{target_id:'w_0144_interest_ku03::meaning',type:'meaning'}],
      items:[
        {item_id:'interest03_meaning_ctx_a',target_id:'w_0144_interest_ku03::meaning',item_version:1,type:'recall_context',role:'practice',prompt:'在 “You will pay less interest if you repay early.” 中，interest 表示什么？',answer:'利息'},
        {item_id:'interest03_meaning_ctx_b',target_id:'w_0144_interest_ku03::meaning',item_version:1,type:'recall_context',role:'transfer',prompt:'在 “Interest is calculated monthly on this loan.” 中，interest 表示什么？',answer:'利息'}
      ]
    },
    {
      ku_id:'w_1981_plot_ku_s01',sense_id:'w_1981_plot_s01',lemma:'plot',sense_zh:'情节',
      capability:'basic-reviewed',quality_status:'editorial_reviewed_v2.1',verification:'editorial_only',
      teaching:{meaning:'故事情节；事件如何展开的结构',usage:'plot 强调情节结构；story 的范围更广，可指整个故事。',example_en:'The film has a simple plot but memorable characters.',example_zh:'这部电影情节简单，但人物令人难忘。'},
      targets:[{target_id:'w_1981_plot_ku_s01::meaning',type:'meaning'}],
      items:[
        {item_id:'plot01_meaning_ctx_a',target_id:'w_1981_plot_ku_s01::meaning',item_version:1,type:'recall_context',role:'practice',prompt:'在 “The film has a simple plot.” 中，plot 表示什么？',answer:'情节'},
        {item_id:'plot01_meaning_ctx_b',target_id:'w_1981_plot_ku_s01::meaning',item_version:1,type:'recall_context',role:'transfer',prompt:'在 “The plot becomes more complex in the second half.” 中，plot 表示什么？',answer:'情节'}
      ]
    }
  ];

  function validateAgainstCore(){
    const core=window.PAI_CORE;if(!core)throw new Error('Core lexicon not loaded');
    for(const spec of units){
      const u=core.byKU.get(spec.ku_id);
      if(!u||u.s.sense_id!==spec.sense_id||u.w.w!==spec.lemma||u.s.m!==spec.sense_zh)throw new Error('V2.1 pilot content binding mismatch: '+spec.ku_id);
      for(const t of spec.targets)if(!t.target_id.startsWith(spec.ku_id+'::'))throw new Error('target identity mismatch');
      for(const item of spec.items){
        if(!spec.targets.some(t=>t.target_id===item.target_id))throw new Error('item target missing: '+item.item_id);
        if(item.type==='choice'&&(!Array.isArray(item.options)||!Number.isInteger(item.answer_index)||!item.options[item.answer_index]))throw new Error('invalid choice item: '+item.item_id);
      }
    }
    return true;
  }

  window.PAI_V21_CONTENT={version:VERSION,units,validateAgainstCore};
})();
