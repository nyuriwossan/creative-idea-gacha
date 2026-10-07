import test from 'node:test';
import assert from 'node:assert/strict';
import {MODERN_PRESETS,tryModernPreset,presetDescription} from '../js/presets.js';
import {MODERN_PRO_QUESTIONS} from '../js/modern-pro-questions.js';
import {DATA,THEMES,BASIC} from '../js/data.js';
import {EXTRA_DATA,QUESTION_DATA} from '../js/extra-data.js';
import {emptyState,rollFields,editField,History,refreshTexts,markdown} from '../js/core.js';
import {CONTEXTS,worldContext,meetsContext} from '../js/context.js';
import {prepareDrafts,DraftError} from '../js/drafts.js';
import {drawQuestions} from '../js/questions.js';
import {validateState,exportJSON,inspectImport} from '../js/storage.js';
import {buildAIHandoff} from '../js/ai-handoff.js';
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const generated=(s,w)=>rollFields(s,['world'],{data:{world:[w]},rng:()=>0});
test('seven preset definitions contain replace-only <=3 themes and selection descriptions cannot mutate state',()=>{
 assert.equal(MODERN_PRESETS.length,7);assert.deepEqual(MODERN_PRESETS.map(p=>p.label),['現代の恋人','秘密の社内恋愛','仕事と恋愛の両立','警察と事件','教師と学校の仕事','医療と夜勤','会社の再建']);
 for(const p of MODERN_PRESETS){assert.ok(p.themes.length<=3);assert.ok(p.themes.every(t=>THEMES.some(([id])=>id===t)));assert.ok(p.requiresContext.every(t=>CONTEXTS.some(([id])=>id===t)));assert.match(presetDescription(p.id),/今回/);}
 assert.throws(()=>tryModernPreset(emptyState(),{},'unknown'));assert.throws(()=>presetDescription('unknown'));
 assert.equal(presetDescription(''),'選んでいません。選ぶと、その方向の世界観条件で一度だけ引けます。');
});
test('all seven presets at five tones in both modes preserve usage and fixed/optional data, with a single undoable operation',()=>{
 const originalData=JSON.stringify(DATA);
 for(const p of MODERN_PRESETS)for(let tone=1;tone<=5;tone++)for(const coherence of ['cohesive','mix']){
  const s=emptyState();Object.assign(s.settings,{stage:'all',tone,coherence,themes:['buddy','journey','romance'],purpose:'漫画1話向け'});rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(4)});editField(s,'conflict','作者が保持したい選択','選択');editField(s,'scene.goal','入口に残す共同作業','作業');s.questions.consistency=[{id:'q-old',text:'未決は？',answer:'作者が考える',locked:true}];const recent={conflict:['old-value']},before=structuredClone(s),oldRecent=structuredClone(recent),history=new History(s);
  const r=tryModernPreset(s,recent,p.id,{rng:rngFor(71)});assert.ok(r.ok,p.id+tone);assert.deepEqual(s,before);assert.deepEqual(recent,oldRecent);assert.equal(r.state.settings.stage,'modern');assert.equal(r.state.settings.tone,tone);assert.equal(r.state.settings.coherence,coherence);assert.equal(r.state.settings.purpose,'漫画1話向け');assert.deepEqual(r.state.settings.themes,p.themes);assert.ok(p.requiresContext.every(t=>worldContext(r.state).includes(t)));assert.deepEqual(r.state.items.conflict,before.items.conflict);assert.deepEqual(r.state.items['scene.goal'],before.items['scene.goal']);assert.deepEqual(r.state.questions,before.questions);assert.deepEqual(r.state.characters,before.characters);
  refreshTexts(r.state,{rng:rngFor(3)});history.record(r.state);assert.equal(history.snapshots.length,2);assert.deepEqual(history.undo(),before);assert.deepEqual(history.redo(),r.state);
 }
 assert.equal(JSON.stringify(DATA),originalData);
});
test('fixed generated worlds reject missing profession background and stage mismatch without mutating state/recent/history',()=>{
 for(const stage of ['modern','fantasy']){const s=emptyState();generated(s,DATA.world.find(w=>w.stageTags.includes(stage)&&!w.contextTags.includes('medical')&&w.tones.includes(3)));s.locks.world=true;const before=structuredClone(s),recent={world:['before']},history=new History(s);const r=tryModernPreset(s,recent,'medical');assert.equal(r.ok,false);assert.match(r.reason,/固定中/);assert.deepEqual(s,before);assert.deepEqual(recent,{world:['before']});assert.equal(history.snapshots.length,1);}
 const s=emptyState();generated(s,DATA.world.find(w=>w.stageTags.includes('modern')&&w.contextTags.includes('medical')&&w.tones.includes(3)));s.locks.world=true;const w=structuredClone(s.items.world),r=tryModernPreset(s,{},'medical');assert.ok(r.ok);assert.deepEqual(r.state.items.world,w);
});
test('custom world uses only author background and original all/modern stage, with no text inference',()=>{
 for(const stage of ['all','modern','western','school']){const s=emptyState();s.settings.stage=stage;editField(s,'world','人間の医療チームを描く作者の世界','世界',['medical']);const before=structuredClone(s),r=tryModernPreset(s,{},'medical');assert.equal(r.ok,['all','modern'].includes(stage));assert.deepEqual(s,before);if(r.ok){assert.deepEqual(r.state.items.world,s.items.world);assert.equal(r.state.settings.stage,'modern');}}
 const s=emptyState();editField(s,'world','会社・医療・学校・警察がある現代の都市','都市',[]);assert.equal(tryModernPreset(s,{},'medical').ok,false);assert.equal(tryModernPreset(s,{},'lovers').ok,true);
});
test('shortage respects previous exclusion and tone; completed authored drafts survive a canceled trial',()=>{
 const s=emptyState();const w=DATA.world.find(w=>w.tones.includes(3)&&w.contextTags.includes('company')&&w.stageTags.includes('modern'));generated(s,w);const recent={world:[w.id]},before=structuredClone(s);const r=tryModernPreset(s,recent,'company',{data:{...EXTRA_DATA,world:[w]}});assert.equal(r.ok,false);assert.match(r.reason,/直前/);assert.deepEqual(s,before);assert.deepEqual(recent,{world:[w.id]});
 const author=prepareDrafts(s,{fields:[{key:'incident',text:'作者の新しい事件',titleWord:'事件',contextTags:[]}]});const canceled=tryModernPreset(author,recent,'medical',{data:{...EXTRA_DATA,world:[]}});assert.equal(canceled.ok,false);assert.equal(author.items.incident.text,'作者の新しい事件');assert.deepEqual(author.settings,s.settings);assert.throws(()=>prepareDrafts(s,{fields:[{key:'incident',text:'長'.repeat(501),titleWord:'事件'}]}),DraftError);assert.deepEqual(s,before);
});
test('preset attempt never adds context facts or a persistent filter; ordinary draws use the original DATA',()=>{
 const s=emptyState(),r=tryModernPreset(s,{},'medical',{rng:rngFor(4)});assert.ok(r.ok);assert.equal(Object.hasOwn(r.state,'preset'),false);assert.deepEqual(validateState(r.state),r.state);const plain=DATA.world.find(w=>w.stageTags.includes('modern')&&w.tones.includes(3)&&!w.contextTags.length);const worlds=[plain,DATA.world.find(w=>w.stageTags.includes('modern')&&w.tones.includes(3)&&w.contextTags.includes('company'))];rollFields(r.state,['world'],{data:{...EXTRA_DATA,world:[plain]},rng:()=>0});assert.equal(r.state.items.world.candidateId,plain.id);assert.deepEqual(r.state.items.world.contextTags,[]);
});
test('fixed profession-incompatible items remain intact with a notice while other preset items can change',()=>{
 const s=emptyState();editField(s,'conflict','作者の保持したい葛藤','葛藤');s.items.conflict.requiresContext=['medical'];const old=structuredClone(s.items.conflict),r=tryModernPreset(s,{},'police',{rng:rngFor(5)});assert.ok(r.ok);assert.deepEqual(r.state.items.conflict,old);assert.match(r.notices.join('\n'),/固定中の葛藤.*医療現場/);
});
test('twelve stable appended questions obey context and conditional wording while preserving answers and original position IDs',()=>{
 assert.equal(Object.values(MODERN_PRO_QUESTIONS).flat().length,12);assert.equal(new Set(Object.values(MODERN_PRO_QUESTIONS).flat().map(q=>q.id)).size,12);
 for(const [category,rows] of Object.entries(MODERN_PRO_QUESTIONS)){assert.equal(QUESTION_DATA[category].length,29);assert.deepEqual(QUESTION_DATA[category].slice(-3),rows);for(const q of rows){assert.ok(q.id.startsWith('mp-question-'+category+'-'));assert.equal(QUESTION_DATA[category].filter(r=>(typeof r==='string'?r:r.text)===q.text).length,1);for(const tag of q.themeTags)assert.ok(THEMES.some(([id])=>id===tag));}}
 for(const context of [[],['company'],['medical'],['police'],['education'],['company','medical']])for(const [category] of Object.entries(MODERN_PRO_QUESTIONS)){
  const s=emptyState();s.settings.themes=['workplace-pro'];editField(s,'world','作者の世界','世界',context);s.questions[category]=[{id:'question-'+category+'-1',text:'以前の質問',answer:'答えを残す',locked:false}];for(let seed=1;seed<=30;seed++){drawQuestions(s,category,{rng:rngFor(seed)});assert.equal(s.questions[category][0].answer,'答えを残す');for(const slot of s.questions[category]){const q=Object.values(MODERN_PRO_QUESTIONS).flat().find(q=>q.id===slot.id);if(q)assert.ok(meetsContext(q,context));}}
 }
 assert.match(MODERN_PRO_QUESTIONS.plot.find(q=>q.id.endsWith('couple-career')).text,/恋人がいる設定なら/);
});
test('new themes, professional contexts, questions and answers survive JSON and all eight handoffs with Japanese names',()=>{
 const s=tryModernPreset(emptyState(),{},'medical',{rng:rngFor(9)}).state;s.settings.themes=['modern-love','workplace-pro'];s.questions.character=[{...MODERN_PRO_QUESTIONS.character[2],answer:'本人が選ぶ範囲を確認する',locked:true}];delete s.questions.character[0].requiresContext;delete s.questions.character[0].themeTags;refreshTexts(s);assert.deepEqual(inspectImport(exportJSON(s))[0].state,s);assert.match(markdown(s),/医療現場/);for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){const text=buildAIHandoff(s,{purpose,length});assert.match(text,/医療現場/);assert.match(text,/本人が選ぶ範囲を確認する/);assert.doesNotMatch(text,/mp-workplace|modernProCategory|modernProBatch|undefined|null/);}
});
