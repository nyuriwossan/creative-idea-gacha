import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUND4_BASIC,ROUND4_THEMES} from '../js/round4-data.js';
import {ROUND4_CHARACTERS,ROUND4_PROGRESSION,ROUND4_QUESTIONS} from '../js/round4-extra.js';
import {SCENE_DATA} from '../js/scene-data.js';
import {DATA,BASIC,THEMES,STAGES} from '../js/data.js';
import {EXTRA_DATA,QUESTION_DATA} from '../js/extra-data.js';
import {CONTEXTS,meetsContext,worldContext} from '../js/context.js';
import {TOPICS} from '../js/story-metadata.js';
import {knownLinks,cohesionMultiplier} from '../js/cohesion.js';
import {emptyState,rollFields,clone,SCENE,editField,refreshTexts} from '../js/core.js';
import {exportJSON,inspectImport,validateState} from '../js/storage.js';
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('C new definitions meet category, theme, tone, non-romance and pair minimums',()=>{
 assert.equal(Object.values(ROUND4_BASIC).flat().length,144);assert.equal(THEMES.length,20);assert.ok(Object.values(DATA).flat().length>=1277);
 for(const [theme] of ROUND4_THEMES){for(const [key,count] of Object.entries({world:4,genre:1,relation:5,incident:4,conflict:4,gimmick:3,twist:3}))assert.equal(ROUND4_BASIC[key].filter(r=>r.round4Group===theme).length,count);const rows=Object.values(ROUND4_BASIC).flat().filter(r=>r.round4Group===theme);assert.ok(rows.filter(r=>r.tones.some(t=>t<=2)).length>=8);assert.ok(rows.filter(r=>r.tones.includes(4)).length>=8);}
 for(const group of ['cross-beastfolk','cross-desert','cross-scifi','cross-journey'])for(const key of ['world','relation','incident','conflict','gimmick','twist'])assert.equal(ROUND4_BASIC[key].filter(r=>r.round4Group===group).length,2);
 assert.deepEqual(Object.fromEntries(Object.entries(ROUND4_CHARACTERS).map(([k,v])=>[k,v.length])),{role:12,goal:8,secret:8});assert.deepEqual(Object.fromEntries(Object.entries(ROUND4_PROGRESSION).map(([k,v])=>[k,v.length])),{deadline:8,obstacle:8,cost:6,ending:6});for(const rows of Object.values(ROUND4_QUESTIONS))assert.equal(rows.length,3);
 assert.ok(ROUND4_BASIC.conflict.filter(c=>c.plotLinks.some(link=>ROUND4_BASIC.twist.some(t=>t.plotLinks.includes(link)))).length>=12);assert.ok(ROUND4_BASIC.relation.filter(r=>!r.themeTags.includes('romance')).length>=ROUND4_BASIC.relation.length/2);assert.ok(ROUND4_BASIC.relation.filter(r=>r.relationShape==='group').length>=4);
});
test('C every new row has known metadata, valid shape, unique ID/text and reachable background',()=>{
 const all=[...Object.values(ROUND4_BASIC).flat(),...Object.values(ROUND4_CHARACTERS).flat(),...Object.values(ROUND4_PROGRESSION).flat(),...Object.values(SCENE_DATA).flat()];assert.equal(new Set(all.map(r=>r.id)).size,all.length);
 for(const row of all){assert.ok(row.text.length<=500&&row.titleWord.length<=30&&row.titleWord);for(const [tags,known] of [[row.topicTags,TOPICS],[row.themeTags,THEMES],[row.stageTags,STAGES],[row.contextTags,CONTEXTS],[row.requiresContext,CONTEXTS]])for(const tag of tags)assert.ok(known.some(([id])=>id===tag),row.id+' unknown '+tag);if(row.relationShape)assert.ok(['pair','group','neutral'].includes(row.relationShape));assert.deepEqual(knownLinks(row),row.plotLinks);assert.ok(DATA.world.some(w=>meetsContext(row,w.contextTags)&&row.tones.some(t=>w.tones.includes(t))),row.id+' unreachable');}
 for(const [key,rows] of Object.entries(EXTRA_DATA))assert.equal(new Set(rows.map(r=>r.text)).size,rows.length,key+' repeated text');
 for(const [key,rows] of Object.entries(QUESTION_DATA))assert.equal(new Set(rows.map((r,n)=>typeof r==='string'?key+n:r.id)).size,rows.length);
});
test('C new background requirements are gates, not inferred from custom text or selected themes',()=>{
 const s=emptyState();s.settings.themes=['archive-mystery'];editField(s,'world','AIと記憶のある未来都市','都市',[]);const old=clone(s);for(const tag of ['artificial-intelligence','memory-tech','future-record']){const rows=Object.values(ROUND4_BASIC).flat().filter(r=>r.requiresContext.includes(tag));assert.ok(rows.length);for(const row of rows)assert.equal(meetsContext(row,worldContext(s)),false);}assert.deepEqual(s,old);editField(s,'world','作者の世界','世界',['artificial-intelligence','memory-tech','future-record']);refreshTexts(s);assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);const oldState=clone(s);delete oldState.items.world.contextTags;assert.deepEqual(validateState(oldState).items.world.contextTags,[]);
});
test('C both modes support new themes/scene, tone/context, priority slots, locks and previous exclusion',()=>{
 for(const coherence of ['cohesive','mix'])for(const [theme] of ROUND4_THEMES)for(const tone of [1,2,3,4])for(let n=1;n<=12;n++){
  const s=emptyState();Object.assign(s.settings,{coherence,themes:[theme],tone});rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(n)});assert.ok(BASIC.filter(([k])=>s.items[k]?.themeTags.includes(theme)).length>=3);assert.ok(['relation','incident','conflict','gimmick','twist'].filter(k=>s.items[k]?.themeTags.includes(theme)).length>=2);
  for(const [key] of BASIC){assert.ok(s.items[key].tones.includes(tone));assert.ok(meetsContext(s.items[key],worldContext(s)));}
  rollFields(s,SCENE.map(([k])=>k),{data:EXTRA_DATA,rng:rngFor(n+99)});const old=clone(s.items);s.locks['scene.goal']=true;rollFields(s,SCENE.map(([k])=>k),{data:EXTRA_DATA,rng:rngFor(n+199)});assert.deepEqual(s.items['scene.goal'],old['scene.goal']);for(const [k] of BASIC)assert.deepEqual(s.items[k],old[k]);for(const [k] of SCENE.slice(1))assert.notEqual(s.items[k].candidateId,old[k].candidateId);
 }
});
test('C scene structural matches receive bounded cohesion weighting and mix stays neutral',()=>{const s=emptyState();s.items['scene.goal']=SCENE_DATA['scene.goal'][0];const same=SCENE_DATA['scene.opening'][0];assert.ok(cohesionMultiplier(same,s,'scene.opening',[])>1);s.settings.coherence='mix';assert.equal(cohesionMultiplier(same,s,'scene.opening',[]),1);});
