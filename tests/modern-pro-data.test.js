import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA,BASIC,THEMES,STAGES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {MODERN_PRO_BASIC,MODERN_PRO_A,MODERN_PRO_B,parseModernPro,MODERN_PRO_THEMES,PROFESSIONAL_CONTEXTS} from '../js/modern-pro-data.js';
import {CONTEXTS,meetsContext,worldContext,PROFESSIONAL_WORLD_PATCHES} from '../js/context.js';
import {TOPICS} from '../js/story-metadata.js';
import {knownLinks,cohesionMultiplier} from '../js/cohesion.js';
import {emptyState,rollFields,refreshTexts,editField,markdown} from '../js/core.js';
import {buildAIHandoff} from '../js/ai-handoff.js';
import {availablePool} from '../js/priority.js';
import {validateState,exportJSON,inspectImport} from '../js/storage.js';
const all=Object.values(MODERN_PRO_BASIC).flat();
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('modern-pro strict group/eleven-column parser validates all required cells and relation shapes',()=>{
 const good='#group modern-love\nrelation|couple|成人の恋人二人|恋人|123|shared-home||modern|romance||pair';
 assert.deepEqual(parseModernPro('love','A',good).relation[0].themeTags,['modern-love','romance']);
 for(const bad of [good.split('\n')[1],good+'|extra',good.replace('couple|','|'),good.replace('123','113'),good.replace('modern|','school|'),good.replace('pair','neutral'),good.replace('relation','world'),good.replace('#group modern-love','#group mystery'),good+'\n'+good.split('\n')[1]])assert.throws(()=>parseModernPro('love','A',bad));
 assert.throws(()=>parseModernPro('unknown','A',good));assert.equal(Object.hasOwn(parseModernPro('office','A','#group workplace-pro\nworld|office|職場|会社|12||company|modern|||').world[0],'relationShape'),false);
});
test('modern-pro A127+B53 match category distributions and preserve 20 original pairs plus five new pairs',()=>{
 const counts=rows=>Object.fromEntries(['love','office','police','education','medical'].map(c=>[c,Object.values(rows).flat().filter(r=>r.modernProCategory===c).length]));
 assert.deepEqual(counts(MODERN_PRO_A),{love:59,office:17,police:17,education:17,medical:17});assert.deepEqual(counts(MODERN_PRO_B),{love:4,office:18,police:11,education:10,medical:10});
 assert.deepEqual(Object.fromEntries(Object.entries(MODERN_PRO_BASIC).map(([k,v])=>[k,v.length])),{world:19,genre:8,relation:37,incident:36,conflict:36,gimmick:16,twist:28});
 for(const [c,expected] of Object.entries({love:[11,10,10,9],office:[8,8,8,6],police:[6,6,6,5],education:[6,6,6,4],medical:[6,6,6,4]}))assert.deepEqual(['relation','incident','conflict','twist'].map(k=>MODERN_PRO_BASIC[k].filter(r=>r.modernProCategory===c).length),expected);
 const aLinks=new Set(Object.values(MODERN_PRO_A).flat().flatMap(r=>r.plotLinks));assert.equal(aLinks.size,20);const links=new Set(all.flatMap(r=>r.plotLinks));assert.equal(links.size,25);
 for(const link of links){const c=MODERN_PRO_BASIC.conflict.filter(r=>r.plotLinks.includes(link)),t=MODERN_PRO_BASIC.twist.filter(r=>r.plotLinks.includes(link));assert.equal(c.length,1,link);assert.equal(t.length,1,link);assert.ok(c[0].tones.some(tone=>t[0].tones.includes(tone)));assert.deepEqual(knownLinks(t[0]),t[0].plotLinks);const s=emptyState();s.items.conflict=c[0];assert.equal(cohesionMultiplier(t[0],s,'twist',[]),4);s.settings.coherence='mix';assert.equal(cohesionMultiplier(t[0],s,'twist',[]),1);}
});
test('modern-pro full DATA IDs/text, dictionary tags, shape, adult interpretation and professional coverage are valid',()=>{
 assert.ok(Object.values(DATA).flat().length>=1457);assert.equal(THEMES.length,22);assert.equal(CONTEXTS.length,15);assert.equal(new Set(Object.values(DATA).flat().map(r=>r.id)).size,Object.values(DATA).flat().length);
 for(const [key,rows] of Object.entries(MODERN_PRO_BASIC))for(const r of rows){assert.equal(DATA[key].filter(x=>x.text===r.text).length,1,r.id);assert.ok(EXTRA_DATA[key].includes(r));assert.deepEqual(r.stageTags,['modern']);assert.ok(r.text.length<=500&&r.titleWord.length<=30);for(const [tags,dict] of [[r.topicTags,TOPICS],[r.themeTags,THEMES],[r.contextTags,CONTEXTS],[r.requiresContext,CONTEXTS]])for(const tag of tags)assert.ok(dict.some(([id])=>id===tag),r.id+' '+tag);if(key==='relation')assert.ok(['pair','group'].includes(r.relationShape));else assert.equal(Object.hasOwn(r,'relationShape'),false);for(const tone of r.tones)assert.ok(DATA.world.some(w=>w.stageTags.includes('modern')&&w.tones.includes(tone)&&meetsContext(r,w.contextTags)),r.id+' tone'+tone);}
 for(const [tag] of PROFESSIONAL_CONTEXTS){assert.ok(MODERN_PRO_BASIC.world.filter(r=>r.contextTags.includes(tag)).length>=2);for(const [key] of BASIC.slice(1))assert.ok(MODERN_PRO_BASIC[key].some(r=>r.requiresContext.includes(tag)),tag+key);}
 for(const slug of ['fiance-family','doctor-family'])assert.equal(MODERN_PRO_BASIC.relation.find(r=>r.id.endsWith('-'+slug)).relationShape,'group');assert.match(MODERN_PRO_BASIC.relation.find(r=>r.id.endsWith('-app-match')).text,/二人/);assert.match(MODERN_PRO_BASIC.twist.find(r=>r.id.endsWith('-device-drift')).text,/判断への影響/);
});
test('modern-pro exhaustive background sets and five tones keep profession gates under both modes and themes',()=>{
 const sets=[[],...PROFESSIONAL_CONTEXTS.map(([id])=>[id]),['company','police'],['medical','education'],PROFESSIONAL_CONTEXTS.map(([id])=>id)];
 for(const context of sets)for(let tone=1;tone<=5;tone++)for(const coherence of ['cohesive','mix'])for(const themes of [[],['modern-love'],['workplace-pro'],['modern-love','workplace-pro'],['modern-love','workplace-pro','daily-work']]){
  const s=emptyState();Object.assign(s.settings,{tone,coherence,themes,stage:'modern'});editField(s,'world','作者が指定した職場のある世界','世界',context);
  for(const [key] of BASIC.slice(1)){const ids=new Set(availablePool(s,key,EXTRA_DATA,worldContext(s)).pool.map(r=>r.id));for(const row of MODERN_PRO_BASIC[key])assert.equal(ids.has(row.id),row.tones.includes(tone)&&row.requiresContext.every(t=>context.includes(t)),row.id);}
  rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(2016)});for(const [key] of BASIC.slice(1))assert.ok(meetsContext(s.items[key],context));
 }
});
test('modern-pro every definition is directly drawable with themed context, strips classification and roundtrips selected prose',()=>{
 for(const [key,rows] of Object.entries(MODERN_PRO_BASIC))for(const row of rows){const s=emptyState();Object.assign(s.settings,{stage:'modern',tone:row.tones[0],themes:row.themeTags.slice(0,3)});if(key!=='world'){const w=DATA.world.find(w=>w.stageTags.includes('modern')&&w.tones.includes(s.settings.tone)&&meetsContext(row,w.contextTags));rollFields(s,['world'],{data:{world:[w]},rng:()=>0});s.locks.world=true;}
  assert.ok(availablePool(s,key,EXTRA_DATA,worldContext(s)).pool.some(r=>r.id===row.id));rollFields(s,[key],{data:{[key]:[row]},rng:()=>0});refreshTexts(s);assert.equal(s.items[key].candidateId,row.id);assert.equal(Object.hasOwn(s.items[key],'modernProCategory'),false);assert.equal(Object.hasOwn(s.items[key],'modernProBatch'),false);assert.deepEqual(validateState(s),s);assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);assert.ok(markdown(s).includes(row.text));for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){const text=buildAIHandoff(s,{purpose,length});assert.ok(text.includes(row.text));assert.ok(!text.includes(row.id));}}
});
test('modern-pro old world patches are ID-limited and preserve explicit empty contexts/custom/legacy with missing-only generated hydration',()=>{
 for(const [id,tags] of Object.entries(PROFESSIONAL_WORLD_PATCHES)){const w=DATA.world.find(r=>r.id===id);for(const tag of tags)assert.ok(w.contextTags.includes(tag));const s=emptyState();s.items.world={...w,candidateId:id};delete s.items.world.id;delete s.items.world.origin;s.locks.world=true;s.texts.summary='以前の要約';s.texts.memo='以前のメモ';delete s.items.world.contextTags;assert.deepEqual(validateState(s).items.world.contextTags,w.contextTags);assert.equal(validateState(s).texts.memo,'以前のメモ');s.items.world.contextTags=[];assert.deepEqual(validateState(s).items.world.contextTags,[]);for(const source of ['custom','legacy']){s.items.world.source=source;delete s.items.world.contextTags;assert.deepEqual(validateState(s).items.world.contextTags,[]);assert.equal(validateState(s).items.world.text,w.text);}}
 for(const id of ['world-original-1fkt0l7','world-original-15gxvza'])assert.ok(DATA.world.find(w=>w.id===id).contextTags.every(t=>!PROFESSIONAL_CONTEXTS.some(([tag])=>tag===t)));
 const s=emptyState();editField(s,'world','企業社会、医療現場、学校、警察の署','職場',[]);assert.deepEqual(validateState(s).items.world.contextTags,[]);
});
test('modern-pro fixed profession worlds admit new materials and retain themes, tone, locks and previous exclusion over fixed seeds',()=>{
 for(const [tag] of PROFESSIONAL_CONTEXTS)for(const coherence of ['cohesive','mix'])for(let tone=1;tone<=5;tone++)for(let seed=1;seed<=24;seed++){
  const s=emptyState();Object.assign(s.settings,{tone,coherence,stage:'modern',themes:['workplace-pro']});const w=DATA.world.find(w=>w.stageTags.includes('modern')&&w.contextTags.includes(tag)&&w.tones.includes(tone));rollFields(s,['world'],{data:{world:[w]},rng:()=>0});s.locks.world=true;rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(seed)});for(const [key] of BASIC.slice(1)){assert.ok(meetsContext(s.items[key],w.contextTags));assert.ok(s.items[key].tones.includes(tone));}const first=structuredClone(s.items);rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(seed+99)});assert.deepEqual(s.items.world,first.world);for(const [key] of BASIC.slice(1))assert.notEqual(s.items[key].candidateId,first[key].candidateId);
 }
});
