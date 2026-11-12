// CG-REC isolated human-editorial hypotheses, NOT certified Master mappings.
// Explicit opt-in only. Source Sense IDs must exist in the pinned V51-V61 RANKED set.
// These are broad, contextual intent bridges, not assertions of synonym equivalence.
export const hypotheses = Object.freeze([
 {id:'food_delivery_status',scene_id:'SC50-0037',source_sense_id:'SC50-0037-0017',source_expression:'order status',
  source_meaning:'订单状态',pattern:/(?:外卖|送餐|配送|takeaway|delivery).{0,24}(?:送达|送到|到哪|到达|进度|状态|什么时候|where|arrive|status|tracking)|(?:送达|送到|到哪|进度|状态).{0,18}(?:外卖|送餐|配送|takeaway|delivery)/i,weight:34,
  note:'Delivery progress query requires fulfillment stage, not merely ordering takeaway.'},
 {id:'food_expiry_safety',scene_id:'SC50-0042',source_sense_id:'SC50-0042-0020',source_expression:'expiration date',
  source_meaning:'到期日',pattern:/(?:食物|食品|吃的|食材).{0,20}(?:过期|变质|坏了|保质期)|(?:过期|变质|保质期).{0,20}(?:食物|食品|食材|吃的)/i,weight:34,
  note:'Shelf-life / spoilage question contextualizes food safety rather than cosmetic expiry.'}
]);
export function matchIntentHypotheses(query){return hypotheses.filter(x=>x.pattern.test(String(query||'')));}
