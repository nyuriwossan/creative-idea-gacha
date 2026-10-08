import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_EXPAND_BASIC,WORLD_EXPAND_CHARACTERS,WORLD_EXPAND_CONTEXTS,parseWorldExpand} from '../js/world-expand-data.js';
import {DATA,BASIC,THEMES,STAGES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {CONTEXTS,meetsContext} from '../js/context.js';
import {TOPICS} from '../js/story-metadata.js';
import {emptyState,rollFields,clone} from '../js/core.js';

const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const NEW=new Set(WORLD_EXPAND_CONTEXTS.map(([id])=>id));
const all=[...Object.values(WORLD_EXPAND_BASIC).flat(),...WORLD_EXPAND_CHARACTERS.role];
const snapshot=row=>{const {id,origin,primaryPack,storyGroup,round4Group,primaryStage,stageFillBatch,modernProCategory,modernProBatch,...fields}=clone(row);return {...fields,candidateId:id,blendPairs:[]};};

test('all 118 rows are parsed once with valid columns, tones, shapes and unique IDs',()=>{
 assert.equal(all.length,118);
 assert.deepEqual(Object.fromEntries(Object.entries(WORLD_EXPAND_BASIC).map(([k,v])=>[k,v.length])),{world:27,genre:0,relation:31,incident:9,conflict:11,gimmick:16,twist:6});
 assert.equal(WORLD_EXPAND_CHARACTERS.role.length,18);
 for(const row of all){assert.equal(row.origin,'world-expand');assert.equal(row.source,'generated');assert.ok(row.tones.length&&row.tones.every(t=>t>=1&&t<=5));assert.ok(row.titleWord&&row.titleWord.length<=30);}
 for(const row of WORLD_EXPAND_BASIC.relation)assert.ok(['pair','group'].includes(row.relationShape));
 const ids=Object.values(DATA).flat().map(r=>r.id);assert.equal(new Set(ids).size,ids.length);
 for(const [key] of BASIC)for(const row of WORLD_EXPAND_BASIC[key])assert.ok(DATA[key].includes(row),row.id);
 assert.throws(()=>parseWorldExpand('world|x|本文|短語|1234|||||'),/11 columns/);
 assert.throws(()=>parseWorldExpand('relation|x|本文|短語|1234||||||triad'),/shape/);
});

test('mentor roles are added to both the protagonist and the counterpart (52 -> 70 each)',()=>{
 for(const person of ['protagonist','counterpart']){
  const pool=EXTRA_DATA[`${person}.role`];assert.equal(pool.length,70);
  for(const row of WORLD_EXPAND_CHARACTERS.role)assert.ok(pool.some(r=>r.id===`${person}-${row.id}`&&r.text===row.text),`${person} ${row.id}`);
 }
 assert.ok(EXTRA_DATA['protagonist.role'].some(r=>r.text==='剣士の弟子'));assert.ok(EXTRA_DATA['counterpart.role'].some(r=>r.text==='魔法使いの弟子'));
});

test('every tag is in the shared dictionaries, and the seven new backgrounds are registered',()=>{
 for(const [id] of WORLD_EXPAND_CONTEXTS)assert.ok(CONTEXTS.some(([c])=>c===id),id);
 for(const row of all){
  for(const tag of [...row.contextTags,...row.requiresContext])assert.ok(CONTEXTS.some(([id])=>id===tag),`${row.id} context ${tag}`);
  for(const tag of row.topicTags)assert.ok(TOPICS.some(([id])=>id===tag),`${row.id} topic ${tag}`);
  for(const tag of row.themeTags)assert.ok(THEMES.some(([id])=>id===tag),`${row.id} theme ${tag}`);
  for(const tag of row.stageTags)assert.ok(STAGES.some(([id])=>id===tag),`${row.id} stage ${tag}`);
 }
 for(const [id] of WORLD_EXPAND_CONTEXTS){
  assert.ok(WORLD_EXPAND_BASIC.world.some(w=>w.contextTags.includes(id)),`no world has ${id}`);
  assert.ok(all.some(r=>r.requiresContext.includes(id)),`nothing requires ${id}`);
 }
});

// 背景を持つ世界観を固定して引き、その背景を要求する素材が出るか（出ない世界では一件も出ないか）を確かめる。
function drawWith(world,tone,times,seed){
 const s=emptyState();s.settings.tone=tone;s.items.world=snapshot(world);s.locks.world=true;
 const seen=[],recent={},rng=rngFor(seed);
 for(let i=0;i<times;i++){rollFields(s,BASIC.map(([k])=>k).filter(k=>k!=='world'),{data:EXTRA_DATA,recent,rng});for(const [key] of BASIC)if(key!=='world')seen.push(s.items[key]);}
 return seen;
}

test('each new background world draws at least one material that requires it, within 1000 draws',()=>{
 for(const [id] of WORLD_EXPAND_CONTEXTS){
  const world=WORLD_EXPAND_BASIC.world.find(w=>w.contextTags.includes(id)),needs=Object.values(WORLD_EXPAND_BASIC).flat().filter(r=>r.requiresContext.includes(id));
  const tone=world.tones.find(t=>needs.some(r=>r.tones.includes(t)))??world.tones[0];
  const seen=drawWith(world,tone,1000,7+id.length);
  assert.ok(seen.some(item=>item?.requiresContext?.includes(id)),`${id}: never drawn in ${world.text}`);
 }
});

test('a world without the new backgrounds never draws materials that require them (1000 draws)',()=>{
 const office=DATA.world.find(w=>w.stageTags.includes('modern')&&!(w.contextTags||[]).some(t=>NEW.has(t))&&w.tones.includes(3));
 assert.ok(office);
 const seen=drawWith(office,3,1000,99);
 assert.equal(seen.filter(item=>(item?.requiresContext||[]).some(t=>NEW.has(t))).length,0);
 for(const row of all)if(row.requiresContext.some(t=>NEW.has(t)))assert.equal(meetsContext(row,office.contextTags||[]),false,row.id);
});

test('ability gimmicks and magic mentor roles stay inside worlds that have those backgrounds',()=>{
 const abilityGimmicks=WORLD_EXPAND_BASIC.gimmick.filter(r=>r.requiresContext.includes('ability'));
 assert.equal(abilityGimmicks.length,14);
 assert.equal(WORLD_EXPAND_BASIC.world.filter(w=>w.contextTags.includes('ability')).length,4);
 for(const role of WORLD_EXPAND_CHARACTERS.role.filter(r=>/魔法|錬金/.test(r.text)))assert.deepEqual(role.requiresContext,['magic']);
});
