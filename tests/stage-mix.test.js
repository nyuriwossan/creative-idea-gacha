import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DATA,BASIC,STAGES,THEMES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {CONTEXTS,worldContext,meetsContext} from '../js/context.js';
import {knownLinks} from '../js/cohesion.js';
import {emptyState,updateSettings,rollFields,editField,refreshTexts,markdown,WEIGHTS,clone,weightFor,History} from '../js/core.js';
import {STAGE_PAIRS,normalizeStages,stageLabel,settingsForPair,stagePairKey} from '../js/stage-selection.js';
import {STAGE_MIX_BASIC,STAGE_MIX_ROWS,MIX_ANNOTATIONS,stageMixData} from '../js/stage-mix-data.js';
import {mixReport,isBridge,mixedPlan,worldWeights,worldGroup,mixBadge,rollMixedFields} from '../js/stage-mix.js';
import {availablePool,MAJOR_FIELDS,themeMask,bitCount} from '../js/priority.js';
import {Repository,STORAGE_KEY,V2_BACKUP_KEY,BACKUP_KEY,exportJSON,inspectImport,validateState,validateBundle} from '../js/storage.js';
import {validateState as oldValidate,Repository as OldRepository} from './fixtures/v2-storage-guard.mjs';
import {tryModernPreset} from '../js/presets.js';
import {buildAIHandoff} from '../js/ai-handoff.js';
const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/stage-mix-baseline.json',import.meta.url)));
const oldFixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/world-restructure-baseline.json',import.meta.url))).fixtures;
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const setting=(pair,tone=3,coherence='cohesive')=>{const state=emptyState();updateSettings(state,{...settingsForPair(pair),tone,coherence});return state;};
const memory=entries=>{const map=new Map(entries);return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};};
const asV2=state=>{const s=clone(state);s.schemaVersion=2;delete s.settings.stage2;for(const item of Object.values(s.items))if(item)delete item.blendPairs;return s;};
const snapshot=row=>{const {id,origin,key,...item}=clone(row);return {...item,candidateId:id};};
const fixtureRoll=(s,data,recent={},rng=rngFor(1))=>rollMixedFields(s,BASIC.map(([key])=>key),{data,recent,rng,weightFor});
function artifact(name,value){if(process.env.TEST_OUTPUT_DIR){fs.mkdirSync(process.env.TEST_OUTPUT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.TEST_OUTPUT_DIR,name),JSON.stringify(value,null,2)+'\n');}}
test('all single-stage candidate hashes, 200 seeded cases, RNG counts, notices and eight handoffs remain exact',()=>{
 assert.equal(hash(DATA),baseline.dataHash);assert.equal(hash(EXTRA_DATA),baseline.extraHash);assert.deepEqual(WEIGHTS,baseline.WEIGHTS);
 for(const expected of baseline.cases){const s=emptyState(),recent={};Object.assign(s.settings,{stage:expected.stage,tone:expected.tone,coherence:expected.coherence,themes:expected.themes});let calls=0;const seeded=rngFor(20261007),rng=()=>{calls++;return seeded();},results=[];
  for(let n=0;n<3;n++)results.push(rollFields(s,undefined,{data:EXTRA_DATA,recent,rng}));refreshTexts(s,{rng});
  assert.deepEqual(results,expected.results);assert.deepEqual(recent,expected.recent);assert.equal(calls,expected.calls);assert.equal(hash(asV2(s)),expected.stateHash);
  assert.equal(hash(markdown(s)),expected.markdownHash);for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail'])assert.equal(hash(buildAIHandoff(s,{purpose,length})),expected.handoffs[purpose+'-'+length]);
 }
});
test('three equal pairs normalize order, reject invalid combinations and generate identical seeded snapshots',()=>{
 for(const [pair,label] of STAGE_PAIRS){const [stage,stage2]=pair.split('+'),a=setting(pair),b=emptyState();updateSettings(b,{stage:stage2,stage2:stage});assert.deepEqual(a,b);assert.equal(stageLabel(a.settings),label);assert.equal(stagePairKey(a.settings),pair);
  const ar={},br={};for(let i=0;i<3;i++){assert.deepEqual(rollFields(a,undefined,{rng:rngFor(i),recent:ar,data:EXTRA_DATA}),rollFields(b,undefined,{rng:rngFor(i),recent:br,data:EXTRA_DATA}));assert.deepEqual(a,b);assert.deepEqual(ar,br);}assert.equal(JSON.stringify(a),JSON.stringify(b));
 }
 for(const pair of [['all','fantasy'],['school','school'],['unknown',null],['fantasy','unknown'],['school','modern'],['modern','']])assert.throws(()=>normalizeStages(...pair));
 assert.deepEqual(normalizeStages('all'),{stage:'all',stage2:null});
});
test('63 explicit definitions and three annotations stay isolated, unique, known and immutable',()=>{
 assert.equal(STAGE_MIX_ROWS.length,63);assert.equal(MIX_ANNOTATIONS.length,3);assert.deepEqual(STAGE_PAIRS.map(([p])=>STAGE_MIX_ROWS.filter(r=>r.blendPairs.includes(p)).length),[20,21,22]);
 const all=Object.values(EXTRA_DATA).flat(),oldTexts=new Set(all.map(r=>r.text)),ids=new Set(all.map(r=>r.id)),texts=new Set(),links=new Set();
 for(const row of STAGE_MIX_ROWS){assert.ok(!ids.has(row.id));assert.ok(!oldTexts.has(row.text));assert.ok(!texts.has(row.text));texts.add(row.text);ids.add(row.id);assert.match(row.id,/^sm-/);assert.equal(row.source,'generated');assert.equal(row.origin,'stage-mix');assert.ok(row.text.length<=500&&row.titleWord.length<=30);assert.deepEqual(row.stageTags,settingsForPair(row.blendPairs[0])?row.blendPairs[0].split('+'):[]);assert.ok(row.tones.length);for(const tag of [...row.contextTags,...row.requiresContext])assert.ok(CONTEXTS.some(([id])=>id===tag),tag);for(const tag of row.themeTags)assert.ok(THEMES.some(([id])=>id===tag));assert.deepEqual(knownLinks(row),row.plotLinks);row.plotLinks.forEach(t=>links.add(t));if(row.key==='world')assert.deepEqual(row.requiresContext,[]);else assert.deepEqual(row.contextTags,[]);}
 assert.equal(links.size,9);
 const before=hash(DATA);assert.equal(stageMixData(emptyState().settings,EXTRA_DATA),EXTRA_DATA);
 for(const [pair] of STAGE_PAIRS){const mixed=stageMixData(setting(pair).settings,EXTRA_DATA);assert.equal(Object.values(mixed).flat().filter(r=>r.origin==='stage-mix').length,STAGE_MIX_ROWS.filter(r=>r.blendPairs.includes(pair)).length);for(const row of Object.values(mixed).flat().filter(r=>r.origin==='stage-mix'))assert.deepEqual(row.blendPairs,[pair]);for(const annotation of MIX_ANNOTATIONS.filter(a=>a.pair===pair)){const old=DATA.world.find(r=>r.id===annotation.id),current=mixed.world.find(r=>r.id===annotation.id);assert.equal(current.text,old.text);assert.deepEqual(current.contextTags,old.contextTags);assert.notEqual(current,old);assert.deepEqual(current.blendPairs,[pair]);}}
 assert.equal(hash(DATA),before);
});
test('world group totals are 2:1:1:1 independently of candidate counts and non-world weights use selected pair',()=>{
 const s=setting('modern+underworld',3,'mix'),row=(id,tags,blendPairs=[])=>({id,source:'generated',stageTags:tags,blendPairs,themeTags:[],contextTags:[],requiresContext:[],topicTags:[],plotLinks:[],tones:[]});
 const rows=[row('bridge',['modern','underworld'],['modern+underworld']),row('both',['modern','underworld']),...Array.from({length:40},(_,i)=>row('a'+i,['modern'])),row('b',['underworld'])],weights=worldWeights(rows,s);
 assert.deepEqual([0,1,2,3].map(g=>rows.filter(r=>worldGroup(r,s.settings)===g).reduce((sum,r)=>sum+weights(r),0)).map(n=>Math.round(n*1000)/1000),[2,1,1,1]);
 editField(s,'world','自分の世界','',[]);assert.equal(weightFor(row('bridge',['modern'],['modern+underworld']),s,'incident',[],[]),6);assert.equal(weightFor(row('a',['underworld']),s,'incident',[],[]),4);assert.equal(weightFor(row('generic',[]),s,'incident',[],[]),2);assert.equal(weightFor(row('other',['school']),s,'incident',[],[]),.25);
 s.settings.coherence='cohesive';assert.equal(weightFor(row('bridge',['modern'],['modern+underworld']),s,'incident',[],[]),12);
 const withoutBridge=rows.slice(1),w=worldWeights(withoutBridge,s);assert.equal(withoutBridge.reduce((n,r)=>n+w(r),0).toFixed(4),'3.0000');
});
test('3 pairs × 5 tones × 2 modes × 200 draws obey context, exclusion, isolation and cohesive quotas',()=>{
 const table=[];
 for(const [pair] of STAGE_PAIRS)for(let tone=1;tone<=5;tone++)for(const coherence of ['cohesive','mix']){const s=setting(pair,tone,coherence),rng=rngFor(20261007),recent={};let goals=0,notices=0;
  for(let i=0;i<200;i++){const previous=clone(s.items),result=rollFields(s,undefined,{data:EXTRA_DATA,recent,rng}),report=mixReport(s);assert.equal(result.changed,7,`${pair}/${tone}/${i}`);for(const [key] of BASIC){const item=s.items[key];assert.ok(meetsContext(item,worldContext(s)),`${pair} ${key}`);assert.ok(!item.tones.length||item.tones.includes(tone));if(previous[key]){assert.notEqual(item.text,previous[key].text);assert.notEqual(item.candidateId,previous[key].candidateId);}if(item.candidateId.startsWith('sm-'))assert.deepEqual(item.blendPairs,[pair]);}
   if(report.counts.every(n=>n>=2)&&report.bridges>=2)goals++;else if(coherence==='cohesive')assert.ok(result.notices.some(n=>/目標/.test(n)));if(result.notices.length)notices++;
  }
  if(coherence==='cohesive'&&tone<=4)assert.equal(goals,200,`${pair}/${tone}`);table.push({pair,tone,coherence,draws:200,goals,notices});
 }artifact('mix-matrix.json',table);
});
test('joint planner satisfies three themes and bridge goals together and maximizes themes when infeasible',()=>{
 const s=setting('fantasy+school'),themes=['buddy','mystery','journey'];s.settings.themes=themes;
 const row=(id,theme,bridge=true)=>({id,text:id,titleWord:id,source:'generated',stageTags:['fantasy','school'],blendPairs:bridge?['fantasy+school']:[],themeTags:[theme],tones:[],contextTags:[],requiresContext:[],topicTags:[],plotLinks:[]});
 const data=Object.fromEntries(BASIC.map(([key],i)=>[key,[row(key+'1',themes[i%3]),row(key+'2',themes[i%3])]]));const result=fixtureRoll(s,data);assert.equal(result.changed,7);assert.equal(result.notices.length,0);assert.equal(bitCount(BASIC.reduce((m,[k])=>m|themeMask(s.items[k],themes),0)),3);assert.ok(mixReport(s).bridges>=2);
 const impossible=setting('fantasy+school');impossible.settings.themes=themes;const restricted=Object.fromEntries(Object.entries(data).map(([k,rows])=>[k,rows.map(r=>({...r,themeTags:r.themeTags[0]==='journey'?[]:r.themeTags,blendPairs:[],stageTags:['fantasy']}))]));const r=fixtureRoll(impossible,restricted);assert.equal(r.changed,7);assert.equal(bitCount(BASIC.reduce((m,[k])=>m|themeMask(impossible.items[k],themes),0)),2);assert.ok(r.notices.some(n=>n.includes('旅')));assert.ok(r.notices.some(n=>n.includes('橋渡し')));
 const many=setting('fantasy+school');many.settings.themes=themes;for(const [key] of BASIC)many.locks[key]=true;const plan=mixedPlan(many,[],{},[]);assert.equal(plan.complete,false);
 const outside=setting('fantasy+school');outside.settings.themes=themes;
 const gated=Object.fromEntries(Object.entries(data).map(([key,rows])=>[key,rows.map(r=>({...r,requiresContext:key==='world'?[]:['beastfolk']}))]));
 gated.world=[{...row('bridge-world','buddy'),contextTags:['magic']},{...row('side-world','journey',false),stageTags:['fantasy'],contextTags:['beastfolk']}];
 const outsideResult=fixtureRoll(outside,gated);assert.equal(outside.items.world.candidateId,'side-world');assert.equal(bitCount(BASIC.reduce((m,[k])=>m|themeMask(outside.items[k],themes),0)),3);assert.ok(mixReport(outside).bridges>=2);assert.deepEqual(outsideResult.unavailableThemes,[]);
});
test('all 63 new rows are reachable through the individual core entrance and optional groups share mixed weights/backgrounds',()=>{
 for(const row of STAGE_MIX_ROWS){
  const s=setting(row.blendPairs[0],row.tones[0]),data=stageMixData(s.settings,EXTRA_DATA);
  if(row.key!=='world'){editField(s,'world','作者が指定した背景','',row.requiresContext);s.items.world.topicTags=[];}
  const pool=availablePool(s,row.key,data,worldContext(s)).pool.filter(item=>row.key!=='world'||isBridge(item,s.settings)),weights=row.key==='world'?worldWeights(pool,s):item=>weightFor(item,s,row.key,[],[]),index=pool.findIndex(item=>item.id===row.id);assert.ok(index>=0,row.id);
  const before=pool.slice(0,index).reduce((n,item)=>n+weights(item),0),total=pool.reduce((n,item)=>n+weights(item),0),rng=()=>(before+weights(pool[index])/2)/total;
  rollFields(s,[row.key],{data:EXTRA_DATA,rng});assert.equal(s.items[row.key].candidateId,row.id);assert.equal(s.items[row.key].text,row.text);assert.deepEqual(validateState(s).items[row.key].blendPairs,row.blendPairs);
 }
 for(const [pair] of STAGE_PAIRS){const s=setting(pair);rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(2)});const before=clone(s.items);for(const keys of [['protagonist.role','protagonist.goal','protagonist.secret','counterpart.role','counterpart.goal','counterpart.secret'],['deadline','obstacle','cost','ending'],['scene.goal','scene.opening','scene.problem','scene.question']]){rollFields(s,keys,{data:EXTRA_DATA,rng:rngFor(3)});for(const key of keys)assert.ok(meetsContext(s.items[key],worldContext(s)));}for(const [key] of BASIC)assert.deepEqual(s.items[key],before[key]);}
});
test('mixed world shortages are atomic; fixed/custom backgrounds are retained and individual draws change only one field',()=>{
 const s=setting('fantasy+school'),recent={world:['previous']},before=clone(s),history=new History(s);const result=fixtureRoll(s,{...DATA,world:[]},recent);assert.equal(result.aborted,true);assert.deepEqual(s,before);assert.deepEqual(recent,{world:['previous']});assert.equal(history.record(s),false);
 rollFields(s,undefined,{recent});const drawn=clone(s);for(const [key] of BASIC)s.locks[key]=true;const fixed=clone(s),oldRecent=clone(recent);assert.equal(rollFields(s,undefined,{recent}).changed,0);assert.deepEqual(s,fixed);assert.deepEqual(recent,oldRecent);
 s.locks.gimmick=false;const old=clone(s);rollFields(s,['gimmick'],{recent});for(const [key] of BASIC)if(key!=='gimmick')assert.deepEqual(s.items[key],old.items[key]);
 editField(s,'world','魔法のない学園','',[]);s.items.relation=snapshot(STAGE_MIX_BASIC.relation.find(r=>r.requiresContext.includes('magic')));s.locks.relation=true;const relation=clone(s.items.relation);const r=rollFields(s,undefined,{recent});assert.deepEqual(s.items.relation,relation);assert.deepEqual(s.items.world.contextTags,[]);assert.equal(mixBadge(s.items.relation,s.settings,[]),'');assert.ok(r.notices.some(n=>n.includes('固定中の関係')));for(const [key] of BASIC)if(!s.locks[key])assert.ok(meetsContext(s.items[key],[]));assert.equal(mixReport(s).custom,true);
 const presetBefore=clone(s),presetRecent=clone(recent);assert.equal(tryModernPreset(s,recent,'police').ok,false);assert.deepEqual(s,presetBefore);assert.deepEqual(recent,presetRecent);
 const preset=tryModernPreset(drawn,{},'lovers',{rng:rngFor(2)});assert.equal(preset.ok,true);assert.equal(preset.state.settings.stage2,null);assert.ok(preset.notices.some(n=>n.includes('解除')));
 const light=setting('fantasy+underworld');light.settings.tone=1;rollFields(light);assert.equal(stagePairKey(light.settings),'fantasy+underworld');
});
test('v2 read keeps raw bytes; first v3 write backs up raw, all write paths keep snapshots and old app blocks v3',()=>{
 for(const fixture of oldFixtures){const old=fixture.input,work={id:'old',createdAt:'2020-01-01',updatedAt:'2020-01-02',fav:true,legacyDate:'昔',state:old},raw=JSON.stringify({schemaVersion:2,current:old,works:[work]}),store=memory([[STORAGE_KEY,raw],[BACKUP_KEY,'legacy-original']]),repo=new Repository(store),loaded=repo.load();assert.equal(repo.needsV3Write,true);assert.equal(store.getItem(STORAGE_KEY),raw);assert.equal(loaded.current.schemaVersion,3);assert.equal(loaded.current.settings.stage2,null);assert.deepEqual(asV2(loaded.current),fixture.expected);assert.deepEqual(repo.works[0],{...work,state:loaded.current});
  repo.write(loaded.current);assert.equal(store.getItem(V2_BACKUP_KEY),raw);assert.equal(store.getItem(BACKUP_KEY),'legacy-original');assert.equal(JSON.parse(store.getItem(STORAGE_KEY)).schemaVersion,3);assert.throws(()=>oldValidate(loaded.current));const oldRepo=new OldRepository(store);oldRepo.load();assert.equal(oldRepo.blocked,true);const stored=store.getItem(STORAGE_KEY);assert.throws(()=>oldRepo.write(null));assert.equal(store.getItem(STORAGE_KEY),stored);
 }
 const s=setting('modern+underworld');rollFields(s);refreshTexts(s);const store=memory(),repo=new Repository(store);repo.load();let current=repo.save(s);const before=clone(repo.works[0]);repo.favorite(current.loadedWorkId,current);current.metadata.notes='自由メモ';current=repo.save(current,{overwrite:true});const separate=repo.save(current),duplicated=repo.duplicate(current.loadedWorkId,current);assert.equal(repo.works.length,3);assert.equal(repo.works[0].createdAt,before.createdAt);assert.equal(repo.works[0].fav,true);assert.deepEqual(duplicated.items,current.items);assert.deepEqual(mixReport(duplicated),mixReport(current));const incoming=inspectImport(exportJSON(current,repo.works));repo.addImported(incoming,current);assert.equal(repo.works.length,6);const reloaded=new Repository(store);assert.deepEqual(reloaded.load().current,current);assert.equal(reloaded.works.length,6);assert.ok(separate.loadedWorkId!==current.loadedWorkId);
 const history=new History(current);updateSettings(current,{stage2:null});history.record(current);assert.equal(stagePairKey(history.undo().settings),'modern+underworld');assert.equal(history.redo().settings.stage2,null);
});
test('snapshot bridge metadata is never hydrated from ID; edits clear it and new IDs resolve required background',()=>{
 const old=emptyState(),definition=DATA.world.find(r=>r.id===MIX_ANNOTATIONS[0].id);old.items.world=snapshot(definition);delete old.items.world.blendPairs;const loaded=validateState(old);assert.deepEqual(loaded.items.world.blendPairs,[]);assert.deepEqual(loaded.items.world.stageTags,definition.stageTags);
 const mixed=setting('fantasy+school');rollFields(mixed);const copied=clone(mixed);editField(copied,'world','新しい本文','題',[]);assert.deepEqual(copied.items.world.blendPairs,[]);assert.equal(copied.items.world.source,'custom');
 const required=STAGE_MIX_BASIC.incident.find(r=>r.requiresContext.includes('magic'));mixed.items.incident=snapshot(required);delete mixed.items.incident.requiresContext;assert.deepEqual(validateState(mixed).items.incident.requiresContext,required.requiresContext);
});
test('invalid versions, mismatched containers and malformed pairs reject the whole import without partial additions',()=>{
 const s=setting('fantasy+school');rollFields(s);const good=JSON.parse(exportJSON(s)),work=good.works[0];
 for(const mutation of [r=>r.schemaVersion=4,r=>r.schemaVersion=2,r=>r.works[0].state.schemaVersion=2,r=>r.works[0].state.settings.stage2='all',r=>r.works[0].state.settings.stage2=r.works[0].state.settings.stage,r=>r.works[0].state.items.world.blendPairs=['fantasy+school','fantasy+school'],r=>r.works[0].state.items.world.blendPairs=['unknown'],r=>r.works[0].state.items.world.blendPairs='fantasy+school',r=>r.works[0].state.items.world.blendPairs=null]){const bad=clone(good);mutation(bad);assert.throws(()=>inspectImport(JSON.stringify(bad)));assert.throws(()=>validateBundle({schemaVersion:bad.schemaVersion,current:bad.works[0].state,works:bad.works}));}
 const v2=asV2(s);v2.settings.stage2='school';assert.throws(()=>validateState(v2));delete v2.settings.stage2;v2.items.world.blendPairs=['fantasy+school'];assert.throws(()=>validateState(v2));
 const bad=clone(good);bad.works.push({...work,id:'bad',state:{...s,schemaVersion:99}});assert.throws(()=>inspectImport(JSON.stringify(bad)));
});
test('backup, validation and capacity failures keep raw v2 and in-memory works; preexisting backup is preserved',()=>{
 const input=oldFixtures[0].input,raw=JSON.stringify({schemaVersion:2,current:input,works:[]});
 for(const failKey of [V2_BACKUP_KEY,STORAGE_KEY]){const store=memory([[STORAGE_KEY,raw]]),set=store.setItem;store.setItem=(key,value)=>{if(key===failKey)throw Error('quota');set(key,value);};const repo=new Repository(store),current=repo.load().current;assert.throws(()=>repo.save(current));assert.equal(repo.blocked,true);assert.equal(store.getItem(STORAGE_KEY),raw);assert.deepEqual(repo.works,[]);assert.equal(repo.rawBackup,raw);}
 const store=memory([[STORAGE_KEY,raw],[V2_BACKUP_KEY,raw]]),repo=new Repository(store);repo.write(repo.load().current);assert.equal(store.getItem(V2_BACKUP_KEY),raw);
 const modernStore=memory(),modernRepo=new Repository(modernStore);modernRepo.load();const current=modernRepo.save(emptyState()),works=clone(modernRepo.works),stored=modernStore.getItem(STORAGE_KEY);modernStore.setItem=()=>{throw Error('quota');};assert.throws(()=>modernRepo.favorite(current.loadedWorkId,current));assert.deepEqual(modernRepo.works,works);assert.equal(modernStore.getItem(STORAGE_KEY),stored);
});
test('mixed Markdown and all eight handoffs use actual reports, preserve text and expose no internal IDs',()=>{
 for(const [pair,label] of STAGE_PAIRS){const s=setting(pair);rollFields(s);refreshTexts(s);assert.ok(markdown(s).includes(`選択した舞台：${label}`));assert.ok(markdown(s).includes(mixReport(s).status));const loaded=inspectImport(exportJSON(s))[0].state;assert.deepEqual(mixReport(loaded),mixReport(s));
  for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){const text=buildAIHandoff(s,{purpose,length});assert.ok(text.includes(`希望する舞台の組み合わせ：${label}。`));assert.ok(text.includes(mixReport(s).status));assert.doesNotMatch(text,/sm-fantasy-|sm-modern-|schemaVersion|undefined|null|fantasy\+school|modern\+underworld|fantasy\+underworld/);for(const [key] of BASIC)assert.ok(text.includes(s.items[key].text));}
  for(const [key] of BASIC)s.items[key]=null;editField(s,'world','作者の舞台','',[]);assert.equal(mixReport(s).status,'片側の素材が少なめ');assert.match(buildAIHandoff(s),/手入力を含むため/);
 }
});
