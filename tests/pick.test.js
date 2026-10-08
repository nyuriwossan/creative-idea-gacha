import test from 'node:test';
import assert from 'node:assert/strict';
import {candidatesFor,candidateLabel,PICK_COUNT} from '../js/pick.js';
import {emptyState,rollFields,updateSettings,clone} from '../js/core.js';
import {BASIC} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {settingsForPair,selectedStages} from '../js/stage-selection.js';
import {isBridge} from '../js/stage-mix.js';

const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const KEYS=BASIC.map(([key])=>key);
function drawn(seed=1,patch={}){const state=emptyState();updateSettings(state,patch);rollFields(state,undefined,{data:EXTRA_DATA,recent:{},rng:rngFor(seed)});return state;}

test('every basic field returns 1-10 distinct candidates that differ from the current value',()=>{
 for(const [seed,patch] of [[1,{}],[7,{stage:'wafu',tone:2}],[11,{stage:'school',tone:4,coherence:'mix'}]]){
  const state=drawn(seed,patch);
  for(const key of KEYS){
   const list=candidatesFor(state,key,{data:EXTRA_DATA,recent:{},rng:rngFor(seed*100+key.length)});
   assert.ok(list.length>=1&&list.length<=PICK_COUNT,`${key}: ${list.length}`);
   const labels=list.map(item=>candidateLabel(item,key));
   assert.equal(new Set(labels).size,labels.length,`${key} has duplicates`);
   assert.ok(!labels.includes(candidateLabel(state.items[key],key)),`${key} repeats the current value`);
   for(const item of list){assert.equal(item.source,'generated');assert.equal(typeof item.candidateId,'string');}
  }
 }
});

test('usually fills all ten slots for common fields',()=>{
 const state=drawn(3);
 for(const key of ['relation','incident','conflict'])assert.equal(candidatesFor(state,key,{data:EXTRA_DATA,rng:rngFor(5)}).length,PICK_COUNT,key);
});

test('state and recent are not changed by building candidates',()=>{
 const state=drawn(5),recent={conflict:['x'],world:[]};state.locks.conflict=true;
 const beforeState=clone(state),beforeRecent=clone(recent);
 for(const key of KEYS)candidatesFor(state,key,{data:EXTRA_DATA,recent,rng:rngFor(9)});
 assert.deepEqual(state,beforeState);assert.deepEqual(recent,beforeRecent);
});

test('stage pairs draw candidates from the pair, including bridge materials',()=>{
 let bridges=0,inside=0,total=0,stages,state;
 for(const seed of [13,14,15])for(const key of KEYS.filter(k=>k!=='world')){
  state=drawn(seed,settingsForPair('fantasy+school'));stages=selectedStages(state.settings);
  const list=candidatesFor(state,key,{data:EXTRA_DATA,rng:rngFor(seed+key.length)});assert.ok(list.length>=1,key);
  for(const item of list){
   total++;if(!item.stageTags.length||item.stageTags.some(t=>stages.includes(t))||isBridge(item,state.settings))inside++;
   if(isBridge(item,state.settings))bridges++;
  }
 }
 // 通常の引き直しと同じ重み（組み合わせ外は低い重みで残る）なので、大半が組み合わせ・橋渡し・舞台を問わない素材になる。
 assert.ok(inside/total>=0.85,`only ${inside}/${total} candidates fit the pair`);
 assert.ok(bridges>0,'no bridge material among pair candidates');
});

test('narrow conditions return fewer candidates instead of failing',()=>{
 for(const [stage,tone] of [['research',1],['underworld',1],['isekai',5]]){
  const state=drawn(21,{stage,tone});
  for(const key of KEYS){
   const list=candidatesFor(state,key,{data:EXTRA_DATA,rng:rngFor(23)});
   assert.ok(Array.isArray(list)&&list.length<=PICK_COUNT,`${stage}/${tone}/${key}`);
  }
 }
 const empty=emptyState();empty.items.gimmick=null;
 assert.doesNotThrow(()=>candidatesFor(empty,'gimmick',{data:EXTRA_DATA,rng:rngFor(2)}));
});

test('a locked field still yields candidates (the screen disables the button instead)',()=>{
 const state=drawn(31);state.locks.twist=true;
 assert.ok(candidatesFor(state,'twist',{data:EXTRA_DATA,rng:rngFor(3)}).length>=1);
});
