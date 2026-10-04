import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState,rollFields,refreshTexts,clone } from '../js/core.js';
import { Repository,STORAGE_KEY,OLD_KEYS,exportJSON,inspectImport,filterWorks,MAX_BYTES,MAX_WORKS } from '../js/storage.js';
function memoryStorage(){const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};}
function seed(){const s=emptyState();rollFields(s);refreshTexts(s);return s;}
test('save, overwrite and clone IDs; loaded work remains independent until explicit overwrite',()=>{
 const repo=new Repository(memoryStorage());repo.load();const s=seed();s.metadata={name:'星の店',tags:['SF'],notes:'気になるメモ'};const a=repo.save(s);const original=clone(repo.works[0]);
 const loaded=clone(original.state);loaded.loadedWorkId=original.id;loaded.metadata.notes='変更したメモ';assert.deepEqual(repo.works[0],original);
 const updated=repo.save(loaded,{overwrite:true});assert.equal(updated.loadedWorkId,original.id);assert.equal(repo.works.length,1);assert.equal(repo.works[0].state.metadata.notes,'変更したメモ');
 const separate=repo.save(updated);assert.notEqual(separate.loadedWorkId,a.loadedWorkId);assert.equal(repo.works.length,2);
 const duplicate=repo.duplicate(a.loadedWorkId,separate);assert.notEqual(duplicate.loadedWorkId,a.loadedWorkId);assert.equal(repo.works.length,3);duplicate.metadata.notes='複製の編集';assert.equal(repo.works[0].state.metadata.notes,'変更したメモ');
 repo.favorite(original.id,duplicate);assert.equal(filterWorks(repo.works,'星の店',true).length,1);assert.equal(filterWorks(repo.works,'変更したメモ').length,3);assert.equal(filterWorks(repo.works,'SF').length,3);
});
test('JSON import validates whole batch and ID collisions always add rather than replace',()=>{
 const repo=new Repository(memoryStorage());repo.load();const s=repo.save(seed());const backup=exportJSON(s,repo.works),incoming=inspectImport(backup);repo.addImported([...incoming,...incoming],s);
 assert.equal(repo.works.length,3);assert.equal(new Set(repo.works.map(w=>w.id)).size,3);
 const bad=JSON.parse(backup);bad.works.push({...bad.works[0],state:{...bad.works[0].state,metadata:{name:42,tags:[],notes:''}}});const before=clone(repo.works);assert.throws(()=>inspectImport(JSON.stringify(bad)));assert.deepEqual(repo.works,before);
 const poison=JSON.parse(backup);poison.works[0].state.items.world.__proto__={polluted:true};poison.works[0].state.metadata.extra='ignored';const clean=inspectImport(JSON.stringify(poison));assert.equal(clean[0].state.metadata.extra,undefined);assert.equal({}.polluted,undefined);
 assert.throws(()=>inspectImport(' '.repeat(MAX_BYTES+1)));const many=JSON.parse(backup);many.works=Array(MAX_WORKS+1).fill(many.works[0]);assert.throws(()=>inspectImport(JSON.stringify(many)));
});
test('save/favorite/delete/import quota errors all preserve works',()=>{
 const store=memoryStorage(),repo=new Repository(store);repo.load();const s=repo.save(seed()),snapshot=clone(repo.works),raw=store.getItem(STORAGE_KEY);
 store.setItem=()=>{throw new Error('quota');};for(const action of [()=>repo.save(s),()=>repo.favorite(s.loadedWorkId,s),()=>repo.remove(s.loadedWorkId,s),()=>repo.addImported(snapshot,s)]){assert.throws(action);assert.deepEqual(repo.works,snapshot);assert.equal(store.getItem(STORAGE_KEY),raw);}
});
test('legacy arrays import without re-generation or truncation; full locks and saved text survive',()=>{
 const old={id:5,date:'2026/7/10 12:30',fav:true,tone:4,purpose:'世界観メモ',items:{world:{text:'長い旧データ'.repeat(200),tags:['wafu'],tones:[],titleWord:'旧題'}},locks:{world:true,genre:true,relation:true,incident:true,conflict:true,gimmick:true,twist:true},texts:{summary:'旧本文',memo:'旧メモ',hint:'旧ヒント',titles:['旧タイトル']}};
 const store=memoryStorage();store.setItem(OLD_KEYS[0],JSON.stringify(old));store.setItem(OLD_KEYS[1],JSON.stringify([old]));const repo=new Repository(store),loaded=repo.load();assert.equal(loaded.current.items.world.text,old.items.world.text);assert.equal(loaded.current.settings.stage,'all');assert.equal(loaded.current.texts.summary,'旧本文');assert.deepEqual(loaded.current.locks.world,true);
 const imported=inspectImport(JSON.stringify([old]));assert.equal(imported[0].state.items.world.text,old.items.world.text);assert.equal(imported[0].id,5);assert.equal(imported[0].fav,true);
});
test('500-work limit keeps existing works; unknown stored version remains untouched',()=>{
 const store=memoryStorage(),repo=new Repository(store);repo.load();repo.works=Array.from({length:500},(_,i)=>({id:String(i)}));assert.throws(()=>repo.save(seed()));assert.equal(repo.works.length,500);
 const raw='{"schemaVersion":999,"works":[]}';store.setItem(STORAGE_KEY,raw);const future=new Repository(store);assert.ok(future.load().warnings.length);assert.equal(future.blocked,true);assert.equal(store.getItem(STORAGE_KEY),raw);
});
