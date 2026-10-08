import test from 'node:test';
import assert from 'node:assert/strict';
import {settingsChips,settingsChipsLabel,themeSummary} from '../js/settings-chips.js';
import {emptyState,clone,updateSettings} from '../js/core.js';
import {TONES,PURPOSES,THEMES} from '../js/data.js';
import {STAGE_PAIRS,settingsForPair} from '../js/stage-selection.js';

test('default state shows four chips in a fixed order',()=>{
 const chips=settingsChips(emptyState());
 assert.deepEqual(chips.map(c=>c.key),['stage','tone','purpose','themes']);
 assert.deepEqual(chips.map(c=>c.label),['舞台','トーン','出力用途','好み']);
 assert.deepEqual(chips.map(c=>c.value),['すべて','シリアス',PURPOSES[1],'お任せ']);
});

test('every tone and purpose has a non-empty chip value',()=>{
 for(let tone=1;tone<=TONES.length;tone++)for(const purpose of PURPOSES){
  const state=emptyState();updateSettings(state,{tone,purpose});
  const chips=settingsChips(state);
  assert.equal(chips[1].value,TONES[tone-1]);assert.equal(chips[2].value,purpose);
 }
});

test('single stage and all stage pairs use the same label as the app',()=>{
 const state=emptyState();updateSettings(state,{stage:'wafu'});
 assert.equal(settingsChips(state)[0].value,'和風');
 for(const [key,label] of STAGE_PAIRS){const mixed=emptyState();updateSettings(mixed,settingsForPair(key));assert.equal(settingsChips(mixed)[0].value,label);}
});

test('theme chip shows the selected count, or お任せ',()=>{
 assert.equal(themeSummary([]),'お任せ');
 const state=emptyState();updateSettings(state,{themes:THEMES.slice(0,3).map(([id])=>id)});
 assert.equal(settingsChips(state)[3].value,'3個');
});

test('chips do not change the state',()=>{
 const state=emptyState();updateSettings(state,{stage:'school',themes:[THEMES[0][0]]});
 const before=clone(state);settingsChips(state);assert.deepEqual(state,before);
});

test('accessible label lists every chip',()=>{
 assert.equal(settingsChipsLabel(settingsChips(emptyState())),`設定を開く（舞台：すべて、トーン：シリアス、出力用途：${PURPOSES[1]}、好み：お任せ）`);
});
