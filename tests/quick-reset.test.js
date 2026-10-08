import test from 'node:test';
import assert from 'node:assert/strict';
import {lockCount,themeCount,unlockAll,clearThemes,quickResetView} from '../js/quick-reset.js';
import {emptyState,clone,rollFields,updateSettings,editField,FIELDS,QUESTION_CATEGORIES} from '../js/core.js';
import {drawQuestions} from '../js/questions.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {THEMES} from '../js/data.js';
import {STAGE_PAIRS,settingsForPair} from '../js/stage-selection.js';

let seed=7;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function filled(){
 const state=emptyState();rollFields(state,FIELDS.map(([k])=>k),{data:EXTRA_DATA,rng});
 editField(state,'genre','自分で書いたジャンル','自作');
 state.characters.protagonist.name='葵';state.metadata.notes='メモ';state.metadata.name='題';
 for(const [category] of QUESTION_CATEGORIES)drawQuestions(state,category,{rng});
 return state;
}

test('lock count covers every item lock and every question category, including hidden ones',()=>{
 const state=filled();
 for(const key of Object.keys(state.locks))state.locks[key]=false;
 for(const slots of Object.values(state.questions))for(const slot of slots)slot.locked=false;
 assert.equal(lockCount(state),0);
 state.locks['scene.goal']=true;state.locks.world=true;
 const last=QUESTION_CATEGORIES.at(-1)[0];state.questions[last][0].locked=true;
 assert.equal(lockCount(state),3);
 assert.equal(quickResetView(state).unlock.disabled,false);
 unlockAll(state);
 assert.equal(lockCount(state),0);assert.equal(quickResetView(state).unlock.disabled,true);
});

test('unlock changes only lock flags: items, answers, names, notes, settings stay',()=>{
 const state=filled();updateSettings(state,{themes:[THEMES[0][0]],...settingsForPair(STAGE_PAIRS[0][0])});
 for(const key of Object.keys(state.locks))state.locks[key]=true;
 for(const slots of Object.values(state.questions))for(const slot of slots){slot.locked=true;slot.answer='回答';}
 const before=clone(state);unlockAll(state);
 const expected=clone(before);for(const key of Object.keys(expected.locks))expected.locks[key]=false;for(const slots of Object.values(expected.questions))for(const slot of slots)slot.locked=false;
 assert.deepEqual(state,expected);
 assert.ok(Object.values(state.questions).flat().every(slot=>slot.answer==='回答'));
});

test('clear themes changes only themes: stage pair, tone, purpose, coherence and locks stay',()=>{
 const state=filled();updateSettings(state,{themes:THEMES.slice(0,3).map(([id])=>id),tone:2,coherence:'mix',...settingsForPair(STAGE_PAIRS.at(-1)[0])});
 state.locks.world=true;
 assert.equal(themeCount(state),3);assert.equal(quickResetView(state).themes.disabled,false);
 const before=clone(state);clearThemes(state);
 const expected=clone(before);expected.settings.themes=[];
 assert.deepEqual(state,expected);
 assert.equal(quickResetView(state).themes.disabled,true);
});

test('labels are Japanese, describe the action, and never expose internal ids',()=>{
 const state=filled();state.locks.world=true;updateSettings(state,{themes:[THEMES[0][0]]});
 const view=quickResetView(state);
 assert.match(view.unlock.label,/ロックを解除/);assert.match(view.unlock.label,/本文と回答は残ります/);
 assert.match(view.themes.label,/テーマの選択を解除/);
 assert.doesNotMatch(view.themes.label,new RegExp(THEMES[0][0]));
});

test('no-op on an empty state keeps it identical',()=>{
 const state=emptyState(),before=clone(state);unlockAll(state);clearThemes(state);assert.deepEqual(state,before);
 assert.deepEqual(quickResetView(state),{unlock:{disabled:true,label:'ロック解除（固定中の項目はありません）'},themes:{disabled:true,label:'テーマ解除（選択中のテーマはありません）'}});
});
