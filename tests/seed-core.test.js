import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CORE_BY_ID,CORE_FIELD_BY_ID} from '../js/core-data.js';
import {coreFor,coreForField,seedOf,materialLines,memoForMarkdown,CORE_EXAMPLE_NOTE} from '../js/seed-core.js';
import {DATA,STAGES,PURPOSES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {emptyState,rollFields,refreshTexts,clone,textOf,markdown,editField,History,buildSummary,buildMemo,buildHint,buildOutline} from '../js/core.js';
import {rollFields as oldRoll,refreshTexts as oldRefresh,buildSummary as oldSummary,buildMemo as oldMemo,buildHint as oldHint,buildOutline as oldOutline} from './fixtures/core-layer-baseline-core.mjs';
import {buildAIHandoff as oldHandoff} from './fixtures/core-layer-baseline-handoff.mjs';
import {buildAIHandoff} from '../js/ai-handoff.js';
import {Repository,validateState,inspectImport,exportJSON,STORAGE_KEY} from '../js/storage.js';
import {settingsForPair,STAGE_PAIRS} from '../js/stage-selection.js';
const input=JSON.parse(fs.readFileSync(new URL('../docs/round9/core-data.json',import.meta.url),'utf8'));
const protection=JSON.parse(fs.readFileSync(new URL('./fixtures/core-layer-protection.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const itemFor=id=>{const row=Object.values(EXTRA_DATA).flat().find(row=>row.id===id),{id:original,origin,primaryPack,storyGroup,round4Group,primaryStage,stageFillBatch,modernProCategory,modernProBatch,...fields}=clone(row);return {...fields,candidateId:original,blendPairs:[]};};
const withCore=()=>{const s=emptyState();for(const key of ['conflict','gimmick','twist'])s.items[key]=itemFor(input.find(row=>row.field===key).id);return s;};
test('156 supplied cores exactly match known final IDs/fields, differ from prose and stay within 40 characters',()=>{
 assert.equal(input.length,156);assert.equal(Object.keys(CORE_BY_ID).length,156);assert.equal(Object.keys(CORE_FIELD_BY_ID).length,156);assert.equal(new Set(input.map(row=>row.id)).size,156);
 assert.deepEqual(['conflict','gimmick','twist'].map(key=>input.filter(row=>row.field===key).length),[50,24,82]);
 for(const row of input){assert.ok(DATA[row.field].some(item=>item.id===row.id));assert.equal(CORE_BY_ID[row.id],row.core);assert.equal(CORE_FIELD_BY_ID[row.id],row.field);assert.ok(row.core.trim()&&Array.from(row.core).length<=40);assert.notEqual(itemFor(row.id).text,row.core);}
});
test('draw code, metadata, definitions, mixture planning and storage are byte-for-byte protected',()=>{
 for(const [file,expected] of Object.entries(protection.hashes)){if(file==='drawFunctions'){const source=fs.readFileSync(new URL('../js/core.js',import.meta.url),'utf8');assert.equal(hash(source.slice(source.indexOf('export function weightedPick'),source.indexOf('export function editField'))),expected);}else assert.equal(hash(fs.readFileSync(new URL('../'+file,import.meta.url))),expected,file);}
});
test('core projection is strict by generated source, exact current text, registered ID and supported field',()=>{
 for(const row of input){const item=itemFor(row.id),before=clone(item);assert.equal(coreFor(item),row.core);assert.equal(coreForField(item,row.field),row.core);for(const source of ['custom','legacy','unknown',undefined])assert.equal(coreFor({...item,source}),null);assert.equal(coreFor({...item,text:item.text+'旧'}),null);assert.equal(coreFor({...item,candidateId:'missing'}),null);assert.equal(coreFor(item,{}),null);assert.equal(coreFor(item,{[row.id]:item.text}),row.core);assert.equal(coreForField(item,'world'),null);assert.deepEqual(item,before);}
 assert.equal(coreFor(null),null);assert.equal(coreFor({source:'generated',candidateId:'constructor',text:'constructor'}),null);
});
test('current and pre-core draws match all fields/recent/notices/RNG in single and mixed modes even across refreshes',()=>{
 for(const settings of [...STAGES.map(([stage])=>({stage})),...STAGE_PAIRS.map(([key])=>settingsForPair(key))])for(const tone of [1,3,5])for(const coherence of ['mix','cohesive']){
  const a=emptyState(),b=emptyState();for(const state of [a,b])Object.assign(state.settings,{...settings,tone,coherence});const ar={},br={};let callsA=0,callsB=0;const ra=rngFor(20261007),rb=rngFor(20261007),rngA=()=>{callsA++;return ra();},rngB=()=>{callsB++;return rb();};
  for(let n=0;n<3;n++){assert.deepEqual(rollFields(a,undefined,{data:EXTRA_DATA,recent:ar,rng:rngA}),oldRoll(b,undefined,{data:EXTRA_DATA,recent:br,rng:rngB}));refreshTexts(a,{rng:rngA});oldRefresh(b,{rng:rngB});assert.deepEqual(a.items,b.items);assert.deepEqual(a.settings,b.settings);assert.deepEqual(a.locks,b.locks);assert.deepEqual(ar,br);assert.equal(callsA,callsB);assert.deepEqual(a.texts.titles,b.texts.titles);}
 }
});
test('all seven purpose builders use core plus examples without changing textOf, items, titles or historical saved prose',()=>{
 const s=withCore(),before=clone(s.items),replaceCores=text=>['conflict','gimmick','twist'].reduce((out,key)=>out.replaceAll(s.items[key].text,seedOf(s,key)),text);
 for(const purpose of PURPOSES){s.settings.purpose=purpose;assert.equal(textOf(s,'conflict'),s.items.conflict.text);assert.equal(seedOf(s,'conflict'),CORE_BY_ID[s.items.conflict.candidateId]);const memo=buildMemo(s);for(const key of ['conflict','gimmick','twist']){assert.ok(memo.includes(CORE_BY_ID[s.items[key].candidateId]));assert.ok(memo.includes(`具体例：${s.items[key].text}`));}assert.deepEqual(buildOutline(s),oldOutline(s).map(replaceCores));assert.equal(buildSummary(s),replaceCores(oldSummary(s)));assert.equal(buildHint(s,rngFor(2)),replaceCores(oldHint(s,rngFor(2))));refreshTexts(s,{rng:rngFor(2)});assert.deepEqual(s.items,before);}
 const raw=emptyState();rollFields(raw,undefined,{rng:rngFor(11)});for(const key of ['conflict','gimmick','twist'])if(raw.items[key])raw.items[key].source='custom';for(const purpose of PURPOSES){raw.settings.purpose=purpose;assert.equal(buildSummary(raw),oldSummary(raw));assert.equal(buildMemo(raw),oldMemo(raw));assert.deepEqual(buildOutline(raw),oldOutline(raw));assert.equal(buildHint(raw,rngFor(2)),oldHint(raw,rngFor(2)));}
});
test('Markdown renders two-line materials from fresh and historical memos without rewriting stored text or duplicating examples',()=>{
 const s=withCore();oldRefresh(s,{rng:rngFor(1)});const before=clone(s);for(const key of ['conflict','gimmick','twist'])assert.ok(markdown(s).includes(materialLines(s,key,{conflict:'葛藤',gimmick:'ギミック',twist:'ひねり'}[key]).join('\n')));assert.deepEqual(s,before);
 s.texts.memo='作者が保存した昔の構成メモ';const stored=clone(s.texts);const md=markdown(s);assert.ok(md.includes('作者が保存した昔の構成メモ'));assert.deepEqual(s.texts,stored);for(const key of ['conflict','gimmick','twist'])assert.ok(md.includes(s.items[key].text));
 s.texts.memo=buildMemo(s);assert.equal(memoForMarkdown(s),s.texts.memo);s.texts.memo=`葛藤：${seedOf(s,'conflict')}`;assert.ok(memoForMarkdown(s).includes(`具体例：${s.items.conflict.text}`));
});
test('four AI purposes and both lengths distinguish core/example, preserve fixed/custom and retain no-core material format',()=>{
 const s=withCore();for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){const before=clone(s),text=buildAIHandoff(s,{purpose,length});assert.ok(text.includes(CORE_EXAMPLE_NOTE));for(const key of ['conflict','gimmick','twist']){assert.ok(text.includes(seedOf(s,key)));assert.ok(text.includes(s.items[key].text));}assert.match(text,/具体例（一例。差し替えてOK）/);assert.doesNotMatch(text,/sf-scifi-|mp-workplace-pro-|undefined|null/);assert.deepEqual(s,before);}
 s.locks.conflict=true;const fixed=buildAIHandoff(s);assert.ok(fixed.includes('具体例（固定した本文・変更は作者に確認）'));assert.ok(fixed.includes('固定した素材と手入力の本文は保持したい設定'));editField(s,'gimmick','作者の仕組み','仕組み');assert.equal(coreFor(s.items.gimmick),null);assert.ok(buildAIHandoff(s).includes('│ 作者の仕組み'));
 const noCore=emptyState();rollFields(noCore,undefined,{rng:rngFor(1)});for(const key of ['conflict','gimmick','twist'])noCore.items[key].text='保存済みの別本文：'+key;
 for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail'])assert.equal(buildAIHandoff(noCore,{purpose,length}).replace(CORE_EXAMPLE_NOTE+'\n',''),oldHandoff(noCore,{purpose,length}));
});
test('old v3 JSON, save/overwrite/separate/duplicate/favorite/reload and history preserve original fields and generated prose; no core is stored',()=>{
 const s=withCore();oldRefresh(s,{rng:rngFor(1)});s.characters.protagonist.name='楓';s.questions.world=[{id:'q1',text:'何を残す？',answer:'まだ迷う',locked:true}];s.metadata={name:'旧作品',tags:['核の確認'],notes:'作者の自由メモ'};s.locks.twist=true;
 const before=clone(s),inputJSON=exportJSON(s),loaded=inspectImport(inputJSON)[0].state;assert.deepEqual(loaded,s);assert.deepEqual(validateState(s),s);assert.deepEqual(s,before);
 const map=new Map(),storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)},repo=new Repository(storage);repo.load();let current=repo.save(loaded);repo.favorite(current.loadedWorkId,current);current=repo.save(current,{overwrite:true});const separate=repo.save(current),duplicate=repo.duplicate(current.loadedWorkId,current);assert.deepEqual(duplicate.items,s.items);assert.deepEqual(duplicate.texts,s.texts);assert.equal(repo.works.length,3);assert.deepEqual(repo.works[0].state.texts,s.texts);assert.notEqual(separate.loadedWorkId,current.loadedWorkId);const reloaded=new Repository(storage);assert.deepEqual(reloaded.load().current,duplicate);assert.ok(map.get(STORAGE_KEY));
 const stripIdentity=state=>{const copy=clone(state);copy.loadedWorkId=null;copy.metadata.name='旧作品';return copy;};assert.deepEqual(stripIdentity(inspectImport(exportJSON(current))[0].state),s);
 const inspect=value=>{if(value&&typeof value==='object'){assert.equal(Object.hasOwn(value,'core'),false);for(const child of Object.values(value))inspect(child);}};inspect(JSON.parse(map.get(STORAGE_KEY)));assert.equal(JSON.parse(map.get(STORAGE_KEY)).schemaVersion,3);
 const history=new History(s),draft=clone(s);editField(draft,'twist','作者が書き直したひねり','ひねり');history.record(draft);assert.equal(coreFor(history.redo()?.items.twist),null);const undone=history.undo();assert.equal(coreFor(undone.items.twist),CORE_BY_ID[s.items.twist.candidateId]);assert.equal(coreFor(history.redo().items.twist),null);
});
