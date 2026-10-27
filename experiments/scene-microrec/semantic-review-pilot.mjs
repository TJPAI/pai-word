// First-pass semantic review of a deliberately selected ambiguity-risk sample.
// Reviewer: ChatGPT; NOT independent blind verification or training authorization.
// Ratings: PASS_CANDIDATE, NEEDS_REVISION, AMBIGUOUS. Each rationale is item-specific.
export const semanticReviewPilot=[
 ['S001','PASS_CANDIDATE','Morning preparation includes waking and getting ready; does not imply bedtime.'],
 ['S002','PASS_CANDIDATE','Personal hygiene covers washing and grooming rather than household cleaning.'],
 ['S009','PASS_CANDIDATE','Dishwashing and kitchen cleaning are both present and distinguish S009 from S002.'],
 ['S034','PASS_CANDIDATE','Restaurant ordering differs from online delivery ordering in S042.'],
 ['S037','PASS_CANDIDATE','Names both allergens and diet limitations as in the original Chinese label.'],
 ['S041','PASS_CANDIDATE','Restaurant bill settlement and tipping distinguished from general payment S065.'],
 ['S043','AMBIGUOUS','Picking up food and deliveries may include courier parcel deliveries; Chinese 场景 emphasizes meal pickup and delivery.','Picking up takeaway meals and arranging food delivery'],
 ['S054','PASS_CANDIDATE','Clothing retail is distinguished from choosing everyday outfits in S003.'],
 ['S068','PASS_CANDIDATE','Mobile app payments are distinct from card and cash payments.'],
 ['S069','PASS_CANDIDATE','Receipts and invoices cover retail proof of purchase rather than billing only.'],
 ['S079','PASS_CANDIDATE','Subway context distinguishes it from bus and railway travel.'],
 ['S089','PASS_CANDIDATE','Roadworks and detours preserves both construction and diversion concepts.'],
 ['S099','PASS_CANDIDATE','Traffic accident communication concerns conversations at scene, not generic emergencies.'],
 ['S105','PASS_CANDIDATE','Airport security screening distinguishes check-in and immigration.'],
 ['S109','PASS_CANDIDATE','Going through immigration refers to border entry checks; not customs declaration.'],
 ['S113','PASS_CANDIDATE','Booking a hotel room differs from checking in at S114.'],
 ['S124','AMBIGUOUS','Taking travel photos loses 打卡/visiting noteworthy spots and 自由行 self-guided travel nuance.','Independent sightseeing and visiting popular landmarks'],
 ['S125','PASS_CANDIDATE','Unexpected travel problems distinguish emergencies from travel planning.'],
 ['S144','PASS_CANDIDATE','Academic paper writing distinct from specific abstract and introduction drafting.'],
 ['S159','PASS_CANDIDATE','Data analysis matches research analysis; does not imply data collection.'],
 ['S175','PASS_CANDIDATE','Ethics and academic integrity retains both research conduct and integrity.'],
 ['S212','PASS_CANDIDATE','Asking about position responsibilities differs from explaining current job at S178.'],
 ['S217','PASS_CANDIDATE','Accepting a job offer distinguishes declining at S218.'],
 ['S278','PASS_CANDIDATE','Prompt writing and task description properly captures both concepts.'],
 ['S301','PASS_CANDIDATE','General bodily discomfort distinct from specific pain description S309.']
].map(([scene_id,verdict,rationale,suggested_en=null])=>({scene_id,verdict,rationale,suggested_en,reviewer:'ChatGPT_first_pass',independent_review:false,training_approved:false}));
