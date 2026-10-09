import test from 'node:test';
import assert from 'node:assert/strict';
import {BROWSE_TAXONOMY_EXTRA} from '../js/browse-taxonomy-extra.js';
import {BROWSE_MAP_EXTRA} from '../js/browse-map-extra.js';
import {BROWSE_TAXONOMY_BASIC} from '../js/browse-taxonomy.js';
import {BROWSE_MAP_BASIC} from '../js/browse-map-basic.js';
import {browseTable,browseGroup,catalog,filterRows,pathsOf} from '../js/browse.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {OPTIONAL,FIELDS,emptyState} from '../js/core.js';

const tables={basicTaxonomy:BROWSE_TAXONOMY_BASIC,basicMap:BROWSE_MAP_BASIC,extraTaxonomy:BROWSE_TAXONOMY_EXTRA,extraMap:BROWSE_MAP_EXTRA};
const OPTIONAL_KEYS=OPTIONAL.map(([key])=>key);

test('all 21 fields have a taxonomy and every registered material a valid path',()=>{
 assert.equal(FIELDS.length,21);
 for(const [key] of FIELDS){
  const {taxonomy,map}=browseTable(key,tables);
  assert.ok(taxonomy.length>=2,`${key}: no taxonomy`);
  const valid=new Set(taxonomy.flatMap(m=>m.minors.map(n=>`${m.id}.${n.id}`)));
  const rows=catalog(key,emptyState().settings);
  assert.ok(rows.length>0);
  for(const row of rows){const paths=pathsOf(map,row.id);assert.ok(paths.length,`${key}: ${row.text} is unclassified`);for(const p of paths)assert.ok(valid.has(p),`${key}: ${p}`);}
 }
});

test('protagonist and counterpart share one table for role, goal and secret without duplication',()=>{
 for(const group of ['role','goal','secret']){
  const p=EXTRA_DATA[`protagonist.${group}`],c=EXTRA_DATA[`counterpart.${group}`];
  assert.deepEqual(p.map(r=>r.text),c.map(r=>r.text),`${group}: content differs`);
  assert.equal(Object.keys(BROWSE_MAP_EXTRA[group]).length,p.length);
  const a=browseTable(`protagonist.${group}`,tables),b=browseTable(`counterpart.${group}`,tables);
  assert.equal(a.taxonomy,b.taxonomy);
  p.forEach((row,i)=>assert.equal(pathsOf(a.map,row.id).join(),pathsOf(b.map,c[i].id).join()));
  assert.equal(browseGroup(`counterpart.${group}`),group);
 }
 assert.equal(Object.keys(BROWSE_MAP_EXTRA).some(k=>/protagonist|counterpart/.test(k)),false);
});

test('no orphan ids, no inflated counts, and the 14 optional fields are all covered',()=>{
 const groups=new Set(OPTIONAL_KEYS.map(browseGroup));
 assert.deepEqual([...groups].sort(),Object.keys(BROWSE_MAP_EXTRA).sort());
 assert.equal(OPTIONAL_KEYS.length,14);
 for(const group of groups){
  const key=OPTIONAL_KEYS.find(k=>browseGroup(k)===group),{map}=browseTable(key,tables),ids=new Set(EXTRA_DATA[key].map(r=>r.id));
  assert.deepEqual(Object.keys(map).filter(id=>!ids.has(id)),[],`${group}: orphans`);
  assert.equal(Object.keys(map).length,ids.size,group);
  for(const major of BROWSE_TAXONOMY_EXTRA[group]){
   const n=filterRows(EXTRA_DATA[key],{map,key,major:major.id}).length;
   assert.ok(n>0,`${group}.${major.id} is empty`);
   for(const minor of major.minors)assert.ok(filterRows(EXTRA_DATA[key],{map,key,major:major.id,minor:minor.id}).length>0,`${group}.${major.id}.${minor.id} is empty`);
  }
 }
});

test('meaningful branches: 期限なし, 弟子・見習い, 共同目標の「決める」',()=>{
 const deadline=browseTable('deadline',tables);
 assert.deepEqual(filterRows(EXTRA_DATA.deadline,{map:deadline.map,key:'deadline',major:'none'}).map(r=>r.text),['明確な期限なし']);
 const role=browseTable('counterpart.role',tables),apprentices=filterRows(EXTRA_DATA['counterpart.role'],{map:role.map,key:'counterpart.role',major:'learn',minor:'apprentice'});
 assert.ok(apprentices.length>=8);assert.ok(apprentices.every(r=>/弟子|見習い/.test(r.text)));
 const goal=browseTable('scene.goal',tables);assert.ok(filterRows(EXTRA_DATA['scene.goal'],{map:goal.map,key:'scene.goal',major:'talk',minor:'decide'}).every(r=>/決め/.test(r.text)));
});
