import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_DATA} from '../js/scene-data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {emptyState,SCENE,PROGRESSION_FIELDS,CHARACTER_FIELDS,rollFields,editField,clone,History,refreshTexts,markdown} from '../js/core.js';
import {buildAIHandoff} from '../js/ai-handoff.js';
import {validateState,exportJSON,inspectImport} from '../js/storage.js';
test('B scene has 64 stable choices; basic, characters and progression remain separate',()=>{
 assert.equal(CHARACTER_FIELDS.length,6);assert.equal(PROGRESSION_FIELDS.length,4);assert.equal(SCENE.length,4);for(const rows of Object.values(SCENE_DATA))assert.equal(rows.length,16);assert.equal(new Set(Object.values(SCENE_DATA).flat().map(r=>r.id)).size,64);
 const s=emptyState();rollFields(s,undefined,{data:EXTRA_DATA,rng:()=>0.3});for(const [k] of SCENE)assert.equal(s.items[k],null);const before=clone(s.items);rollFields(s,SCENE.map(([k])=>k),{data:EXTRA_DATA,rng:()=>0.3});for(const [k] of SCENE)assert.ok(s.items[k]);for(const key of Object.keys(before).filter(k=>!k.startsWith('scene.')))assert.deepEqual(s.items[key],before[key]);
});
test('B scene edit, lock, clear, history, JSON and Japanese outputs retain selected content',()=>{
 const s=emptyState();rollFields(s,undefined,{data:EXTRA_DATA,rng:()=>0.3});editField(s,'scene.goal','共同で道具を返す','返却');const h=new History(s);rollFields(s,SCENE.map(([k])=>k),{data:EXTRA_DATA,rng:()=>0.4});assert.equal(s.items['scene.goal'].text,'共同で道具を返す');refreshTexts(s);assert.match(markdown(s),/共同で道具を返す/);assert.match(buildAIHandoff(s,{purpose:'chat'}),/共同で道具を返す/);assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);s.items['scene.goal']=null;s.locks['scene.goal']=false;h.record(s);assert.equal(h.undo().items['scene.goal'].text,'共同で道具を返す');
 const old=clone(s);for(const [k] of SCENE){delete old.items[k];delete old.locks[k];}assert.equal(validateState(old).items['scene.goal'],null);assert.deepEqual(validateState(old).texts,s.texts);
});
