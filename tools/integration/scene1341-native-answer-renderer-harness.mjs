/* Execute the EXACT Scene500 base answerHtml source, not a copy of its HTML.
 * The function is extracted verbatim from current native learning-runtime.js.
 * This is a Node CI renderer logic test, NOT a Safari pixel/browser test.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const runtimeUrl=new URL('../../rebuild-preview/learning-runtime.js',import.meta.url);
const source=fs.readFileSync(runtimeUrl,'utf8');
const begin=source.indexOf('  window.answerHtml=function(u){');
const stop=source.indexOf('\n  // Settings actions',begin);
if(begin<0||stop<0||stop<=begin)throw Error('SC1341_NATIVE_RENDERER_SOURCE_NOT_FOUND');
const sourceFunction=source.slice(begin,stop);
if(!sourceFunction.includes('scene1341-example-translation')||
   !sourceFunction.trimEnd().endsWith('};'))
  throw Error('SC1341_NATIVE_RENDERER_SOURCE_CONTRACT_CHANGED');
const escapeHtml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
export const NATIVE_SCENE500_RENDERER_SOURCE_MARKER='learning-runtime.js::window.answerHtml';
export function renderWithRealScene500AnswerHtml(unit,{showCollocations=true,showExamples=true,showCompare=true}={}){
  const window={PAI_APPROVED_TEACHING_OVERLAY:null};
  const state={showCollocations,showExamples,showCompare};
  const context={window,state,escapeHtml,contrastData:()=>({items:[]})};
  vm.runInNewContext(sourceFunction,context,{timeout:1000,filename:'learning-runtime.js::answerHtml'});
  if(typeof window.answerHtml!=='function')throw Error('SC1341_NATIVE_ANSWER_RENDERER_UNAVAILABLE');
  return window.answerHtml(unit);
}
export function assertScene1341NativeAnswerHtml(unit){
  if(unit?.readOnly!==true||unit?.s?.playable!==false||
     unit?.canWriteSrs!==false||unit?.productionReleaseAllowed!==false)
    throw Error('SC1341_NATIVE_DISPLAY_NOT_QUARANTINED');
  const html=renderWithRealScene500AnswerHtml(unit);
  if(!html.includes('class="answer density-3"')||
     !html.includes('class="definition"')||
     !html.includes('class="example"')||
     !html.includes('scene1341-example-translation'))
    throw Error('SC1341_NATIVE_ANSWER_RENDER_STRUCTURE_CHANGED '+unit.k);
  const fields=[unit.s.m,unit.s.c,unit.s.e[0],unit.s.example_zh];
  for(const field of fields)if(field&&!html.includes(escapeHtml(field)))
    throw Error('SC1341_NATIVE_ANSWER_MISSING_ESCAPED_FIELD '+unit.k);
  if(unit.s.x&&!html.includes(escapeHtml(unit.s.x)))
    throw Error('SC1341_NATIVE_ANSWER_MISSING_USAGE_NOTE '+unit.k);
  if(html.includes('>undefined<')||html.includes('>null<'))
    throw Error('SC1341_NATIVE_ANSWER_NULL_VISIBLE '+unit.k);
  return html;
}
