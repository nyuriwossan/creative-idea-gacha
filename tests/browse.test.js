import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,fittingIds,filterRows,branchCounts,drawFrom,misfitReasons,rowTags,rowLabel,toStateItem,normalize,contextMismatches,pathsOf,PAGE_SIZE} from '../js/browse.js';
import {BROWSE_TAXONOMY_BASIC} from '../js/browse-taxonomy.js';
import {BROWSE_MAP_BASIC} from '../js/browse-map-basic.js';
import {emptyState,rollFields,updateSettings,clone} from '../js/core.js';
import {DATA,BASIC} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {STAGE_MIX_BASIC,stageMixData} from '../js/stage-mix-data.js';
import {availablePool} from '../js/priority.js';
import {worldContext} from '../js/context.js';
import {settingsForPair,STAGE_PAIRS} from '../js/stage-selection.js';

const KEYS=BASIC.map(([key])=>key);
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function drawn(seed=1,patch={}){const state=emptyState();updateSettings(state,patch);rollFields(state,undefined,{data:EXTRA_DATA,recent:{},rng:rngFor(seed)});return state;}

test('catalog lists every registered row once, in a stable data order',()=>{
 for(const key of KEYS)for(const settings of [emptyState().settings,{...emptyState().settings,...settingsForPair('fantasy+school')}]){
  const rows=catalog(key,settings);
  assert.equal(rows.length,DATA[key].length+(STAGE_MIX_BASIC[key]||[]).length,key);
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  assert.deepEqual(rows.map(r=>r.id),[...DATA[key],...(STAGE_MIX_BASIC[key]||[])].map(r=>r.id));
  assert.deepEqual(catalog(key,settings).map(r=>r.id),rows.map(r=>r.id),'order must not change between opens');
 }
});

test('fitting ids reuse the draw filter and keep the item in use',()=>{
 for(const [seed,patch] of [[1,{}],[4,{stage:'wafu',tone:2}],[9,settingsForPair('modern+underworld')]]){
  const state=drawn(seed,patch);
  for(const key of KEYS){
   const fit=fittingIds(state,key);
   const probe={...state,items:{...state.items,[key]:null}};
   const expected=availablePool(probe,key,stageMixData(state.settings,EXTRA_DATA),key==='world'?[]:worldContext(state)).pool.map(r=>r.id);
   assert.deepEqual([...fit].sort(),expected.sort(),key);
   if(state.items[key]?.source==='generated')assert.ok(fit.has(state.items[key].candidateId),`${key}: current item missing`);
  }
 }
});

test('adopting a row yields the same saved shape as a normal draw of that row',()=>{
 for(const [seed,patch] of [[2,{}],[3,settingsForPair('wafu+fantasy')]]){
  const state=drawn(seed,patch);
  for(const key of KEYS){
   const fit=fittingIds(state,key),rows=catalog(key,state.settings).filter(r=>fit.has(r.id));
   for(const row of rows.filter((_,i)=>i%7===0).slice(0,12)){
    const trial=clone(state);trial.locks[key]=false;trial.items[key]=null;
    rollFields(trial,[key],{data:{...EXTRA_DATA,[key]:[row]},rng:()=>0});
    if(trial.items[key]?.candidateId!==row.id)continue; // 組み合わせ抽選で行が弾かれる場合は比較しない
    assert.deepEqual(toStateItem(row),trial.items[key],`${key}:${row.id}`);
   }
  }
 }
 const mix=STAGE_MIX_BASIC.relation[0],item=toStateItem(mix);
 assert.equal(item.candidateId,mix.id);assert.deepEqual(item.blendPairs,mix.blendPairs);assert.equal(item.source,'generated');
 for(const name of ['id','origin','key','primaryPack','storyGroup','round4Group','primaryStage','stageFillBatch','modernProCategory','modernProBatch'])assert.equal(Object.hasOwn(item,name),false,name);
});

test('world: 現代 → 学校・教育現場 leads to school materials, and changing the major resets the branch',()=>{
 const state=drawn(5),rows=catalog('world',state.settings),map=BROWSE_MAP_BASIC.world,fit=fittingIds(state,'world');
 const school=filterRows(rows,{map,key:'world',major:'modern',minor:'school',fit});
 assert.ok(school.length>=10);assert.ok(school.some(r=>r.text==='学校'));
 assert.ok(school.every(r=>pathsOf(map,r.id).includes('modern.school')));
 const modern=filterRows(rows,{map,key:'world',major:'modern',fit});
 assert.ok(modern.length>school.length);assert.ok(school.every(r=>modern.includes(r)));
});

test('relation can be browsed by meaning (仕事・師弟 → 師匠と弟子)',()=>{
 const state=drawn(6),rows=catalog('relation',state.settings),map=BROWSE_MAP_BASIC.relation;
 const list=filterRows(rows,{map,key:'relation',major:'work',minor:'master'});
 assert.ok(list.length>=10);assert.ok(list.every(r=>/師|弟子|見習い|新人|新米|教育実習/.test(r.text)),list.map(r=>r.text).join(','));
});

test('counts are unique materials per branch; search narrows without changing branch counts',()=>{
 const state=drawn(7);
 for(const key of KEYS){
  const rows=catalog(key,state.settings),map=BROWSE_MAP_BASIC[key],taxonomy=BROWSE_TAXONOMY_BASIC[key];
  for(const fit of [null,fittingIds(state,key)]){
   const counts=branchCounts(rows,{map,taxonomy,fit});
   assert.equal(counts.majors.all,fit?fit.size:rows.length);
   for(const major of taxonomy){
    const list=filterRows(rows,{map,key,major:major.id,fit});
    assert.equal(counts.majors[major.id],list.length);assert.equal(new Set(list.map(r=>r.id)).size,list.length);
    assert.ok(counts.majors[major.id]<=counts.majors.all);
    for(const minor of major.minors)assert.ok(counts.minors[`${major.id}.${minor.id}`]<=counts.majors[major.id]);
   }
  }
 }
 const rows=catalog('world',state.settings),map=BROWSE_MAP_BASIC.world;
 assert.deepEqual(filterRows(rows,{map,key:'world',query:' 学校 '}).map(r=>r.id),filterRows(rows,{map,key:'world',query:'学校'}).map(r=>r.id));
 assert.ok(filterRows(rows,{map,key:'world',query:'ＳＦ'}).length===filterRows(rows,{map,key:'world',query:'sf'}).length);
});

test('normalize folds width, case, katakana and spaces',()=>{
 assert.equal(normalize(' ＡＢｃ　ﾃｶﾞﾐ '),normalize('abcてがみ'));
 assert.equal(normalize('テガミ'),normalize('てがみ'));
 assert.equal(normalize(''),'');
});

test('in-sheet gacha prefers another candidate and reports a single candidate',()=>{
 const rows=[{id:'a'},{id:'b'},{id:'c'}];
 for(let i=0;i<30;i++)assert.notEqual(drawFrom(rows,'b',rngFor(i)).row.id,'b');
 assert.deepEqual(drawFrom([{id:'a'}],'a'),{row:{id:'a'},single:true});
 assert.deepEqual(drawFrom([],null),{row:null,single:false});
 const pool=catalog('genre',emptyState().settings).slice(0,5),seen=new Set();
 for(let i=0;i<40;i++)seen.add(drawFrom(pool,null,rngFor(i)).row.id);
 for(const id of seen)assert.ok(pool.some(r=>r.id===id),'drew outside the candidate list');
});

test('misfit reasons name tone, stage, background and stage-mix pair in plain Japanese',()=>{
 const state=drawn(8,{stage:'wafu',tone:1});
 const fit=fittingIds(state,'world');
 for(const row of catalog('world',state.settings)){
  const reasons=misfitReasons(state,'world',row);
  if(fit.has(row.id))assert.deepEqual(reasons,[],row.text);else assert.ok(reasons.length,`${row.text} lacks a reason`);
  for(const reason of reasons)assert.doesNotMatch(reason,/[a-z]{3,}/,'internal id leaked');
 }
 const tone=catalog('world',state.settings).find(r=>r.tones.length&&!r.tones.includes(1));
 assert.match(misfitReasons(state,'world',tone).join(),/トーンが異なる/);
 const mix=STAGE_MIX_BASIC.world[0];assert.match(misfitReasons(state,'world',mix).join(),/複合舞台用（/);
 const modern=DATA.world.find(r=>r.stageTags.join()==='modern');assert.match(misfitReasons(state,'world',modern).join(),/舞台が異なる（現代）/);
 const needs=DATA.relation.find(r=>r.requiresContext?.includes('magic'));
 const plain={...state,items:{...state.items,world:{...state.items.world,contextTags:[]}}};
 assert.match(misfitReasons(plain,'relation',needs).join(),/必要な背景：魔法/);
 const paired=drawn(10,settingsForPair(mix.blendPairs[0]));
 assert.ok(!misfitReasons(paired,'world',mix).some(r=>r.startsWith('複合舞台用')));
});

test('tags show stage, theme, background and stage-mix pair without internal ids',()=>{
 for(const key of KEYS)for(const row of catalog(key,emptyState().settings).filter((_,i)=>i%25===0)){
  const tags=rowTags(row,key);
  for(const tag of tags)assert.doesNotMatch(tag.text,/[a-z]+-[a-z]+|[a-z]{4,}/,`${key}:${tag.text}`);
  assert.equal(typeof rowLabel(row,key),'string');
 }
 const mix=STAGE_MIX_BASIC.gimmick[0];assert.ok(rowTags(mix,'gimmick').some(t=>t.kind==='mix'&&t.text.startsWith('複合舞台用：')));
});

test('world change reports other items whose required background is missing, without changing them',()=>{
 const state=drawn(11),needs=DATA.relation.find(r=>r.requiresContext?.includes('magic'));
 state.items.relation=toStateItem(needs);const before=clone(state);
 const plain={...toStateItem(DATA.world.find(r=>!r.contextTags.length)),contextTags:[]};
 const list=contextMismatches(state,plain);
 assert.ok(list.some(m=>m.key==='relation'&&m.missing.includes('魔法')));
 assert.deepEqual(state,before);
 assert.deepEqual(contextMismatches(state,{...plain,contextTags:[...needs.requiresContext]}).filter(m=>m.key==='relation'),[]);
});

test('browse helpers never change state or data',()=>{
 const state=drawn(12,settingsForPair(STAGE_PAIRS[2][0])),before=clone(state),data=JSON.stringify(EXTRA_DATA.world.slice(0,5));
 for(const key of KEYS){const rows=catalog(key,state.settings),fit=fittingIds(state,key);filterRows(rows,{map:BROWSE_MAP_BASIC[key],key,major:'all',query:'の',fit});for(const row of rows.slice(0,30))misfitReasons(state,key,row);}
 assert.deepEqual(state,before);assert.equal(JSON.stringify(EXTRA_DATA.world.slice(0,5)),data);
 assert.equal(PAGE_SIZE,20);
});
