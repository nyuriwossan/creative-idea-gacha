import test from 'node:test';
import assert from 'node:assert/strict';
import { BASIC,DATA,ADDITION_COUNTS,BASELINE_COUNTS,PURPOSES } from '../js/data.js';
import { emptyState,rollFields,editField,History,updateSettings,refreshTexts,weightFor,weightedPick,clone } from '../js/core.js';
import { Repository,STORAGE_KEY,OLD_KEYS,BACKUP_KEY,exportJSON,inspectImport } from '../js/storage.js';
export function memoryStorage(){const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};}
test('candidate targets, unique stable IDs and valid metadata',()=>{
 assert.equal(Object.values(BASELINE_COUNTS).reduce((a,b)=>a+b,0),394);
 assert.ok(Object.values(ADDITION_COUNTS).reduce((a,b)=>a+b,0)>=100);
 for(const [key] of BASIC){assert.equal(new Set(DATA[key].map(x=>x.id)).size,DATA[key].length);for(const row of DATA[key])assert.ok(row.titleWord||row.origin==='original');}
 for(const [key,min] of [['conflict',15],['incident',10],['gimmick',10],['twist',10]])assert.ok(DATA[key].filter(x=>x.origin==='new'&&x.tones.includes(1)).length>=min);
});
test('strict tone and stage, locks, no-op settings, individual world does not roll others',()=>{
 const s=emptyState();s.settings.stage='scifi';s.settings.tone=1;rollFields(s,undefined,{rng:()=>0.25});
 assert.ok(s.items.world.stageTags.includes('scifi'));for(const [key] of BASIC)assert.ok(s.items[key].tones.includes(1));
 editField(s,'conflict','遠慮しながらも頼ってみる','頼る');const old=clone(s.items);
 updateSettings(s,{tone:5,themes:['journey']});assert.deepEqual(s.items,old);
 rollFields(s,['world'],{rng:()=>0});assert.deepEqual(s.items.conflict,old.conflict);assert.deepEqual(s.items.incident,old.incident);
 rollFields(s);assert.deepEqual(s.items.conflict,old.conflict);
});
test('alternatives and shortage preserve state without retry loops',()=>{
 const s=emptyState();rollFields(s,undefined,{rng:()=>0});const before=clone(s.items);rollFields(s,undefined,{rng:()=>0});for(const [k] of BASIC)assert.notEqual(s.items[k].candidateId,before[k].candidateId);
 const one={world:[DATA.world[0]]};s.items.world={...DATA.world[0],candidateId:DATA.world[0].id};s.settings.tone=1;
 assert.equal(rollFields(s,['world'],{data:one}).changed,0);s.settings.tone=5;assert.equal(rollFields(s,['world'],{data:one}).changed,0);
});
test('OR theme weighting and recent penalty with fixed randomness',()=>{
 const s=emptyState();s.settings.themes=['buddy','mystery'];const a={id:'a',stageTags:[],themeTags:['buddy'],tones:[]},b={...a,id:'b',themeTags:[]};
 assert.equal(weightFor(a,s,'incident')/weightFor(b,s,'incident'),3);
 const c={...a,themeTags:['buddy','mystery']};assert.equal(weightFor(c,s,'incident'),weightFor(a,s,'incident'));
 assert.equal(weightedPick([a,b],x=>weightFor(x,s,'incident'),()=>0.7).id,'a');assert.equal(weightedPick([a,b],x=>weightFor(x,s,'incident'),()=>0.8).id,'b');
 assert.ok(weightFor(a,s,'incident',['a'])<weightFor(a,s,'incident'));
});
test('history deep copies generated text, locks and branches; no-op edit adds nothing',()=>{
 const s=emptyState();rollFields(s);refreshTexts(s);const h=new History(s);editField(s,'world','<b>自分の世界</b>');refreshTexts(s);h.record(s);const changed=clone(s);s.items.world.text='後から変更';
 const undone=h.undo();assert.notEqual(undone.items.world.text,changed.items.world.text);assert.deepEqual(h.redo(),changed);
 h.undo();h.record({...undone,metadata:{name:'別案',tags:[],notes:''}});assert.equal(h.canRedo,false);
 const current=h.snapshots[h.index];assert.equal(h.record(current),false);
 const limit=new History(emptyState());for(let i=0;i<30;i++)limit.record({...emptyState(),metadata:{name:String(i),tags:[],notes:''}});assert.equal(limit.snapshots.length,20);
});
test('all purposes handle sentences, group relations and long custom text without forced particles',()=>{
 const s=emptyState();rollFields(s,undefined,{rng:()=>0.25});editField(s,'relation','秘密結社の仲間たち');editField(s,'incident','神託が下る');editField(s,'world','長い文章'.repeat(30));editField(s,'conflict','二人の時間を増やしたいが互いの仕事も大切にしたい','時間と仕事');
 for(const purpose of PURPOSES){s.settings.purpose=purpose;refreshTexts(s,{rng:()=>0});const all=[s.texts.summary,s.texts.memo,s.texts.hint,...s.texts.titles].join('\n');assert.ok(s.texts.memo.includes(s.items.conflict.text));const templateOnly=Object.values(s.items).filter(Boolean).reduce((text,item)=>text.replaceAll(item.text,'〈素材〉'),all);assert.doesNotMatch(templateOnly,/undefined|二人/);assert.doesNotMatch(all,/神託が下る」が起き/);assert.equal(new Set(s.texts.titles).size,3);assert.ok(s.texts.titles.every(x=>!x.includes('長い文章')));}
});
test('legacy migration preserves metadata, text, numeric ID, favorites; runs only once',()=>{
 const store=memoryStorage(),legacy={items:{world:{text:'削除済みの候補',tags:['wafu'],tones:[3],titleWord:'旧語'}},locks:{world:true},tone:3,texts:{summary:'旧要約',memo:'旧メモ',hint:'旧ヒント',titles:['旧題']},id:123,date:'2026/07/10 10:00',fav:true};
 store.setItem(OLD_KEYS[0],JSON.stringify(legacy));store.setItem(OLD_KEYS[1],JSON.stringify([legacy]));const repo=new Repository(store),loaded=repo.load();
 assert.equal(loaded.current.texts.summary,'旧要約');assert.equal(loaded.current.items.world.source,'legacy');assert.deepEqual(loaded.current.items.world.stageTags,['wafu']);assert.equal(repo.works[0].id,123);assert.equal(repo.works[0].fav,true);assert.equal(loaded.current.locks.world,true);assert.ok(store.getItem(BACKUP_KEY));assert.ok(store.getItem(OLD_KEYS[0]));
 const again=new Repository(store);again.load();assert.equal(again.works.length,1);assert.equal(again.works[0].id,123);
});
test('bad legacy record and backup failure protect originals and stop writes',()=>{
 const store=memoryStorage();store.setItem(OLD_KEYS[1],'[{"items":{"world":{"text":42}}}]');const original=store.getItem(OLD_KEYS[1]);const repo=new Repository(store);assert.ok(repo.load().warnings.length);assert.equal(repo.blocked,true);assert.equal(store.getItem(OLD_KEYS[1]),original);assert.equal(store.getItem(STORAGE_KEY),null);assert.throws(()=>repo.write(emptyState()));
 const fail=memoryStorage();fail.setItem(OLD_KEYS[1],'[]');fail.setItem=()=>{throw new Error('quota');};const second=new Repository(fail);second.load();assert.ok(second.blocked);assert.equal(fail.getItem(OLD_KEYS[1]),'[]');
});
test('storage failures never mutate works; full JSON roundtrip and untrusted types rejected',()=>{
 const store=memoryStorage(),repo=new Repository(store),s=emptyState();rollFields(s);refreshTexts(s);editField(s,'world','<img src=x onerror=alert(1)>','文字列');s.metadata.notes='メモ';repo.load();const saved=repo.save(s);const first=clone(repo.works);
 store.setItem=()=>{throw new Error('quota');};assert.throws(()=>repo.save(saved,{overwrite:true}));assert.deepEqual(repo.works,first);
 const imported=inspectImport(exportJSON(saved));assert.deepEqual(imported[0].state.items,saved.items);assert.equal(imported[0].state.metadata.notes,'メモ');
 assert.throws(()=>inspectImport('{'));assert.throws(()=>inspectImport('{"app":"creative-idea-gacha","schemaVersion":999,"works":[]}'));
 const broken=JSON.parse(exportJSON(saved));broken.works[0].state.locks.world='true';assert.throws(()=>inspectImport(JSON.stringify(broken)));
});
