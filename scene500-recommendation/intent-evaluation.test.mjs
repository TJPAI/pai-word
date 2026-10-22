import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateIntentCase as assess} from './intent-evaluation.mjs';
test('single: must be top1, not merely top5', () => {
  assert.equal(assess({type:'single',mustTop1:'S092'}, ['S092','S078']).passed,true);
  assert.equal(assess({type:'single',mustTop1:'S092'}, ['S078','S092']).passed,false);
});
test('multi: all distinct targets must occur among top5', () => {
  const q={type:'multi',mustTop5:['S078','S092']};
  assert.equal(assess(q,['S078','S092','S065']).passed,true);
  assert.equal(assess(q,['S078','S065','S092']).passed,true);
  assert.equal(assess(q,['S078','S065']).passed,false);
  assert.equal(assess(q,['S078','S001','S002','S003','S004','S092']).passed,false);
});
test('invalid labels or malformed predictions fail closed', () => {
  assert.throws(()=>assess({type:'multi',mustTop5:['S092','S092']},['S092']));
  assert.throws(()=>assess({type:'single',mustTop1:'S9'},['S092']));
  assert.throws(()=>assess({type:'unknown'},['S092']));
  assert.throws(()=>assess({type:'single',mustTop1:'S092'},['S092','S092']));
});
