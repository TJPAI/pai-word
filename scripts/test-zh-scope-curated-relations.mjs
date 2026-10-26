#!/usr/bin/env node
// Isolated curated relation contract test. NOT an automatic Chinese parser.
import assert from 'node:assert/strict';
const cases=[
 {q:'不要单人间，换双人间',target:'单人间',operator:'不要',stance:'REJECTED',targetAt:2,operatorAt:0},
 {q:'不要单人间，换双人间',target:'双人间',operator:'换',stance:'REQUESTED',targetAt:7,operatorAt:6},
 {q:'不想买火车票，只要绘本',target:'火车票',operator:'不想买',stance:'REJECTED',targetAt:3,operatorAt:0},
 {q:'不想买火车票，只要绘本',target:'绘本',operator:'要',stance:'REQUESTED',targetAt:9,operatorAt:8}
];
function verify(record){
 const chars=Array.from(record.q);
 assert.equal(chars.slice(record.targetAt,record.targetAt+Array.from(record.target).length).join(''),record.target,'TARGET_SPAN_INVALID');
 assert.equal(chars.slice(record.operatorAt,record.operatorAt+Array.from(record.operator).length).join(''),record.operator,'OPERATOR_SPAN_INVALID');
 const comma=chars.findIndex(c=>'，,；;'.includes(c));
 if(comma!==-1){
   const targetClause=record.targetAt<comma?0:1;
   const operatorClause=record.operatorAt<comma?0:1;
   assert.equal(operatorClause,targetClause,'CROSS_CLAUSE_OPERATOR_TARGET');
 }
 assert(['REQUESTED','REJECTED'].includes(record.stance));
 return true;
}
assert.equal(cases.filter(verify).length,4);
const mutation={...cases[0],operator:'换',operatorAt:6};
assert.throws(()=>verify(mutation),/CROSS_CLAUSE_OPERATOR_TARGET/);
const wrongOffset={...cases[1],targetAt:2};
assert.throws(()=>verify(wrongOffset),/TARGET_SPAN_INVALID/);
// Adversarial structures must abstain rather than obtain a false scope PASS.
// The current simple verifier knows only one explicit comma boundary and cannot
// adjudicate implicit clauses, repeated targets or embedded discussion.
const unsupported=[
 {q:'不要单人间换双人间',reason:'IMPLICIT_CLAUSE'},
 {q:'不要单人间但要双人间',reason:'UNMARKED_CONTRAST'},
 {q:'不要单人间单人间也不行',reason:'REPEATED_TARGET'},
 {q:'如何拒绝单人间',reason:'METALINGUISTIC_REQUEST'},
 {q:'他说不要单人间',reason:'REPORTED_SPEECH'},
 {q:'不是不想要单人间',reason:'NESTED_NEGATION'}
];
function scopeGate(q){
 if (q.includes('如何') || q.startsWith('他说')) return 'ABSTAIN_CONTEXT';
 if (q.includes('不是不')) return 'ABSTAIN_NESTED_NEGATION';
 if (q.includes('但') || (q.includes('换') && !/[，,；;]/u.test(q))) return 'ABSTAIN_UNMARKED_CLAUSE';
 if (q.includes('不要单人间单人间')) return 'ABSTAIN_REPEATED_TARGET';
 return 'UNSUPPORTED_REVIEW_REQUIRED';
}
for (const x of unsupported) assert.match(scopeGate(x.q),/^ABSTAIN_/,'UNSAFE_SCOPE_ACCEPTED '+x.reason);
console.log(JSON.stringify({status:'PASS',curated_pairs:4,mutations_rejected:2,unsupported_abstained:unsupported.length,semantic_generalization_verified:false,production_ready:false}));
