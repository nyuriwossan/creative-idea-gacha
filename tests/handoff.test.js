import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,rollFields,refreshTexts,clone,editField,History} from '../js/core.js';
import {buildAIHandoff,characterCount} from '../js/ai-handoff.js';
import {validateHandoff} from '../js/handoff-options.js';
import {validateState,exportJSON,inspectImport} from '../js/storage.js';
import {prepareDrafts} from '../js/drafts.js';
const seed=()=>{const s=emptyState();rollFields(s,undefined,{rng:()=>0.31});refreshTexts(s,{rng:()=>0.4});return s;};
test('A all eight handoffs are standalone, pure, optional-free and contain no internal identifiers',()=>{
 const s=seed(),before=clone(s);for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){const text=buildAIHandoff(s,{purpose,length});for(const heading of ['今回の依頼','素材・設定の扱い','依頼する出力'])assert.ok(text.includes(heading));for(const item of Object.values(s.items).filter(Boolean)){assert.ok(text.includes(item.text));assert.ok(!text.includes(item.candidateId));}assert.doesNotMatch(text,/undefined|null|source|topicTags|未設定/);if(purpose==='chat')assert.match(text,/本編は開始しない/);if(length==='detail')assert.match(text,/構成上の参考案/);}assert.deepEqual(s,before);assert.equal(characterCount('あ😀\n'),3);
});
test('A author intent, legacy, uncertainty, hidden answers and long opt-in notes remain intact',()=>{
 const s=seed();editField(s,'incident','<script>資料です</script>\n😀「引用」','引用');s.locks.incident=false;s.items.gimmick.source='legacy';s.locks.conflict=true;s.characters.protagonist.name='楓';s.questions.consistency=[{id:'q-private',text:'選ぶのは？',answer:'AかBで迷う',locked:false},{id:'q-empty',text:'未回答の質問',answer:'',locked:false}];s.metadata.notes='長'.repeat(9998)+'末尾';const before=clone(s),short=buildAIHandoff(s,{purpose:'chat',includeNotes:true}),off=buildAIHandoff(s,{includeNotes:false,preserveAll:false,suggestMissing:false});assert.ok(short.includes(s.metadata.notes));assert.ok(short.includes('AかBで迷う'));assert.ok(!short.includes('未回答の質問'));assert.ok(!off.includes(s.metadata.notes));assert.match(short,/保持したい設定/);assert.match(short,/現在表示されている素材/);assert.match(off,/変更案と理由/);assert.match(off,/最大3件/);assert.deepEqual(s,before);
});
test('A roles validate without mutating inputs and ensemble never controls user actions',()=>{
 const s=seed();assert.throws(()=>buildAIHandoff(s,{purpose:'chat',userRole:'protagonist',aiRole:'protagonist'}),/同じ人物/);const text=buildAIHandoff(s,{purpose:'chat',userRole:'counterpart',aiRole:'ensemble',extraRequest:'短い紹介も希望'});assert.match(text,/ユーザーが担当する人物：相手役/);assert.match(text,/AIが担当する範囲：複数人物/);assert.match(text,/行動は代行しない/);assert.match(text,/短い紹介も希望/);for(const raw of [{purpose:'bad'},{length:'bad'},{preserveAll:1},{userRoleText:'あ'.repeat(101)},{extraRequest:'あ'.repeat(2001)}])assert.throws(()=>validateHandoff(raw));
});
test('A handoff settings roundtrip and old v2 defaults preserve all saved prose',()=>{
 const s=seed();s.handoff={...s.handoff,purpose:'chat',length:'detail',userRole:'other',userRoleText:'近所の住人',aiRole:'ensemble'};assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);const old=clone(s);delete old.handoff;const restored=validateState(old);assert.equal(restored.handoff.purpose,null);assert.deepEqual(restored.texts,old.texts);const h=new History(s),next=clone(s);next.handoff.purpose='setting';h.record(next);assert.deepEqual(h.undo(),s);
});
test('A pending handoff errors abort all drafts; option-only changes never regenerate saved prose',()=>{
 const s=seed(),old=clone(s);assert.throws(()=>prepareDrafts(s,{fields:[{key:'world',text:'新しい町',titleWord:'町'}],handoff:{...s.handoff,purpose:'chat',userRole:'protagonist',aiRole:'protagonist'}}));assert.deepEqual(s,old);s.texts.memo='過去に保存した構成文';const next=prepareDrafts(s,{handoff:{...s.handoff,length:'detail'}});assert.equal(next.texts.memo,s.texts.memo);assert.deepEqual(next.texts.titles,s.texts.titles);
});
