import test from 'node:test';
import {stripExpansion} from './stage-expansion-support.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ABSTRACT_BASIC,ABSTRACT_SCENE,parseAbstractBasic,parseAbstractScene} from '../js/abstract-seed-data.js';
import {DATA,BASIC,STAGES,THEMES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {knownLinks,knownTopics,cohesionMultiplier} from '../js/cohesion.js';
import {availablePool} from '../js/priority.js';
import {emptyState,rollFields,refreshTexts,markdown,clone} from '../js/core.js';
import {validateState,inspectImport,exportJSON} from '../js/storage.js';
import {buildAIHandoff} from '../js/ai-handoff.js';
const before=JSON.parse(fs.readFileSync(new URL('./fixtures/abstract-seed-baseline.json',import.meta.url)));
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const historicalExtra=Object.fromEntries(Object.entries(EXTRA_DATA).map(([key,rows])=>[key,rows.filter(r=>r.origin!=='abstract-seed')]));
const rows=[...Object.values(ABSTRACT_BASIC).flat(),...Object.values(ABSTRACT_SCENE).flat()];
const rngFor=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
test('abstract layer imports exactly the supplied 104 + 48 rows with unique IDs and empty stage/background/themes',()=>{
 assert.equal(Object.values(ABSTRACT_BASIC).flat().length,104);assert.equal(Object.values(ABSTRACT_SCENE).flat().length,48);
 const supplied=fs.readFileSync(new URL('../docs/round6-b/supplied-rows.txt',import.meta.url),'utf8').split('\n').filter(r=>r&& !r.startsWith('#'));
 assert.equal(supplied.length,152);const all=Object.values(EXTRA_DATA).flat();assert.equal(new Set(all.map(r=>r.id)).size,all.length);
 for(const line of supplied){const [key,slug,text,titleWord,tones]=line.split('|'),row=rows.find(r=>r.id===`ab-${key}-${slug}`);assert.ok(row);assert.equal(row.text,text);assert.equal(row.titleWord,titleWord);assert.deepEqual(row.tones,[...tones].map(Number));}
 for(const row of rows){for(const key of ['stageTags','contextTags','requiresContext','themeTags'])assert.deepEqual(row[key],[]);assert.equal(row.origin,'abstract-seed');assert.equal(row.source,'generated');assert.deepEqual(knownTopics(row),row.topicTags);assert.deepEqual(knownLinks(row),row.plotLinks);}
});
test('abstract dedicated parsers accept empty metadata and reject malformed columns/tones/shapes/duplicates',()=>{
 const valid='conflict|x|伝えたいが、伝えられない|伝える|123|memory||||ab-truth|';assert.equal(parseAbstractBasic(valid).conflict[0].stageTags.length,0);
 for(const text of [valid+'|',valid.replace('|123|','|0|'),valid.replace('|123|','|11|'),valid.replace('conflict|','unknown|'),valid+'pair',valid+'\n'+valid])assert.throws(()=>parseAbstractBasic(text));
 const scene='scene.goal|x|今日のうちに伝える|伝える|123|memory';assert.equal(parseAbstractScene(scene)['scene.goal'][0].plotLinks[0],'ab-scene-x');for(const text of [scene+'|',scene.replace('scene.goal','world'),scene.replace('|123|','|6|'),scene+'\n'+scene])assert.throws(()=>parseAbstractScene(text));
});
test('all eight conflict/twist and twelve scene links remain known and affect only cohesive mode',()=>{
 const links=new Set(rows.flatMap(r=>r.plotLinks));assert.equal(links.size,20);
 for(const key of ['truth','duty','promise','share','leave','record','trust','choice']){const link='ab-'+key,conflicts=ABSTRACT_BASIC.conflict.filter(r=>r.plotLinks.includes(link)),twists=ABSTRACT_BASIC.twist.filter(r=>r.plotLinks.includes(link));assert.equal(conflicts.length,4);assert.equal(twists.length,4);const s=emptyState();s.items.conflict=conflicts[0];for(const twist of twists){assert.equal(cohesionMultiplier(twist,s,'twist',[]),4);s.settings.coherence='mix';assert.equal(cohesionMultiplier(twist,s,'twist',[]),1);s.settings.coherence='cohesive';}}
 for(const row of ABSTRACT_SCENE['scene.opening']){const slug=row.plotLinks[0];assert.equal(Object.values(ABSTRACT_SCENE).flat().filter(r=>r.plotLinks.includes(slug)).length,4);}
});
test('every abstract row enters all supported stages at each declared tone regardless of world background',()=>{
 for(const [stage] of STAGES)for(let tone=1;tone<=5;tone++){const s=emptyState();Object.assign(s.settings,{stage,tone});for(const [key,pool] of Object.entries({...ABSTRACT_BASIC,...ABSTRACT_SCENE})){if(!pool.length)continue;for(const context of [[],['magic','company','artificial-intelligence'],['royal','education','medical']]){const actual=availablePool(s,key,EXTRA_DATA,context).pool;for(const row of pool)assert.equal(actual.some(r=>r.id===row.id),row.tones.includes(tone),`${stage}/${tone}/${row.id}`);}}}
});
test('all original definitions stay in order byte-for-byte; only basic and scene rows append, draw/storage/planner sources stay exact',()=>{
 for(const [key,pool] of Object.entries(before.DATA)){const rows=DATA[key].filter(r=>!['world-expand','aozora'].includes(r.origin));assert.equal(hash(rows.slice(0,pool.count)),pool.hash);assert.deepEqual(rows.slice(pool.count),ABSTRACT_BASIC[key]);}
 for(const [key,pool] of Object.entries(before.EXTRA_DATA)){const rows=EXTRA_DATA[key].filter(r=>!['world-expand','aozora'].includes(r.origin));assert.equal(hash(rows.slice(0,pool.count)),pool.hash);assert.deepEqual(rows.slice(pool.count),ABSTRACT_BASIC[key]||ABSTRACT_SCENE[key]||[]);}
 for(const [file,source] of Object.entries(before.files))assert.equal(hash(stripExpansion(file,fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'))),source,file);
 assert.equal(BASIC.flatMap(([key])=>DATA[key].filter(r=>!['world-expand','aozora'].includes(r.origin))).length,1561);assert.equal(THEMES.length,22);
});
test('all 152 abstract rows can be drawn, preserve full prose in outputs, and save/reload without core metadata',()=>{
 for(const [key,pool] of Object.entries({...ABSTRACT_BASIC,...ABSTRACT_SCENE}))for(const row of pool){const s=emptyState();s.settings.tone=row.tones[0];rollFields(s,[key],{data:{[key]:[row]},rng:rngFor(1)});assert.equal(s.items[key].candidateId,row.id);assert.equal(s.items[key].text,row.text);refreshTexts(s,{rng:rngFor(2)});assert.deepEqual(validateState(s),s);assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);assert.equal(Object.hasOwn(s.items[key],'core'),false);assert.ok(markdown(s).includes(row.text));for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail'])assert.ok(buildAIHandoff(s,{purpose,length}).includes(row.text));}
});
test('fixed custom/old materials, locks and original input survive abstract-layer draws',()=>{
 const s=emptyState();rollFields(s,undefined,{data:historicalExtra,rng:rngFor(11)});s.locks.conflict=true;s.locks.world=true;const old=clone(s.items);for(let n=0;n<12;n++){rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(n)});assert.deepEqual(s.items.conflict,old.conflict);assert.deepEqual(s.items.world,old.world);}const state=clone(s);validateState(s);assert.deepEqual(s,state);
});
