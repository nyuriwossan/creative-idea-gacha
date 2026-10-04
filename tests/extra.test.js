import test from 'node:test';
import assert from 'node:assert/strict';
import { EXTRA_DATA,QUESTION_DATA } from '../js/extra-data.js';
import { emptyState,OPTIONAL,rollFields,clone,editField,refreshTexts,markdown,QUESTION_CATEGORIES } from '../js/core.js';
import { drawQuestions,answerQuestion } from '../js/questions.js';
import { inspectImport,exportJSON } from '../js/storage.js';
test('each of ten optional pools >=20 and four question pools >=15; optional tone shortage explicit',()=>{
 for(const [key] of OPTIONAL){assert.ok(EXTRA_DATA[key].length>=(key.startsWith('scene.')?16:20));for(let tone=1;tone<=5;tone++)assert.ok(EXTRA_DATA[key].some(x=>x.tones.includes(tone)));}
 for(const [key] of QUESTION_CATEGORIES)assert.ok(QUESTION_DATA[key].length>=15);
});
test('basic draws leave optional fields empty; section draws respect locks and restored names',()=>{
 const s=emptyState();rollFields(s,undefined,{data:EXTRA_DATA});for(const [key] of OPTIONAL)assert.equal(s.items[key],null);
 editField(s,'protagonist.goal','自分の店を持ちたい','自分の店');s.characters.protagonist.name='葵';
 rollFields(s,OPTIONAL.slice(0,6).map(([k])=>k),{data:EXTRA_DATA,rng:()=>0});assert.equal(s.items['protagonist.goal'].text,'自分の店を持ちたい');assert.equal(s.items.deadline,null);refreshTexts(s);
 const imported=inspectImport(exportJSON(s))[0].state;assert.deepEqual(imported.characters,s.characters);assert.deepEqual(imported.items,s.items);
});
test('answers protect slots even when unlocked; category switch and draw preserve other categories',()=>{
 const s=emptyState();drawQuestions(s,'world',{rng:()=>0});const ids=s.questions.world.map(q=>q.id);assert.equal(new Set(ids).size,3);
 answerQuestion(s,'world',0,'<b>街の人たち</b>');s.questions.world[0].locked=false;
 const protectedSlot=clone(s.questions.world[0]);drawQuestions(s,'world',{rng:()=>0});assert.deepEqual(s.questions.world[0],protectedSlot);assert.notEqual(s.questions.world[1].id,ids[1]);
 drawQuestions(s,'character');assert.deepEqual(s.questions.world[0],protectedSlot);
 const plain=s.questions.world[0].text;s.settings.tone=5;refreshTexts(s);assert.equal(s.questions.world[0].text,plain);
 const imported=inspectImport(exportJSON(s))[0].state;assert.deepEqual(imported.questions,s.questions);s.metadata.notes='自分の続き';assert.ok(markdown(s).includes('<b>街の人たち</b>'));assert.ok(markdown(s).includes('自分の続き'));
});
test('all three protected explains no-op; explicit clear rerolls only selected slot',()=>{
 const s=emptyState();drawQuestions(s,'world');for(let i=0;i<3;i++)answerQuestion(s,'world',i,`回答${i}`);assert.equal(drawQuestions(s,'world').changed,0);
 const old=clone(s.questions.world);drawQuestions(s,'world',{index:1,clearAnswer:true});assert.deepEqual(s.questions.world[0],old[0]);assert.equal(s.questions.world[1].answer,'');assert.equal(s.questions.world[1].locked,false);
 assert.throws(()=>answerQuestion(s,'world',1,'a'.repeat(2001)));
});
