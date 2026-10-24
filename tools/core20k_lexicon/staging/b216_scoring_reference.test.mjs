// B216 scoring contract: reference implementation + tests (staging QA tool).
// NOT app code. It proves the contract in b216_scoring_contract.md against
// the Batch93 six records and the Batch79 seven grammar records.
//
// Contract (short form):
// - Cloze answers (single word): case-insensitive, whitespace-trimmed,
// sentence-initial capitalisation ignored. Exact word required.
// - Short-answer meaning answers: normalised (trim, collapse whitespace,
// strip Chinese/English punctuation and the particles ；、，,。), then
// matched against the per-KU ACCEPTED SET (gloss terms + correct_answer
// + its split terms). A bare sentence translation is NOT an accepted
// meaning answer. Empty answers are rejected.
// - Identification answers (yes/no + reason): the yes/no verdict must
// match, AND the reason must contain at least one accepted reason
// keyword. A bare yes/no without a reason is NOT accepted.
// - Strict string equality against a single correct_answer is FORBIDDEN
// as the sole criterion: it fails every documented paraphrase case.

import { test} from 'node:test';
import assert from 'node:assert/strict';

export function normaliseZh(s) {
return String(s?? '')
.trim()
.replace(/\s+/g, '')
.replace(/[；、，,。\.!！？\?、：:；;「」『』（）()\[\]]/g, '');
}

export function normaliseWord(s) {
return String(s?? '').trim().toLowerCase();
}

// Accepted meaning-answer sets, per KU (gloss terms + correct_answer terms).
// These sets are the contract's data: main-dev must store them with the KU,
// not hard-code them in the scorer.
export const MEANING_SETS = {
w_0266_person_ku01: ['人', '个人', '一个人'],
w_0049_time_ku01: ['时间', '时长', '完成事情所需的时长'],
w_0041_know_ku01: ['知道', '了解'],
w_0057_people_ku01: ['人', '人们', '许多人'],
w_0139_talk_ku01: ['说话', '交谈'],
w_0099_here_ku01: ['这里', '在这里', '到这里'],
};

export function scoreMeaning(kuId, learnerAnswer) {
const norm = normaliseZh(learnerAnswer);
if (!norm) return false;
const accepted = MEANING_SETS[kuId]?? [];
return accepted.map(normaliseZh).includes(norm);
}

export function scoreCloze(expectedWord, learnerAnswer) {
const e = normaliseWord(expectedWord);
const a = normaliseWord(learnerAnswer);
return Boolean(e) && e === a;
}

// Identification: expectedVerdict is 'yes' or 'no'; reasonKeywords are
// accepted reason terms (normalised). The learner answer must contain a
// verdict token and at least one reason keyword.
export function scoreIdentification(expectedVerdict, reasonKeywords, learnerAnswer) {
const raw = String(learnerAnswer?? '');
const lower = raw.toLowerCase();
const hasNo = /(^|\W)no(\W|$)/.test(lower) || raw.includes('不');
const hasYes = /(^|\W)yes(\W|$)/.test(lower) || raw.includes('是');
const verdict = hasNo &&!hasYes? 'no': hasYes &&!hasNo? 'yes': null;
if (verdict!== expectedVerdict) return false;
const norm = normaliseZh(raw);
return reasonKeywords.some((k) => norm.includes(normaliseZh(k)));
}

// ---- Batch93 meaning answers: must-accept ----
for (const [ku, answers] of Object.entries(MEANING_SETS)) {
for (const a of answers) {
test(`meaning accept: ${ku} <- ${a}`, () => {
assert.equal(scoreMeaning(ku, a), true);
});
}
}
// Punctuation / whitespace variants must also be accepted.
test('meaning accept: punctuation and whitespace variants', () => {
assert.equal(scoreMeaning('w_0266_person_ku01', ' 人；个人 '), false); // two terms at once is not one answer
assert.equal(scoreMeaning('w_0049_time_ku01', '时间。'), true);
assert.equal(scoreMeaning('w_0049_time_ku01', ' 时长 '), true);
assert.equal(scoreMeaning('w_0139_talk_ku01', '交谈，'), true);
});

// ---- Batch93 meaning answers: must-reject ----
test('meaning reject: sentence translations and wrong senses', () => {
assert.equal(scoreMeaning('w_0049_time_ku01', '需要更多时间'), false); // sentence translation, not the word meaning
assert.equal(scoreMeaning('w_0049_time_ku01', '时刻'), false); // wrong sense (point in time)
assert.equal(scoreMeaning('w_0049_time_ku01', ''), false);
assert.equal(scoreMeaning('w_0049_time_ku01', '完成事情'), false); // fragment, not the full accepted answer
assert.equal(scoreMeaning('w_0057_people_ku01', '民族'), false); // nation sense, not collective
assert.equal(scoreMeaning('w_0099_here_ku01', '此时'), false); // ku02 sense, not ku01
assert.equal(scoreMeaning('w_0041_know_ku01', '认识'), false); // familiarity sense, not possession of knowledge
});

// ---- Batch79 cloze answers: must-accept (case-insensitive) ----
test('cloze accept: case and whitespace variants', () => {
assert.equal(scoreCloze('The', 'the'), true);
assert.equal(scoreCloze('The', 'The'), true);
assert.equal(scoreCloze('The', ' THE '), true);
assert.equal(scoreCloze('to', 'to'), true);
assert.equal(scoreCloze('have', 'have'), true);
assert.equal(scoreCloze('It', 'it'), true);
});

// ---- Batch79 cloze answers: must-reject ----
test('cloze reject: wrong words', () => {
assert.equal(scoreCloze('The', 'a'), false);
assert.equal(scoreCloze('to', 'for'), false);
assert.equal(scoreCloze('have', 'has'), false); // they + have, not has
assert.equal(scoreCloze('It', 'they'), false);
assert.equal(scoreCloze('The', ''), false);
});

// ---- Batch79 identification answers ----
// Reason keyword sets MUST be bilingual: batch79 answers are English
// phrases, while learner reasons may be Chinese. A monolingual keyword
// set would reject the record's own correct answer (this test caught
// exactly that bug during development).
test('identification accept: verdict + reason keyword', () => {
assert.equal(scoreIdentification('no', ['people in general', '一般人', '泛指'], 'No; people in general'), true);
assert.equal(scoreIdentification('no', ['people in general', '一般人', '泛指'], '不一定指听话人，泛指一般人'), true);
assert.equal(scoreIdentification('no', ['unspecified people', '不具体', '泛指'], 'No; unspecified people'), true);
});
test('identification reject: bare verdict, wrong verdict, missing reason', () => {
assert.equal(scoreIdentification('no', ['people in general', '一般人', '泛指'], 'No'), false); // no reason
assert.equal(scoreIdentification('no', ['people in general', '一般人', '泛指'], 'Yes'), false); // wrong verdict
assert.equal(scoreIdentification('no', ['people in general', '一般人', '泛指'], 'No; the listener'), false); // reason contradicts generic reading
});
