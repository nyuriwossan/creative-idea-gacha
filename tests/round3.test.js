import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA,BASIC,THEMES,STAGES,PURPOSES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {STORY_BASIC,STORY_PROGRESS,STORY_PAIRS} from '../js/story-data.js';
import {STORY_PATCHES,TOPICS} from '../js/story-metadata.js';
import {emptyState,clone,rollFields,editField,refreshTexts,History,weightFor,markdown,updateSettings} from '../js/core.js';
import {focusTopics,cohesionMultiplier,knownLinks} from '../js/cohesion.js';
import {prepareDrafts,DraftError} from '../js/drafts.js';
import {BackupStatus,BACKUP_STATUS_KEY,worksFingerprint} from '../js/backup.js';
import {Repository,validateState,exportJSON,inspectImport} from '../js/storage.js';
import {drawQuestions} from '../js/questions.js';
import {meetsContext,worldContext} from '../js/context.js';
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const memory=()=>{const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const seed=()=>{const s=emptyState();rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(444)});refreshTexts(s,{rng:rngFor(222)});return s;};
test('round3 adds exactly 114 basic records, 18 progression records and 30 distinct paired structures',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(STORY_BASIC).map(([k,v])=>[k,v.length])),{world:6,genre:10,relation:6,incident:6,conflict:40,gimmick:6,twist:40});
 assert.equal(STORY_PROGRESS.ending.length,12);assert.equal(STORY_PROGRESS.cost.length,6);assert.equal(STORY_PAIRS.length,30);
 const rows=[...Object.values(STORY_BASIC).flat(),...Object.values(STORY_PROGRESS).flat()];assert.equal(rows.length,132);assert.equal(new Set(rows.map(r=>r.id)).size,132);
 for(const [key,rs] of Object.entries(STORY_BASIC))for(const definition of rs){const r=DATA[key].find(row=>row.id===definition.id);assert.ok(r.titleWord&&r.titleWord.length<=30);assert.ok(r.topicTags.every(t=>TOPICS.some(([id])=>id===t)));assert.ok(r.themeTags.every(t=>THEMES.some(([id])=>id===t)));assert.ok(r.stageTags.every(t=>STAGES.some(([id])=>id===t)));assert.equal(DATA[key].filter(x=>x.text===r.text).length,1);if(key!=='world')assert.ok(DATA.world.some(w=>meetsContext(r,w.contextTags)&&r.tones.some(t=>w.tones.includes(t))),r.id);}
 for(const [group,count] of [['beastfolk',6],['desert-court',6],['romantasy',6],['cozy-fantasy',6],['general',8],['bonds',8]])for(const key of ['conflict','twist'])assert.equal(STORY_BASIC[key].filter(r=>r.storyGroup===group).length,count);
 let light=0,dark=0;for(const p of STORY_PAIRS){const c=STORY_BASIC.conflict.find(r=>r.id===p.conflict),t=STORY_BASIC.twist.find(r=>r.id===p.twist);assert.ok(c.plotLinks.includes(p.id)&&t.plotLinks.includes(p.id));if([1,2].some(n=>c.tones.includes(n)&&t.tones.includes(n)))light++;if([4,5].some(n=>c.tones.includes(n)&&t.tones.includes(n)))dark++;}assert.ok(light>=10);assert.ok(dark>=10);
});
test('cozy adds at least four tone4 choices per category and dark genres avoid cozy tone5',()=>{
 for(const key of Object.keys(STORY_BASIC))assert.ok(STORY_BASIC[key].filter(r=>r.storyGroup==='cozy-fantasy'&&r.tones.includes(4)).length>=4,key);
 assert.ok(STORY_BASIC.genre.filter(r=>r.tones.includes(5)&&!r.themeTags.includes('cozy-fantasy')).length>=6);
 assert.equal(Object.values(DATA).flat().filter(r=>r.themeTags.includes('cozy-fantasy')&&r.tones.includes(5)).length,0);
});
test('existing metadata supplements cover 200 basic topics, 60 conflict/twist links and character affinity',()=>{
 const old=Object.values(DATA).flat().filter(r=>r.origin!=='story-round3');assert.ok(old.filter(r=>r.topicTags.length).length>=200);
 const linked=['conflict','twist'].flatMap(k=>DATA[k].filter(r=>r.origin!=='story-round3'&&r.plotLinks.length));assert.ok(linked.length>=60);
 for(const r of linked)for(const link of r.plotLinks){const opposite=r.id.includes('-conflict-')?'twist':'conflict';assert.ok(DATA[opposite].some(x=>x.plotLinks.includes(link)),link);}
 assert.ok(EXTRA_DATA['protagonist.goal'].some(r=>r.topicTags.length&&r.plotLinks.length));assert.equal(Object.keys(STORY_PATCHES).length,360);
});
test('atomic edits include background, hidden answers, names and notes in one history operation',()=>{
 const s=seed();drawQuestions(s,'character',{rng:rngFor(5)});const old=clone(s),history=new History(s);
 const next=prepareDrafts(s,{fields:[{key:'world',text:'魔法の店がある町',titleWord:'魔法の店',contextTags:['magic','trade']},{key:'incident',text:'閉店の日が決まる',titleWord:'閉店の日'}],answers:[{category:'character',index:1,value:'旅を選んだ住人'}],metadata:[{id:'workNotes',key:'notes',value:'まとめて残すメモ'},{id:'protagonistName',key:'protagonist',value:'楓'},{id:'workTags',key:'tags',value:'短編、冬'}]});
 history.record(next);assert.equal(history.snapshots.length,2);assert.deepEqual(s,old);assert.deepEqual(next.items.world.contextTags,['magic','trade']);assert.ok(next.locks.world&&next.locks.incident);assert.equal(next.questions.character[1].answer,'旅を選んだ住人');assert.ok(next.questions.character[1].locked);assert.equal(next.characters.protagonist.name,'楓');assert.deepEqual(next.texts.titles,old.texts.titles);assert.equal(next.texts.hint,old.texts.hint);assert.match(next.texts.memo,/楓/);assert.deepEqual(history.undo(),old);assert.deepEqual(history.redo(),next);
});
test('one invalid draft aborts all edits and returns every field error without mutating input or state',()=>{
 const s=seed(),old=clone(s),draft={fields:[{key:'world',text:'有効な世界',titleWord:'世界',contextTags:[]},{key:'incident',text:'',titleWord:'あ'.repeat(31)}],metadata:[{id:'workNotes',key:'notes',value:'長'.repeat(10001)}]};const originalDraft=clone(draft);
 assert.throws(()=>prepareDrafts(s,draft),e=>e instanceof DraftError&&e.errors.length===3&&e.errors[0].target==='field:incident:text');assert.deepEqual(s,old);assert.deepEqual(draft,originalDraft);
});
test('unmodified editors are absent from batch; empty answers preserve existing lock protection',()=>{
 const s=seed(),unchanged=prepareDrafts(s,{});assert.deepEqual(unchanged,s);assert.equal(unchanged.items.world.source,'generated');assert.equal(unchanged.locks.world,false);
 s.questions.world=[{id:'old-q',text:'古い質問',answer:'消す回答',locked:true}];const next=prepareDrafts(s,{answers:[{category:'world',index:0,value:''}]});assert.equal(next.questions.world[0].answer,'');assert.equal(next.questions.world[0].locked,true);
});
test('answer drafts retain the original question after history removed the generated slots',()=>{
 const s=seed();drawQuestions(s,'world',{rng:rngFor(8)});const group=clone(s.questions.world),slot=group[2];s.questions.world=[];const next=prepareDrafts(s,{answers:[{category:'world',index:2,value:'残した回答',slot,group}]});assert.equal(next.questions.world[2].id,slot.id);assert.equal(next.questions.world[2].answer,'残した回答');assert.equal(validateState(next).questions.world.length,3);
});
test('storage quota failure keeps applied state available for JSON and leaves saved IDs and works intact',()=>{
 const store=memory(),repo=new Repository(store);repo.load();const original=repo.save(seed()),works=clone(repo.works);const next=prepareDrafts(original,{fields:[{key:'conflict',text:'新しい葛藤',titleWord:'新しい葛藤'}]});store.setItem=()=>{throw new Error('quota');};assert.throws(()=>repo.save(next,{overwrite:true}));assert.deepEqual(repo.works,works);assert.equal(next.loadedWorkId,original.loadedWorkId);assert.equal(inspectImport(exportJSON(next))[0].state.items.conflict.text,'新しい葛藤');
});
test('new usage starts cohesive, old v2/legacy start mix and saved prose is never rebuilt',()=>{
 const s=seed();assert.equal(s.settings.coherence,'cohesive');delete s.settings.coherence;s.texts.summary='保存済みの要約';const next=validateState(s);assert.equal(next.settings.coherence,'mix');assert.equal(next.texts.summary,'保存済みの要約');assert.deepEqual(next.items,s.items);assert.equal(validateState({items:{},locks:{},texts:{}},{legacy:true}).settings.coherence,'mix');
 s.settings.coherence='unknown';assert.throws(()=>validateState(s));assert.throws(()=>updateSettings(emptyState(),{coherence:'unknown'}));
});
test('metadata hydrates by generated ID only, stays bounded and roundtrips with coherence and answers',()=>{
 const s=seed();const def=DATA.conflict.find(r=>r.plotLinks.length&&r.origin!=='story-round3');s.items.conflict={...clone(def),candidateId:def.id};delete s.items.conflict.id;delete s.items.conflict.origin;delete s.items.conflict.primaryPack;delete s.items.conflict.topicTags;delete s.items.conflict.plotLinks;
 const loaded=validateState(s);assert.deepEqual(loaded.items.conflict.plotLinks,def.plotLinks);assert.deepEqual(loaded.items.conflict.topicTags,def.topicTags);
 for(const source of ['custom','legacy']){s.items.conflict.source=source;assert.deepEqual(validateState(s).items.conflict.topicTags,[]);}
 s.items.conflict.source='generated';s.items.conflict.candidateId='gone';assert.deepEqual(validateState(s).items.conflict.topicTags,[]);
 for(const bad of ['shop',['shop','shop'],Array(17).fill('shop'),['x'.repeat(81)],[{}]]){s.items.conflict.topicTags=bad;assert.throws(()=>validateState(s));}
 const fresh=seed();fresh.settings.coherence='mix';drawQuestions(fresh,'plot');fresh.questions.plot[0].answer='保存する回答';assert.deepEqual(inspectImport(exportJSON(fresh))[0].state,fresh);assert.match(markdown(fresh),/抽選方針：自由に混ぜる/);assert.doesNotMatch(markdown(fresh),/topicTags|plotLinks|pair-cozy/);
});
test('cohesion raises shared topic/link weight with a cap; mix and unknown tags stay neutral',()=>{
 const s=emptyState();s.items.world={topicTags:['shop'],themeTags:[]};s.items.conflict={plotLinks:['rest-as-care']};const row={id:'test',text:'test',stageTags:[],themeTags:[],contextTags:[],topicTags:['shop'],plotLinks:['rest-as-care']};const neutral={...row,topicTags:[],plotLinks:[]};
 assert.ok(weightFor(row,s,'twist')>weightFor(neutral,s,'twist'));assert.equal(cohesionMultiplier(row,s,'twist'),8);
 s.settings.coherence='mix';assert.equal(weightFor(row,s,'twist'),weightFor(neutral,s,'twist'));
 s.settings.coherence='cohesive';s.items.world.topicTags=['unknown'];s.items.conflict.plotLinks=['unknown'];assert.equal(cohesionMultiplier({...row,topicTags:['unknown'],plotLinks:['unknown']},s,'twist'),1);
});
test('relation and incident feed topic weight without creating more than two focus topics',()=>{
 const s=emptyState();s.items.world={topicTags:['shop','memory'],themeTags:[]};const item={topicTags:['shop'],plotLinks:[]};const before=cohesionMultiplier(item,s,'conflict',['shop','memory']);s.items.relation={topicTags:['shop']};assert.ok(cohesionMultiplier(item,s,'conflict',['shop','memory'])>before);
 for(const key of ['relation','incident','conflict','gimmick','twist']){s.locks[key]=true;s.items[key]={topicTags:TOPICS.map(([id])=>id),themeTags:[]};}assert.equal(focusTopics(s,rngFor(8)).length,2);
});
test('both modes retain themes, context, tone, locks, previous exclusion and individual boundaries',()=>{
 for(const coherence of ['cohesive','mix'])for(const themes of [['beastfolk'],['cozy-fantasy'],['beastfolk','desert-court','romantasy']])for(let n=1;n<=15;n++){
  const s=emptyState();s.settings={...s.settings,coherence,themes,stage:'fantasy',tone:themes[0]==='cozy-fantasy'?4:3};const recent={};rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(n*4567),recent});const related=k=>s.items[k].themeTags.some(t=>themes.includes(t));assert.ok(BASIC.filter(([k])=>related(k)).length>=3);assert.ok(['relation','incident','conflict','gimmick','twist'].filter(related).length>=2);for(const k of ['genre','relation','incident','conflict','gimmick','twist'])assert.ok(meetsContext(s.items[k],worldContext(s)));
  const previous=clone(s.items);s.locks.world=true;const result=rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(n*789),recent});assert.deepEqual(s.items.world,previous.world);assert.ok(result.focusTopics.length<=2);for(const k of ['genre','relation','incident','conflict','gimmick','twist'])assert.notEqual(s.items[k].candidateId,previous[k].candidateId);
  const before=clone(s.items);rollFields(s,['twist'],{data:EXTRA_DATA,rng:rngFor(88)});for(const [key] of BASIC.filter(([k])=>k!=='twist'))assert.deepEqual(s.items[key],before[key]);
 }
});
test('AI character purpose mildly prefers pairs without forbidding groups or asserting a fixed ending',()=>{
 const s=emptyState();s.settings.purpose='AIキャラプロットの種';const pair={id:'p',stageTags:[],themeTags:[],relationShape:'pair'},group={...pair,id:'g',relationShape:'group'};assert.ok(weightFor(pair,s,'relation')>weightFor(group,s,'relation'));assert.ok(weightFor(group,s,'relation')>0);
 const state=seed();state.settings.purpose=s.settings.purpose;editField(state,'relation','店主たちが支え合う集団','店主たち');state.items.ending={...STORY_PROGRESS.ending[4],candidateId:STORY_PROGRESS.ending[4].id};refreshTexts(state);assert.match(state.texts.memo,/展開候補/);assert.doesNotMatch(state.texts.memo,/二人の物語/);
});
test('backup tracking counts material work changes, export time only records all-works operations',()=>{
 const store=memory(),b=new BackupStatus(store,[]),works=[];for(let i=0;i<5;i++){works.push({id:i,updatedAt:String(i),fav:false,state:{name:String(i)}});b.observe(works);}assert.equal(b.meta.changes,5);assert.equal(b.shouldPrompt,true);b.dismiss();assert.equal(b.shouldPrompt,false);b.observe(works);assert.equal(b.meta.changes,5);
 const before=worksFingerprint(works);works[0].updatedAt='later';b.observe(works);assert.equal(worksFingerprint(works),before);assert.equal(b.meta.changes,5);
 b.exported(works,'2026-10-04T10:00:00.000Z');assert.equal(b.meta.lastExportAt,'2026-10-04T10:00:00.000Z');assert.equal(b.changed,false);works[0].fav=true;b.observe(works);assert.equal(b.changed,true);assert.equal(b.meta.changes,1);const restored=new BackupStatus(store,works);assert.equal(restored.changed,true);assert.equal(restored.meta.lastExportAt,b.meta.lastExportAt);
});
test('backup auxiliary write failures do not throw or change saved works',()=>{
 const store=memory(),repo=new Repository(store);repo.load();const s=repo.save(seed()),b=new BackupStatus(store,repo.works);const native=store.setItem;store.setItem=(k,v)=>{if(k===BACKUP_STATUS_KEY)throw new Error('aux quota');native(k,v);};s.metadata.name='次の作品';repo.save(s);b.observe(repo.works);assert.equal(repo.works.length,2);assert.match(b.warning,/作品の保存結果とは別/);assert.doesNotThrow(()=>b.exported(repo.works));assert.ok(b.meta.lastExportAt);
});
