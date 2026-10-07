import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DATA,BASIC,STAGES,THEMES} from '../js/data.js';
import {EXTRA_DATA,QUESTION_DATA} from '../js/extra-data.js';
import {CONTEXTS,meetsContext,worldContext} from '../js/context.js';
import {WORLD_REVISIONS,reviseWorldDefinitions} from '../js/world-revision-data.js';
import {emptyState,rollFields,refreshTexts,History,markdown,WEIGHTS,clone} from '../js/core.js';
import {validateState,Repository,STORAGE_KEY,exportJSON,inspectImport,filterWorks} from '../js/storage.js';
import {buildAIHandoff} from '../js/ai-handoff.js';
import {tryModernPreset} from '../js/presets.js';
import {baseline,priorData,restoreReviewedText,rngFor,countWorldPools,simulatePresets} from './world-restructure-support.mjs';
// Only the new version/default fields change; every prior snapshot value is still compared.
const upgraded=state=>{const copy=clone(state);copy.schemaVersion=3;copy.settings.stage2=null;for(const item of Object.values(copy.items))if(item)item.blendPairs=[];return copy;};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const revised=new Map(WORLD_REVISIONS.map(row=>[row.id,row]));
const generated=row=>{const s=emptyState();s.settings.tone=row.tones[0];rollFields(s,['world'],{data:{world:[row]},rng:()=>0});return s;};
test('world restructure changes exactly 32 text/title pairs and preserves all 249 IDs, 217 others and every metadata value',()=>{
 assert.equal(DATA.world.length,249);assert.equal(BASIC.flatMap(([key])=>DATA[key].filter(r=>r.origin!=='abstract-seed')).length,1457);assert.equal(revised.size,32);assert.deepEqual(WORLD_REVISIONS,baseline.expectedRevisions);
 assert.equal(new Set(DATA.world.map(w=>w.id)).size,249);assert.deepEqual(DATA.world.map(w=>w.id),baseline.world.map(w=>w.id));assert.equal(new Set(DATA.world.map(w=>w.text)).size,249);
 let changed=0;for(const before of baseline.world){const after=DATA.world.find(w=>w.id===before.id),r=revised.get(before.id);if(r){assert.equal(before.text,r.beforeText);assert.equal(after.text,r.text);assert.equal(after.titleWord,r.titleWord);assert.deepEqual(restoreReviewedText(after),before);changed++;}else assert.deepEqual(after,before);assert.ok(after.text.length<=500&&after.titleWord.length<=30);assert.equal(EXTRA_DATA.world.find(w=>w.id===after.id),after);}
 assert.equal(changed,32);for(const [key,value] of Object.entries(baseline.otherHashes))assert.equal(hash(DATA[key].filter(r=>r.origin!=='abstract-seed')),value,key);for(const [key,value] of Object.entries(baseline.optionalHashes))assert.equal(hash(EXTRA_DATA[key].filter(r=>r.origin!=='abstract-seed')),value,key);assert.equal(hash(QUESTION_DATA),baseline.questionHash);assert.deepEqual(THEMES,baseline.THEMES);assert.deepEqual(CONTEXTS,baseline.CONTEXTS);assert.deepEqual(STAGES,baseline.STAGES);assert.deepEqual(WEIGHTS,baseline.WEIGHTS);
 const royal=DATA.world.find(w=>w.id==='world-original-1jdjray');assert.ok(royal.contextTags.includes('royal'));assert.deepEqual(royal.themeTags,baseline.world.find(w=>w.id===royal.id).themeTags);
 for(const text of ['言霊が力を持つ世界','魔法学校']){const before=baseline.world.find(w=>w.text===text);assert.ok(before,text);assert.deepEqual(DATA.world.find(w=>w.id===before.id),before);}
});
test('world revision application is immutable, idempotent and never overwrites a divergent source',()=>{
 const input=clone(baseline.world),snapshot=clone(input);for(const row of input)Object.freeze(row);Object.freeze(input);const result=reviseWorldDefinitions(input);assert.notEqual(result,input);assert.deepEqual(input,snapshot);assert.deepEqual(result,DATA.world);assert.deepEqual(reviseWorldDefinitions(result),result);
 for(let i=0;i<input.length;i++)assert.equal(result[i]===input[i],!revised.has(input[i].id));
 const changed={...input.find(w=>revised.has(w.id)),text:'別の改修で作者が指定した本文'};assert.equal(reviseWorldDefinitions([changed])[0],changed);
});
test('world stage/tone and profession/tone pools plus deterministic normal draws remain equal in both modes',()=>{
 assert.deepEqual(countWorldPools(DATA.world),countWorldPools(baseline.world));
 for(const [stage] of STAGES.slice(1))for(let tone=1;tone<=5;tone++)for(const coherence of ['cohesive','mix'])for(const seed of [1,42,20261006]){
  const a=emptyState(),b=emptyState();for(const s of [a,b])Object.assign(s.settings,{stage,tone,coherence});const ar={},br={},rngA=rngFor(seed),rngB=rngFor(seed);
  for(let draw=0;draw<3;draw++){const x=rollFields(a,undefined,{data:priorData,recent:ar,rng:rngA}),y=rollFields(b,undefined,{data:EXTRA_DATA,recent:br,rng:rngB});assert.deepEqual(x,y);assert.deepEqual(ar,br);const normalized=clone(b);normalized.items.world=restoreReviewedText(b.items.world);assert.deepEqual(normalized,a);for(const [key] of BASIC)assert.ok(meetsContext(b.items[key],worldContext(b)));assert.ok(b.items.world.stageTags.includes(stage));}
 }
});
test('all seven presets retain the preexisting 35 tone sequences and candidate shortages are atomic',()=>{
 const before=simulatePresets(priorData),after=simulatePresets();assert.deepEqual(after,before);
 const table={lovers:[20,20,20,20,20],'secret-office':[20,20,20,20,20],'work-love':[20,20,20,20,20],police:[1,20,20,1,1],education:[20,20,20,20,1],medical:[20,20,20,20,1],company:[20,20,20,20,20]};
 for(const [id,counts] of Object.entries(table))assert.deepEqual(after.filter(r=>r.id===id).map(r=>r.successes),counts);
 for(const row of after)for(const attempt of row.attempts)if(!attempt.ok){assert.equal(attempt.atomic,true);assert.match(attempt.reason,/直前と異なる/);}
 const fixed=generated(DATA.world.find(w=>w.contextTags.includes('medical')));fixed.locks.world=true;const raw=clone(fixed),recent={world:['old']};assert.equal(tryModernPreset(fixed,recent,'police').ok,false);assert.deepEqual(fixed,raw);assert.deepEqual(recent,{world:['old']});
});
test('old generated/custom/empty/missing/legacy fixtures keep prior validation, JSON and localStorage snapshots',()=>{
 for(const fixture of baseline.fixtures){const actual=validateState(fixture.input);assert.deepEqual(actual,upgraded(fixture.expected),fixture.name);assert.deepEqual(inspectImport(exportJSON(actual))[0].state,upgraded(fixture.expected));const work={id:'old-'+fixture.name,createdAt:'2026-10-01T01:02:03Z',updatedAt:'2026-10-02T02:03:04Z',fav:true,legacyDate:'',state:fixture.input};const raw=JSON.stringify({schemaVersion:2,current:fixture.input,works:[work]}),memory=new Map([[STORAGE_KEY,raw]]),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};const repository=new Repository(storage),loaded=repository.load();assert.deepEqual(loaded.current,upgraded(fixture.expected));assert.deepEqual(repository.works[0],{...work,state:upgraded(fixture.expected)});assert.equal(memory.get(STORAGE_KEY),raw);assert.deepEqual(inspectImport(exportJSON(actual,repository.works))[0],{...work,state:upgraded(fixture.expected)});}
});
test('all 32 old locked worlds retain saved prose/background through rerolls, unlocking and history; new draws use revised text',()=>{
 for(const revision of WORLD_REVISIONS){const before=baseline.world.find(w=>w.id===revision.id),s=generated(before);s.locks.world=true;s.texts.memo='保存したメモ';const world=clone(s.items.world),history=new History(s);rollFields(s,BASIC.map(([k])=>k),{data:EXTRA_DATA,rng:rngFor(20261006)});assert.deepEqual(s.items.world,world);history.record(s);s.locks.world=false;assert.deepEqual(s.items.world,world);history.record(s);assert.equal(history.undo().locks.world,true);assert.deepEqual(history.redo().items.world,world);
  const newly=generated(DATA.world.find(w=>w.id===revision.id));assert.equal(newly.items.world.text,revision.text);assert.equal(newly.items.world.titleWord,revision.titleWord);assert.equal(newly.items.world.candidateId,before.id);assert.deepEqual(validateState(newly),newly);
 }
 const old=generated(baseline.world.find(w=>w.id==='mp-modern-love-world-company-town'));old.locks.world=false;const prior=clone(old.items.world);rollFields(old,['world'],{data:{world:[DATA.world.find(w=>w.id==='mp-workplace-pro-world-sales-floor')]},rng:()=>0});assert.notEqual(old.items.world.candidateId,prior.candidateId);assert.equal(old.items.world.text,revised.get('mp-workplace-pro-world-sales-floor').text);
});
test('new and old world prose flows into summaries, Markdown and eight Japanese handoffs without replacing saved outputs',()=>{
 for(const id of ['mp-modern-love-world-share-house','world-original-1jdjray','sf-school-world-score-rewrite','mp-workplace-pro-world-night-ward'])for(const row of [baseline.world.find(w=>w.id===id),DATA.world.find(w=>w.id===id)]){
  const s=generated(row);s.texts={summary:'保存済み要約',memo:'保存済み構成メモ',hint:'保存済みヒント',titles:['保存済み題']};const loaded=validateState(s);assert.deepEqual(loaded.texts,s.texts);assert.ok(markdown(loaded).includes('保存済み要約'));
  for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){const text=buildAIHandoff(loaded,{purpose,length});assert.ok(text.includes(row.text));assert.doesNotMatch(text,/world-original-|mp-modern-love-world-|sf-school-world-|mp-workplace-pro-world-|undefined|null/);assert.deepEqual(loaded.texts,s.texts);}
  refreshTexts(loaded,{rng:()=>0});assert.ok(loaded.texts.summary.includes(row.text));assert.ok(markdown(loaded).includes(row.text));assert.equal(loaded.items.world.text,row.text);
 }
});
test('saved old works retain save/overwrite/copy/favorite/search/tag and full backup behavior',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},repo=new Repository(storage);repo.load();const s=upgraded(baseline.fixtures[0].expected);const first=repo.save(s),old=clone(repo.works[0]);assert.equal(filterWorks(repo.works,'元案').length,1);repo.favorite(first.loadedWorkId,first);assert.equal(repo.works[0].fav,true);const copy=repo.duplicate(first.loadedWorkId);assert.notEqual(copy.loadedWorkId,old.id);assert.equal(copy.items.world.text,old.state.items.world.text);first.metadata.name='上書きした元案';repo.save(first,{overwrite:true});assert.equal(repo.works.length,2);assert.equal(repo.works.find(w=>w.id===first.loadedWorkId).state.items.world.text,old.state.items.world.text);const separate=repo.save(first);assert.equal(repo.works.length,3);const restored=new Repository({getItem:()=>null,setItem:()=>{}});restored.load();restored.addImported(inspectImport(exportJSON(first,repo.works)),first);assert.equal(restored.works.length,3);for(const work of restored.works)assert.equal(work.state.items.world.text,s.items.world.text);assert.notEqual(separate.loadedWorkId,first.loadedWorkId);
});
