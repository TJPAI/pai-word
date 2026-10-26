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
console.log(JSON.stringify({status:'PASS',curated_pairs:4,mutations_rejected:2,semantic_generalization_verified:false,production_ready:false}));
