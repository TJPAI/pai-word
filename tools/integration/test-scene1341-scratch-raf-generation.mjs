import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scratch=readFileSync(new URL('../../rebuild-preview/scene1341-readonly/scene500-native-scratch.js',import.meta.url),'utf8');
assert.match(scratch,/let pendingAutoRestore=false,ratingWasDrawing=false,restoreGeneration=0/);
assert.match(scratch,/window\.PAI_SCENE1341_SCRATCH_CANCEL_PENDING=\(\)=>\{\s*restoreGeneration\+\+;pendingAutoRestore=false;ratingWasDrawing=false/);
assert.match(scratch,/const generation=\+\+restoreGeneration;\s*if\(state\.view!=='learning'\)/);
assert.match(scratch,/requestAnimationFrame\(\(\)=>\{\s*if\(generation!==restoreGeneration\)return/);
assert.match(scratch,/if\(pendingAutoRestore&&activeSurface&&!activeMode\)\{pendingAutoRestore=false;window\.PAI_SCRATCH_REENTER\?\.\(\);\}/);
console.log('PASS: scratch RAF callbacks are generation-pinned and invalidated on scene exit');
