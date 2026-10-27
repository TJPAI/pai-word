// Additional first-pass reviewer judgments; not independent certification.
export const secondPilot=[
 [
  "S114",
  "PASS_CANDIDATE",
  "Checking in at a hotel refers to registration and room-key collection on arrival, not advance reservation."
 ],
 [
  "S116",
  "PASS_CANDIDATE",
  "Requesting hotel services clearly addresses guest requests to staff rather than complaints about failure."
 ],
 [
  "S117",
  "PASS_CANDIDATE",
  "Hotel complaints refer to reporting service or room problems and requesting remedies."
 ],
 [
  "S118",
  "PASS_CANDIDATE",
  "Checking out of a hotel involves departure settlement and returning access credentials."
 ],
 [
  "S119",
  "AMBIGUOUS",
  "Hostel and guesthouse may not fully convey independently operated short-term home rentals.",
  "Staying at a hostel or privately rented accommodation"
 ],
 [
  "S120",
  "PASS_CANDIDATE",
  "Tourist information centers are for obtaining visitor information, not booking travel in general."
 ],
 [
  "S121",
  "PASS_CANDIDATE",
  "Attraction tickets refers to admission reservations or purchases, not transportation tickets."
 ],
 [
  "S122",
  "PASS_CANDIDATE",
  "Visiting a museum encompasses exhibits and visitor conduct, unlike school or public libraries."
 ],
 [
  "S123",
  "PASS_CANDIDATE",
  "Guided tours involve an organized group led by a guide, unlike self-guided sightseeing."
 ],
 [
  "S126",
  "PASS_CANDIDATE",
  "Listening to a lesson denotes attending and following instruction rather than asking a question."
 ],
 [
  "S127",
  "PASS_CANDIDATE",
  "Asking questions in class identifies learner-initiated questions rather than teacher prompts."
 ],
 [
  "S128",
  "PASS_CANDIDATE",
  "Answering a teacher's questions captures responses to the instructor rather than giving a presentation."
 ],
 [
  "S129",
  "PASS_CANDIDATE",
  "Taking notes denotes recording class content rather than writing an assignment."
 ],
 [
  "S130",
  "PASS_CANDIDATE",
  "Doing homework means performing assigned study outside classroom response activities."
 ],
 [
  "S131",
  "PASS_CANDIDATE",
  "Submitting assignments means handing in finished work rather than completing it."
 ],
 [
  "S132",
  "PASS_CANDIDATE",
  "Group discussion is a collaborative classroom interaction distinct from formal presentations."
 ],
 [
  "S133",
  "PASS_CANDIDATE",
  "Class presentation requires showing or explaining work to an audience, unlike informal discussion."
 ],
 [
  "S134",
  "PASS_CANDIDATE",
  "Laboratory classes involve practical instructional experiments rather than independent research design."
 ],
 [
  "S135",
  "PASS_CANDIDATE",
  "Studying in the library denotes a study setting rather than borrowing library books."
 ],
 [
  "S136",
  "PASS_CANDIDATE",
  "Borrowing and returning books denotes lending circulation, not purchasing bookstore goods."
 ]
].map(([scene_id,verdict,rationale,suggested_en=null])=>({scene_id,verdict,rationale,suggested_en,reviewer:'ChatGPT_first_pass',independent_review:false,training_approved:false}));
