import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA,BASIC,THEMES,PURPOSES,STAGES} from '../js/data.js';
import {EXTRA_DATA,QUESTION_DATA} from '../js/extra-data.js';
import {PACK_DATA} from '../js/theme-pack-data.js';
import {PACK_EXTRA,PACK_QUESTIONS,SHARED_PACK_CHARACTERS,PACK_PROGRESSION} from '../js/theme-pack-extra.js';
import {CONTEXTS,PACKS,meetsContext,worldContext} from '../js/context.js';
import {availablePool,priorityPlan,themeMask,MAJOR_FIELDS} from '../js/priority.js';
import {emptyState,rollFields,editField,clone,refreshTexts,markdown,weightFor,OPTIONAL,History} from '../js/core.js';
import {validateState,exportJSON,inspectImport,Repository,STORAGE_KEY} from '../js/storage.js';
import {drawQuestions,answerQuestion} from '../js/questions.js';
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const packIds=PACKS.slice(0,4).map(([id])=>id),basicKeys=BASIC.map(([key])=>key);
const row=(id,themes=[],requires=[])=>({id,text:`本文 ${id}`,titleWord:id,source:'generated',stageTags:['fantasy'],themeTags:themes,tones:[1,2,3,4,5],contextTags:[],requiresContext:requires});
const fixedWorld=contexts=>({candidateId:'fixed',text:'固定した世界',titleWord:'固定世界',source:'custom',stageTags:[],themeTags:[],tones:[],contextTags:contexts,requiresContext:[]});
test('four packs have 300 unique substantive basic definitions and tone/category minimums',()=>{
 const expected={beastfolk:[12,4,16,12,12,12,12],'desert-court':[12,4,16,12,12,12,12],romantasy:[8,4,16,10,10,12,10],'cozy-fantasy':[12,4,14,12,8,10,10]};
 assert.equal(THEMES.length,22);assert.ok(Object.values(DATA).flat().length>=1277);
 const added=Object.values(PACK_DATA).flatMap(p=>Object.values(p).flat());assert.equal(added.length,300);assert.equal(new Set(added.map(r=>r.id)).size,300);
 for(const pack of packIds)for(const [i,key] of basicKeys.entries()){
  const rows=PACK_DATA[pack][key];assert.equal(rows.length,expected[pack][i]);
  const light=rows.filter(r=>r.tones.includes(1)).length;
  if(['beastfolk','desert-court'].includes(pack)||pack==='romantasy'&&MAJOR_FIELDS.includes(key))assert.ok(light>=2,`${pack} ${key} light`);
  if(pack==='cozy-fantasy')assert.ok(light>=Math.ceil(rows.length/2));
  if(pack==='romantasy')assert.ok(rows.some(r=>r.tones.includes(2))&&rows.some(r=>r.tones.includes(3)));
 }
 for(const [key,rows] of Object.entries(DATA)){assert.equal(new Set(rows.map(r=>r.text)).size,rows.length,`${key} duplicate text`);for(const r of rows.filter(r=>r.origin==='theme-pack')){assert.ok(r.titleWord&&r.titleWord.length<=30);assert.ok(r.themeTags.includes(r.primaryPack));assert.ok(r.text.length<=500);assert.ok(r.contextTags.every(t=>CONTEXTS.some(([id])=>id===t)));assert.ok(r.requiresContext.every(t=>CONTEXTS.some(([id])=>id===t)));if(key==='world')assert.deepEqual(r.requiresContext,[]);else assert.ok(DATA.world.some(w=>meetsContext(r,w.contextTags)&&w.tones.some(t=>r.tones.includes(t))),`unreachable ${r.id}`);}}
});
test('pair and triple mixed packs have actual shared candidates',()=>{
 for(const pair of [['beastfolk','desert-court'],['beastfolk','cozy-fantasy'],['desert-court','romantasy'],['romantasy','cozy-fantasy']]){
  for(const [key,min] of [['world',1],['relation',2],['incident',2]])assert.ok(DATA[key].filter(r=>pair.every(t=>r.themeTags.includes(t))).length>=min,`${pair} ${key}`);
 }
 for(const key of ['world','relation','gimmick'])assert.ok(DATA[key].some(r=>['beastfolk','desert-court','romantasy'].every(t=>r.themeTags.includes(t))));
});
test('characters use 60 shared definitions, progression 64, and questions 32 stable additions',()=>{
 assert.equal(Object.values(SHARED_PACK_CHARACTERS).flat().length,60);assert.equal(Object.values(PACK_PROGRESSION).flat().length,64);assert.equal(Object.values(PACK_QUESTIONS).flat().length,32);
 for(const pack of packIds){for(const key of ['role','goal','secret'])assert.equal(PACK_EXTRA[pack][key].length,5);for(const key of ['deadline','obstacle','cost','ending'])assert.equal(PACK_EXTRA[pack][key].length,4);assert.equal(Object.values(PACK_QUESTIONS).flat().filter(q=>q.primaryPack===pack).length,8);}
 assert.equal(new Set(Object.values(PACK_EXTRA).flatMap(p=>Object.values(p).flat()).map(r=>r.id)).size,124);
 for(const row of [...Object.values(PACK_DATA),...Object.values(PACK_EXTRA)].flatMap(p=>Object.values(p).flat())){assert.ok(row.titleWord&&row.titleWord.length<=30);assert.ok(row.stageTags.every(t=>STAGES.some(([id])=>id===t)));assert.ok(row.themeTags.every(t=>THEMES.some(([id])=>id===t)));assert.ok(row.tones.length&&row.tones.every(t=>Number.isInteger(t)&&t>=1&&t<=5));}
 for(const [key] of OPTIONAL)assert.equal(EXTRA_DATA[key].length,key.startsWith('scene.')?16:key.endsWith('.role')?52:key.includes('.')?48:key==='ending'?54:key==='cost'?48:44);
 for(const rows of Object.values(QUESTION_DATA)){assert.equal(rows.length,26);assert.ok(rows.slice(0,15).every(q=>typeof q==='string'));assert.ok(rows.slice(15).every(q=>typeof q.id==='string'));}
});
test('full draws reflect three categories and two major categories across packs and fixed seeds',()=>{
 for(const themes of [...packIds.map(id=>[id]),['beastfolk','desert-court','romantasy'],['beastfolk','cozy-fantasy'],['romantasy','cozy-fantasy']])for(let seed=1;seed<=40;seed++){
  const s=emptyState();s.settings.themes=themes;s.settings.stage='fantasy';s.settings.tone=themes.includes('cozy-fantasy')?1:3;
  rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(seed)});
  const items=basicKeys.map(k=>s.items[k]);assert.ok(themeMask(s.items.world,themes));assert.ok(items.filter(i=>themeMask(i,themes)).length>=3);
  assert.ok(MAJOR_FIELDS.filter(k=>themeMask(s.items[k],themes)).length>=2);
  for(const t of themes)assert.ok(items.some(i=>i.themeTags.includes(t)),`missing ${t} seed ${seed}`);
  for(const key of basicKeys.filter(k=>k!=='world'))assert.ok(meetsContext(s.items[key],worldContext(s)),`${key} background`);
 }
});
test('priority slots vary, remaining slots use ordinary weights, and no-theme draws remain varied',()=>{
 const pools=Object.fromEntries(basicKeys.filter(k=>k!=='world').map(k=>[k,[row(k,['beastfolk'])]]));
 const shapes=new Set();for(let seed=1;seed<=40;seed++){const p=priorityPlan(Object.keys(pools),pools,['beastfolk'],{baseMask:1,baseCount:1,rng:rngFor(seed)});assert.equal(Object.keys(p.plan).length,2);assert.ok(Object.keys(p.plan).every(k=>MAJOR_FIELDS.includes(k)));shapes.add(Object.keys(p.plan).sort().join(','));}assert.ok(shapes.size>=3);
 const worlds=new Set(),origins=new Set();for(let seed=1;seed<=50;seed++){const s=emptyState();rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(seed*987653)});worlds.add(s.items.world.candidateId);origins.add(DATA.world.find(r=>r.id===s.items.world.candidateId).origin);}assert.ok(worlds.size>20);assert.ok(origins.has('theme-pack'));assert.ok(origins.has('original')||origins.has('new'));
});
test('explicit background requirements never become eligible just because a theme is selected',()=>{
 const s=emptyState();s.settings.themes=['beastfolk','desert-court','cozy-fantasy'];s.items.world=fixedWorld([]);s.locks.world=true;
 const data=Object.fromEntries(basicKeys.filter(k=>k!=='world').map(k=>[k,[row(`${k}-safe`),row(`${k}-magic`,['cozy-fantasy'],['magic']),row(`${k}-beast`,['beastfolk'],['beastfolk']),row(`${k}-court`,['desert-court'],['royal'])]]));
 const result=rollFields(s,undefined,{data,rng:()=>0});assert.equal(s.items.world.text,'固定した世界');for(const key of basicKeys.filter(k=>k!=='world'))assert.match(s.items[key].candidateId,/-safe$/);assert.ok(result.notices.length);
 s.items.world.contextTags=['magic'];assert.equal(availablePool(s,'incident',data,worldContext(s)).pool.some(x=>x.id==='incident-magic'),true);assert.equal(availablePool(s,'incident',data,worldContext(s)).pool.some(x=>x.id==='incident-beast'),false);
});
test('locked world and fields stay unchanged while compatible mixed priorities use remaining slots',()=>{
 const s=emptyState();s.settings.themes=['beastfolk','desert-court','romantasy'];s.items.world=fixedWorld(['beastfolk','desert','royal','magic','trade','oasis','nomadic','spirit']);s.locks.world=true;
 s.items.conflict={...row('fixed-conflict',['beastfolk']),candidateId:'fixed-conflict',source:'legacy'};s.locks.conflict=true;const saved=clone([s.items.world,s.items.conflict]);
 rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(15)});assert.deepEqual([s.items.world,s.items.conflict],saved);for(const theme of s.settings.themes)assert.ok(basicKeys.some(k=>s.items[k].themeTags.includes(theme)));
});
test('previous-only themed candidate is excluded, and a shortage preserves state without retrying',()=>{
 const s=emptyState();s.settings.themes=['beastfolk'];s.items.world=fixedWorld(['beastfolk']);s.locks.world=true;const old={...row('one',['beastfolk']),candidateId:'one'};s.items.relation=clone(old);
 const data={relation:[row('one',['beastfolk']),row('other')]};let calls=0;rollFields(s,['relation'],{data,rng:()=>{calls++;return 0;}});assert.equal(s.items.relation.candidateId,'other');assert.equal(calls,1);
 s.items.relation=clone(old);assert.equal(rollFields(s,['relation'],{data:{relation:[row('one',['beastfolk'])]}}).changed,0);assert.deepEqual(s.items.relation,old);
 for(const [key] of BASIC)s.locks[key]=true;const before=clone(s);assert.equal(rollFields(s,undefined,{data:EXTRA_DATA}).changed,0);assert.deepEqual(s,before);
});
test('strict stage/tone, individual boundaries, recent ten entries and background mismatch notice',()=>{
 const s=emptyState();s.settings.themes=['cozy-fantasy'];s.settings.stage='scifi';s.settings.tone=5;const result=rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(11)});assert.ok(s.items.world.stageTags.includes('scifi'));for(const k of basicKeys)assert.ok(s.items[k].tones.includes(5));assert.ok(result.notices.some(x=>x.includes('日常ファンタジー')));
 const before=clone(s.items);rollFields(s,['world'],{data:EXTRA_DATA,rng:rngFor(12)});for(const k of basicKeys.filter(k=>k!=='world'))assert.deepEqual(s.items[k],before[k]);
 const recent={};s.settings.tone=3;for(let i=0;i<20;i++)rollFields(s,['genre'],{data:EXTRA_DATA,recent,rng:rngFor(i+1)});assert.equal(recent.genre.length,10);
});
test('optional group draws aim at two theme slots and discourage matching goals and secrets',()=>{
 const s=emptyState();s.settings.themes=['cozy-fantasy'];s.items.world=fixedWorld(['magic','trade','spirit']);
 for(const keys of [OPTIONAL.slice(0,6).map(([k])=>k),OPTIONAL.slice(6,10).map(([k])=>k)]){rollFields(s,keys,{data:EXTRA_DATA,rng:rngFor(22)});assert.ok(keys.filter(k=>s.items[k].themeTags.includes('cozy-fantasy')).length>=2);}
 const candidate=EXTRA_DATA['protagonist.goal'][0];s.items['counterpart.goal']={text:candidate.text};const discounted=weightFor(candidate,s,'protagonist.goal');s.items['counterpart.goal']=null;assert.ok(discounted<weightFor(candidate,s,'protagonist.goal'));
 const before=clone(s.items);rollFields(s,['counterpart.secret'],{data:EXTRA_DATA,rng:rngFor(2)});for(const key of Object.keys(before).filter(k=>k!=='counterpart.secret'))assert.deepEqual(s.items[key],before[key]);
});
test('custom background is explicit, auto locked, undo-safe metadata and roundtrips in JSON and Markdown',()=>{
 const s=emptyState();s.items.world={...DATA.world.find(r=>r.contextTags.includes('beastfolk')),candidateId:'old'};
 editField(s,'world','手入力で変えた世界','私の世界');assert.deepEqual(s.items.world.contextTags,[]);assert.deepEqual(s.items.world.themeTags,[]);
 const history=new History(s);editField(s,'world','王宮と工房が共存する世界','私の世界',['royal','magic']);history.record(s);assert.deepEqual(history.undo().items.world.contextTags,[]);assert.deepEqual(history.redo().items.world.contextTags,['royal','magic']);assert.equal(s.locks.world,true);assert.deepEqual(inspectImport(exportJSON(s))[0].state.items,s.items);refreshTexts(s,{rng:()=>0});assert.match(markdown(s),/王族・宮廷、魔法/);assert.doesNotMatch(markdown(s),/contextTags|requiresContext|\broyal\b/);
 assert.throws(()=>editField(s,'world','世界','',['magic','magic']));assert.throws(()=>editField(s,'world','世界','',['unknown']));
});
test('old v2 hydrates background by generated candidate ID while preserving saved prose and custom data',()=>{
 const s=emptyState(),def=DATA.world.find(r=>r.text==='獣人と人間が共存する国');s.items.world={candidateId:def.id,text:'保存された原文',titleWord:'保存語',source:'generated',stageTags:clone(def.stageTags),themeTags:[],tones:clone(def.tones)};s.locks.world=true;s.texts={summary:'旧要約',memo:'旧メモ',hint:'旧ヒント',titles:['旧題']};
 const loaded=validateState(s);assert.deepEqual(loaded.items.world.contextTags,['beastfolk']);assert.ok(loaded.items.world.themeTags.includes('beastfolk'));assert.equal(loaded.items.world.text,'保存された原文');assert.equal(loaded.items.world.titleWord,'保存語');assert.deepEqual(loaded.texts,s.texts);assert.equal(loaded.locks.world,true);
 for(const source of ['custom','legacy']){s.items.world.source=source;const kept=validateState(s);assert.deepEqual(kept.items.world.contextTags,[]);assert.deepEqual(kept.items.world.themeTags,[]);}
 s.items.world.source='generated';s.items.world.candidateId='missing';s.items.world.text=def.text;assert.deepEqual(validateState(s).items.world.contextTags,[]);
 const map=new Map([[STORAGE_KEY,JSON.stringify({app:'creative-idea-gacha',schemaVersion:2,current:s,works:[]})]]);const store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};const repo=new Repository(store);assert.equal(repo.load().current.items.world.text,def.text);
});
test('untrusted background arrays are bounded, unknown IDs remain neutral, and dangerous keys are ignored',()=>{
 const s=emptyState();s.items.world=fixedWorld(['unknown']);assert.deepEqual(worldContext(s),[]);assert.equal(meetsContext(row('x',[],['unknown']),['unknown']),false);assert.deepEqual(validateState(s).items.world.contextTags,['unknown']);
 for(const bad of ['magic',['magic','magic'],Array(17).fill('magic'),['x'.repeat(41)],[{}]]){const changed=clone(s);changed.items.world.contextTags=bad;assert.throws(()=>validateState(changed));}
 const polluted=JSON.parse(JSON.stringify(s).replace('"items":{','"__proto__":{"polluted":true},"items":{"constructor":{"polluted":true},'));validateState(polluted);assert.equal({}.polluted,undefined);
});
test('new questions respect background and old saved question IDs, answers and wording survive theme changes',()=>{
 const s=emptyState();s.settings.themes=['beastfolk'];s.items.world=fixedWorld([]);drawQuestions(s,'world',{rng:()=>0});assert.ok(s.questions.world.some(q=>q.text.includes('としたら')));assert.ok(s.questions.world.every(q=>!q.text.includes('共存を維持')));
 s.questions.world[0]={id:'question-world-1',text:'以前の質問を保存',answer:'以前の回答',locked:false};const old=clone(s.questions.world[0]);s.settings.themes=['cozy-fantasy'];drawQuestions(s,'world',{rng:rngFor(2)});assert.deepEqual(s.questions.world[0],old);
 answerQuestion(s,'world',1,'新しい回答');const answered=clone(s.questions.world[1]);drawQuestions(s,'world');assert.deepEqual(s.questions.world[1],answered);
 assert.deepEqual(inspectImport(exportJSON(s))[0].state.questions,s.questions);
});
test('all purposes preserve natural Japanese with new mixed materials and long custom sentences',()=>{
 const s=emptyState();s.settings.themes=['beastfolk','desert-court','romantasy'];rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(8)});editField(s,'incident','砂漠の市場に、忘れていた約束を覚える人がやって来る','忘れていた約束');editField(s,'relation','隊商と街の住人たち','隊商の仲間');
 for(const purpose of PURPOSES){s.settings.purpose=purpose;refreshTexts(s,{rng:rngFor(3)});assert.doesNotMatch(JSON.stringify(s.texts),/undefined|二人|来る」が起き|たちと二人/);assert.equal(new Set(s.texts.titles).size,3);assert.ok(s.texts.titles.every(t=>t.length<60));}
});
