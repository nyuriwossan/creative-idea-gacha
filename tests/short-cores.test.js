import test from 'node:test';
import assert from 'node:assert/strict';
import {SHORT_CORES,SHORT_CORE_BY_ID} from '../js/short-core-data.js';
import {CORE_BY_ID as ROUND9} from '../js/core-data.js';
import {coreForField,seedOf,materialLines,CORE_FIELDS} from '../js/seed-core.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {BASIC} from '../js/data.js';
import {emptyState,clone,refreshTexts} from '../js/core.js';
import {buildAIHandoff} from '../js/ai-handoff.js';

const len=s=>Array.from(s).length;
// 目安：基本は15字前後（上限15）、葛藤・ひねりは18字まで。
const LIMIT={world:15,genre:15,relation:15,incident:15,gimmick:15,conflict:18,twist:18};
const itemFor=(key,id)=>{const row=EXTRA_DATA[key].find(r=>r.id===id),{id:candidateId,origin,primaryPack,storyGroup,round4Group,primaryStage,stageFillBatch,modernProCategory,modernProBatch,...fields}=clone(row);return {...fields,candidateId,blendPairs:[]};};

test('short cores are registered only for real items of their own field and differ from the prose',()=>{
 for(const [field,rows] of Object.entries(SHORT_CORES)){
  assert.ok(Object.hasOwn(LIMIT,field),field);
  for(const [id,core] of Object.entries(rows)){
   const row=EXTRA_DATA[field].find(r=>r.id===id);assert.ok(row,`${field}: unknown id ${id}`);
   assert.ok(core.trim()&&core===core.trim(),id);assert.notEqual(core,row.text,id);
   assert.ok(len(core)<=LIMIT[field],`${id}: ${core} (${len(core)})`);
  }
 }
});

test('every item of a finished field shows at most the target length, and no two items in a field look the same',()=>{
 for(const field of Object.keys(SHORT_CORES)){
  const shown=EXTRA_DATA[field].map(row=>SHORT_CORE_BY_ID[row.id]||ROUND9[row.id]||row.text);
  const over=EXTRA_DATA[field].filter((row,i)=>len(shown[i])>LIMIT[field]).map(row=>row.id);
  assert.deepEqual(over,[],`${field} still has long items`);
  const seen=new Map();for(const s of shown)seen.set(s,(seen.get(s)||0)+1);
  assert.deepEqual([...seen].filter(([,n])=>n>1).map(([s])=>s),[],`${field} has duplicate labels`);
 }
});

test('cards, summary and AI handoff use the short core and keep the original prose as the example',()=>{
 assert.deepEqual(CORE_FIELDS,BASIC.map(([key])=>key));
 const s=emptyState();
 for(const field of Object.keys(SHORT_CORES)){const [id,core]=Object.entries(SHORT_CORES[field])[0];s.items[field]=itemFor(field,id);
  assert.equal(coreForField(s.items[field],field),core);assert.equal(seedOf(s,field),core);
  const label=BASIC.find(([k])=>k===field)[1];assert.deepEqual(materialLines(s,field,label),[`${label}：${core}`,`具体例：${s.items[field].text}`]);
 }
 const before=clone(s.items);refreshTexts(s);assert.deepEqual(s.items,before,'items are never rewritten');
 const handoff=buildAIHandoff(s);
 for(const field of Object.keys(SHORT_CORES)){assert.ok(handoff.includes(SHORT_CORES[field][s.items[field].candidateId]));assert.ok(handoff.includes(s.items[field].text));}
});

test('custom or edited text never shows a core',()=>{
 const [field]=Object.keys(SHORT_CORES),[id]=Object.keys(SHORT_CORES[field]);
 const custom={...itemFor(field,id),source:'custom'};assert.equal(coreForField(custom,field),null);
 const edited={...itemFor(field,id),text:'作者が書き換えた本文'};assert.equal(coreForField(edited,field),null);
 assert.equal(coreForField(itemFor(field,id),'genre'),null,'a core belongs to its own field only');
});
