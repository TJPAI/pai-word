// Experimental bilingual seed data. Every pair is a proposed translation, not certified QA.
// No source corpus was altered and no labels from existing test queries were used.
export const bilingualSeeds=[
 ['S001','起床与晨间准备','Getting up and getting ready in the morning'],
 ['S002','洗漱与个人清洁','Washing up and personal hygiene'],
 ['S003','穿衣与搭配','Getting dressed and choosing an outfit']
].map(([scene_id,source_zh,candidate_en])=>({scene_id,source_zh,candidate_en,provenance:'chatgpt_editorial_candidate_20261027',review_status:'UNREVIEWED',use_for_training:false}));
