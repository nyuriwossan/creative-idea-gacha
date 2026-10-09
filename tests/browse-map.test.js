import test from 'node:test';
import assert from 'node:assert/strict';
import {BROWSE_TAXONOMY_BASIC} from '../js/browse-taxonomy.js';
import {BROWSE_MAP_BASIC} from '../js/browse-map-basic.js';
import {DATA,BASIC} from '../js/data.js';
import {STAGE_MIX_BASIC} from '../js/stage-mix-data.js';
import {STAGE_PAIRS} from '../js/stage-selection.js';

const KEYS=BASIC.map(([key])=>key);
const rowsOf=key=>[...DATA[key],...(STAGE_MIX_BASIC[key]||[])];
const validPaths=key=>new Set(BROWSE_TAXONOMY_BASIC[key].flatMap(major=>major.minors.map(minor=>`${major.id}.${minor.id}`)));
const pathsOf=(key,id)=>(BROWSE_MAP_BASIC[key][id]||'').split('|').filter(Boolean);

test('taxonomy covers the seven basic fields with unique ids and Japanese labels',()=>{
 assert.deepEqual(Object.keys(BROWSE_TAXONOMY_BASIC),KEYS);
 for(const key of KEYS){
  const majors=BROWSE_TAXONOMY_BASIC[key];
  assert.equal(new Set(majors.map(m=>m.id)).size,majors.length,key);
  for(const major of majors){
   assert.ok(major.label&&!/[a-z]/i.test(major.label.replace(/SF|AI/g,'')),`${key}.${major.id}`);
   assert.ok(major.minors.length>=2,`${key}.${major.id} needs at least two minors`);
   assert.equal(new Set(major.minors.map(m=>m.id)).size,major.minors.length);
  }
 }
});

test('every registered material, including stage-mix rows, has at least one valid path',()=>{
 for(const key of KEYS){
  const valid=validPaths(key),missing=[],invalid=[];
  for(const row of rowsOf(key)){
   const paths=pathsOf(key,row.id);
   if(!paths.length)missing.push(row.id);
   for(const path of paths)if(!valid.has(path))invalid.push(`${row.id}:${path}`);
   assert.equal(new Set(paths).size,paths.length,`${row.id} repeats a path`);
  }
  assert.deepEqual(missing,[],`${key}: unclassified materials`);
  assert.deepEqual(invalid,[],`${key}: unknown paths`);
 }
});

test('the map has no orphan ids and does not inflate the material count',()=>{
 for(const key of KEYS){
  const ids=new Set(rowsOf(key).map(row=>row.id));
  const orphans=Object.keys(BROWSE_MAP_BASIC[key]).filter(id=>!ids.has(id));
  assert.deepEqual(orphans,[],`${key}: ids missing from data`);
  assert.equal(Object.keys(BROWSE_MAP_BASIC[key]).length,ids.size,key);
  assert.equal(ids.size,rowsOf(key).length,`${key}: duplicate ids in data`);
 }
});

test('world stage-mix rows sit under 複合舞台 with their own pair, and only there',()=>{
 const pairs=new Set(STAGE_PAIRS.map(([id])=>id));
 const mix=BROWSE_TAXONOMY_BASIC.world.find(m=>m.id==='mix');
 assert.deepEqual(mix.minors.map(m=>m.id).sort(),[...pairs].sort());
 for(const row of STAGE_MIX_BASIC.world)assert.deepEqual(pathsOf('world',row.id),row.blendPairs.map(pair=>`mix.${pair}`));
 for(const row of DATA.world)assert.ok(pathsOf('world',row.id).every(p=>!p.startsWith('mix.')),row.id);
});

test('every major branch has materials, and each material uses at most three paths',()=>{
 for(const key of KEYS){
  for(const major of BROWSE_TAXONOMY_BASIC[key]){
   const count=rowsOf(key).filter(row=>pathsOf(key,row.id).some(p=>p.startsWith(major.id+'.'))).length;
   assert.ok(count>0,`${key}.${major.id} is empty`);
  }
  for(const row of rowsOf(key))assert.ok(pathsOf(key,row.id).length<=3,row.id);
 }
});
