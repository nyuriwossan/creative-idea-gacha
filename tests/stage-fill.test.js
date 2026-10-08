import {restoreReviewedText} from './world-restructure-support.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DATA,BASIC,THEMES,STAGES} from '../js/data.js';
import {EXTRA_DATA,QUESTION_DATA} from '../js/extra-data.js';
import {STAGE_FILL_A,STAGE_FILL_B,STAGE_FILL_BASIC,parseStageFill} from '../js/stage-fill-data.js';
import {CONTEXTS,meetsContext,worldContext,PROFESSIONAL_WORLD_PATCHES} from '../js/context.js';
import {TOPICS} from '../js/story-metadata.js';
import {emptyState,rollFields,WEIGHTS,refreshTexts,History,editField,updateSettings} from '../js/core.js';
import {availablePool} from '../js/priority.js';
import {cohesionMultiplier,knownLinks} from '../js/cohesion.js';
import {validateState,exportJSON,inspectImport,Repository,STORAGE_KEY} from '../js/storage.js';
import {auditStageFill,primaryCounts} from './stage-fill-audit.mjs';
const baseline=JSON.parse(fs.readFileSync(new URL('./stage-fill-baseline.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const expectedA={school:[9,4,6,5,7,5,6],underworld:[8,3,6,5,6,5,6],western:[3,3,4,4,5,7,7],research:[4,3,3,0,2,0,2]};
const expectedB={school:[1,2,0,0,0,0,0],underworld:[0,2,0,0,0,0,0],research:[0,3,0,0,0,0,0],modern:[0,2,3,5,6,3,5],scifi:[0,4,4,0,4,0,4],wafu:[0,4,0,0,2,0,2],isekai:[0,0,4,0,0,0,1]};
function selectWorld(s,w){rollFields(s,['world'],{data:{world:[w]},rng:()=>0});}
test('stage fill strict eleven-column parser rejects malformed rows and does not add defaults',()=>{
 const good='relation|one|AとB|二者|12||||||pair';
 const row=parseStageFill('school','A','\n # comment\n'+good).relation[0];
 assert.deepEqual(row.stageTags,[]);assert.deepEqual(row.themeTags,[]);assert.deepEqual(row.topicTags,[]);assert.deepEqual(row.requiresContext,[]);
 for(const bad of [good+'|extra',good.slice(0,good.lastIndexOf('|')),good.replace('pair','neutral'),good.replace('relation','world'),good+'\n'+good])assert.throws(()=>parseStageFill('school','A',bad));
 const w=parseStageFill('school','A','world|one|校舎|学校|12||||||').world[0];assert.equal(Object.hasOwn(w,'relationShape'),false);
});
test('stage fill exact A/B allocations and final minimum coverage are separate invariants',()=>{
 for(const [data,expected] of [[STAGE_FILL_A,expectedA],[STAGE_FILL_B,expectedB]])assert.deepEqual(Object.fromEntries(Object.entries(primaryCounts(data)).map(([stage,row])=>[stage,Object.values(row)])),expected);
 const a=auditStageFill();assert.equal(Object.values(STAGE_FILL_BASIC).flat().length,189);assert.ok(a.after.total>=1277);
 for(const [stage,row] of Object.entries(a.after.stageCategories)){assert.ok(row.world>=15,stage);for(const [key,count] of Object.entries(row))assert.ok(count>=6,stage+key);}
 for(const [stage,tones] of Object.entries(a.after.worldTones))tones.forEach((n,i)=>assert.ok(n>=(i===4?1:2),stage+' tone '+(i+1)));
 assert.ok(a.after.worldTones.school[4]>=3);assert.equal(a.themeTaggedA,128);
});
test('stage fill old definition values, optional data, questions, themes and all weights stay identical',()=>{
 for(const [key,ids] of Object.entries(baseline.basicIds)){const set=new Set(ids),old=DATA[key].filter(r=>set.has(r.id)).map(restoreReviewedText).map(r=>PROFESSIONAL_WORLD_PATCHES[r.id]?{...r,contextTags:r.contextTags.filter(t=>!PROFESSIONAL_WORLD_PATCHES[r.id].includes(t))}:r);assert.equal(old.length,ids.length);assert.equal(hash(old),baseline.basicHashes[key],key);}
 for(const [key,value] of Object.entries(baseline.extraHashes))assert.equal(hash(EXTRA_DATA[key].filter(r=>!['abstract-seed','world-expand'].includes(r.origin))),value,key);
 assert.equal(hash(Object.fromEntries(Object.entries(QUESTION_DATA).map(([key,rows])=>[key,rows.slice(0,26)]))),baseline.questionHash);assert.equal(hash(THEMES.slice(0,20)),baseline.themeHash);assert.deepEqual(WEIGHTS,baseline.WEIGHTS);assert.equal(STORAGE_KEY,'creativeIdeaGacha_v2');
});
test('stage fill new metadata has known dictionaries, unique IDs/text, explicit shapes and reachable backgrounds at every tone',()=>{
 const all=Object.values(EXTRA_DATA).flat();const ids=Object.values(STAGE_FILL_BASIC).flat().map(r=>r.id);assert.equal(new Set(ids).size,189);
 for(const [key,rows] of Object.entries(STAGE_FILL_BASIC))for(const row of rows){
  assert.equal(all.filter(r=>r.id===row.id).length,1);assert.equal(DATA[key].filter(r=>r.id===row.id).length,1,row.id);assert.equal(restoreReviewedText(DATA[key].find(r=>r.id===row.id)).text,row.text);
  assert.equal(row.id,`sf-${row.primaryStage}-${key}-${row.id.split(`sf-${row.primaryStage}-${key}-`)[1]}`);
  assert.equal(row.source,'generated');assert.equal(row.origin,'stage-fill');assert.ok(row.text.length<=500&&row.titleWord.length<=30);assert.ok(row.tones.length<5);
  for(const [tags,dict] of [[row.stageTags,STAGES],[row.themeTags,THEMES],[row.topicTags,TOPICS],[row.contextTags,CONTEXTS],[row.requiresContext,CONTEXTS]]){assert.equal(new Set(tags).size,tags.length);for(const tag of tags)assert.ok(dict.some(([id])=>id===tag),row.id+' '+tag);}
  if(key==='relation')assert.ok(['pair','group'].includes(row.relationShape));else assert.equal(Object.hasOwn(row,'relationShape'),false);
  for(const tone of row.tones)assert.ok(DATA.world.some(w=>w.stageTags.includes(row.primaryStage)&&w.tones.includes(tone)&&meetsContext(row,w.contextTags)),row.id+' tone '+tone);
 }
});
test('stage fill all 189 candidates enter native available pools and can be drawn, saved and hydrated by explicit ID',()=>{
 for(const [key,rows] of Object.entries(STAGE_FILL_BASIC))for(const row of rows){
  const s=emptyState();Object.assign(s.settings,{stage:row.primaryStage,tone:row.tones[0],themes:row.themeTags.slice(0,3)});
  if(key!=='world')selectWorld(s,DATA.world.find(w=>w.stageTags.includes(row.primaryStage)&&w.tones.includes(s.settings.tone)&&meetsContext(row,w.contextTags)));
  assert.ok(availablePool(s,key,EXTRA_DATA,worldContext(s)).pool.some(r=>r.id===row.id));
  rollFields(s,[key],{data:{[key]:[row]},rng:()=>0});refreshTexts(s);assert.equal(s.items[key].candidateId,row.id);
  assert.equal(Object.hasOwn(s.items[key],'primaryStage'),false);assert.equal(Object.hasOwn(s.items[key],'stageFillBatch'),false);
  assert.deepEqual(validateState(s),s);assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);
  const missing=structuredClone(s);for(const field of ['contextTags','requiresContext','topicTags','plotLinks'])delete missing.items[key][field];assert.deepEqual(validateState(missing).items[key],s.items[key]);
 }
});
test('stage fill 30 conflict/twist pairs are connected and cohesive link weighting stays neutral in mix',()=>{
 const a=auditStageFill();assert.equal(a.links.length,30);const pairs=a.links.filter(r=>r.conflicts.length&&r.twists.length);assert.equal(pairs.length,30);assert.equal(a.links.filter(r=>!r.conflicts.length).length,0);
 for(const pair of pairs){const conflict=STAGE_FILL_BASIC.conflict.find(r=>r.plotLinks.includes(pair.link)),twist=STAGE_FILL_BASIC.twist.find(r=>r.plotLinks.includes(pair.link)),s=emptyState();s.items.conflict=conflict;assert.deepEqual(knownLinks(twist),twist.plotLinks);assert.equal(cohesionMultiplier(twist,s,'twist',[]),4);s.settings.coherence='mix';assert.equal(cohesionMultiplier(twist,s,'twist',[]),1);}
});
test('stage fill missing required backgrounds preserve old items and show existing reason; custom prose infers nothing',()=>{
 for(const tag of ['royal','artificial-intelligence','memory-tech']){
  const entry=Object.entries(STAGE_FILL_BASIC).flatMap(([key,rows])=>rows.map(row=>({key,row}))).find(({key,row})=>key!=='world'&&row.requiresContext.includes(tag));const {key,row}=entry,s=emptyState();s.settings.tone=row.tones[0];editField(s,'world','宮廷とAIと人格の複製がある作者の世界','世界',[]);const old=structuredClone(s);const result=rollFields(s,[key],{data:{[key]:[row]}});assert.equal(result.changed,0);assert.match(result.notices.join('\n'),/必要な背景要素/);assert.deepEqual(s,old);
 }
 assert.ok(STAGE_FILL_BASIC.relation.find(r=>r.id.includes('prediction-editor')).requiresContext.includes('artificial-intelligence'));assert.equal(Object.values(STAGE_FILL_BASIC).flat().some(r=>r.requiresContext.includes('future-record')),false);
});
test('stage fill fixed seed matrix respects world stages, context, tone, previous exclusion and fixed items in both modes',()=>{
 for(const [stage] of STAGES.slice(1))for(let tone=1;tone<=5;tone++)for(const coherence of ['cohesive','mix'])for(let seed=1;seed<=16;seed++){
  const s=emptyState();Object.assign(s.settings,{stage,tone,coherence});rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(seed)});assert.ok(s.items.world.stageTags.includes(stage));
  for(const [key] of BASIC){assert.ok(s.items[key].tones.includes(tone));assert.ok(meetsContext(s.items[key],worldContext(s)));}
  const first=structuredClone(s);s.locks.world=true;s.locks.relation=true;rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(seed+100)});assert.deepEqual(s.items.world,first.items.world);assert.deepEqual(s.items.relation,first.items.relation);
  for(const [key] of BASIC.slice(1).filter(([key])=>key!=='relation'))assert.notEqual(s.items[key].candidateId,first.items[key].candidateId);
 }
});
test('stage fill generated and custom materials keep history, saved prose, notes, answers and handoff without read-time regeneration',()=>{
 const s=emptyState();Object.assign(s.settings,{stage:'school',tone:3});const row=STAGE_FILL_BASIC.world[0];selectWorld(s,row);refreshTexts(s);s.texts.memo='保存した構成メモ';s.texts.hint='作者のヒント';s.questions.world=[{id:'author-question',text:'記録を残す理由は？',answer:'後輩へ渡すため',locked:true}];s.metadata.notes='作者の秘密';s.handoff.purpose='chat';
 const history=new History(s);editField(s,'world',row.text+'。作者の追記','追記',[]);history.record(s);assert.equal(history.undo().items.world.candidateId,row.id);assert.equal(history.redo().items.world.source,'custom');
 const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};const repository=new Repository(storage);repository.load();repository.write(s);const savedCurrent=repository.save(s);const saved=structuredClone(repository.works[0]);const separate=repository.save(savedCurrent);assert.equal(repository.works.length,2);const loaded=new Repository(storage);assert.deepEqual(loaded.load().current,separate);assert.deepEqual(loaded.works[0],saved);assert.equal(loaded.works[0].state.texts.memo,'保存した構成メモ');
 const old=structuredClone(s);updateSettings(s,{themes:['buddy'],tone:2});assert.deepEqual(s.items,old.items);assert.deepEqual(s.questions,old.questions);assert.deepEqual(validateState(old),old);
});
test('README material total is generated from final DATA',()=>{
 const text=fs.readFileSync(new URL('../README.md',import.meta.url),'utf8');assert.ok(text.includes(`基本7項目・${Object.values(DATA).flat().length.toLocaleString('en-US')}素材・`));
});
