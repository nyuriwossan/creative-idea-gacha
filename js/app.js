import {coreForField} from './seed-core.js';
import {STAGE_PAIRS,stagePairKey,stageLabel,settingsForPair} from './stage-selection.js';
import {mixReport,mixBadge} from './stage-mix.js';
import {worldContext} from './context.js';
import {buildAIHandoff,characterCount} from './ai-handoff.js';
import {HANDOFF_PURPOSES,validateHandoff} from './handoff-options.js';
import { BASIC,STAGES,TONES,PURPOSES,THEMES } from './data.js';
import { EXTRA_DATA } from './extra-data.js';
import { emptyState,FIELDS,OPTIONAL,CHARACTER_FIELDS,PROGRESSION_FIELDS,SCENE,QUESTION_CATEGORIES,clone,rollFields,editField,updateSettings,refreshTexts,History,markdown } from './core.js';
import { Repository,exportJSON,inspectImport,filterWorks,MAX_BYTES,MAX_WORKS } from './storage.js';
import { drawQuestions } from './questions.js';
import { CONTEXTS,PACKS,contextLabels } from './context.js';
import {prepareDrafts,DraftError} from './drafts.js';
import {BackupStatus} from './backup.js';
import {MODERN_PRESETS,presetDescription,tryModernPreset} from './presets.js';
const $=id=>document.getElementById(id);
const node=(tag,className='',text='')=>{const el=document.createElement(tag);el.className=className;el.textContent=text;return el;};
const button=(text,handler,className='')=>{const el=node('button',className,text);el.type='button';el.addEventListener('click',()=>guard(handler));return el;};
const cards=new Map(),questionCards=new Map(),questionDrafts=new Map(),dirtyInputs=new Set();
let handoffDraft={};
const recent={};let questionCategory='world',pendingImport=null,toastTimer,composing=false;
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw new Error('ブラウザが保存領域を利用できません。');},setItem(){throw new Error('保存領域を利用できません。');}};}
const repository=new Repository(storage),initial=repository.load();
const backup=new BackupStatus(storage,repository.works);
let state=initial.current||emptyState();
if(!initial.current){rollFields(state,undefined,{data:EXTRA_DATA,recent});refreshTexts(state);}
const history=new History(state);
function showToast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
function storageWarning(message){$('storageWarning').textContent=message;$('storageWarning').hidden=false;}
function persist(){try{repository.write(state);if(!repository.blocked)$('storageWarning').hidden=true;}catch(e){storageWarning(e.message);}}
async function guard(fn){if(composing){$('actionWarning').textContent='日本語の変換を確定してから操作してください。';$('actionWarning').hidden=false;return;}try{$('actionWarning').hidden=true;await fn();}catch(e){const message=e.message||'操作を完了できませんでした。';$('actionWarning').textContent=message;$('actionWarning').hidden=false;showToast(message);}}
function commit(fn,{output=false,randomize=false,titlesOnly=false,notice=''}={}){
 const draft=clone(state),result=fn(draft);
 if(result?.notices){$('drawNotice').textContent=result.notices.join('\n');$('drawNotice').hidden=!result.notices.length;}
 else if(JSON.stringify(draft.settings)!==JSON.stringify(state.settings)||JSON.stringify(draft.items.world)!==JSON.stringify(state.items.world))$('drawNotice').hidden=true;
 if(result?.aborted){showToast(result.notices.join('\n'));return result;}
 if(result?.changed>0)$('stageMixPending').hidden=true;
 if(result===false||(result?.changed===0&&JSON.stringify(draft)===JSON.stringify(state))){if(result?.notices?.length)showToast(result.notices.join('\n'));else if(result?.notice)showToast(result.notice);return result;}
 if(output)refreshTexts(draft,{randomize,titlesOnly});
 if(JSON.stringify(draft)!==JSON.stringify(state)){state=draft;history.record(state);persist();render();}
 if(result?.notices?.length)showToast(result.notices.join('\n'));
 else if(result?.notice)showToast(result.notice);
 else if(notice)showToast(notice);
 return result;
}
function bind(id,fn){$(id).addEventListener('click',()=>guard(fn));}
function setOptions(id,options){for(const [value,label] of options){const option=node('option','',label);option.value=value;$(id).append(option);}}
function errorFor(input,error,message){error.textContent=message;input.setAttribute('aria-invalid',String(Boolean(message)));return !message;}
function makeField(key,label,container,optional){
 const safeKey=key.replaceAll('.','-'),card=node('article','field-card');card.dataset.key=key;
 const head=node('div','card-head'),heading=node('span','field-label',label),source=node('span','source-label');head.append(heading,source);
 const example=node('details','seed-example'),exampleToggle=node('summary','','具体例を見る'),exampleBody=node('p','example-body');example.append(exampleToggle,exampleBody);example.hidden=true;
 const value=node('p','field-value'),actions=node('div','field-actions');
 const roll=button('引き直す',()=>{
  const result=commit(draft=>rollFields(draft,[key],{data:EXTRA_DATA,recent}),{output:true,randomize:true});
  if(key==='world'&&result?.changed&&!result.notices.length)showToast('世界観を引き直しました。他の項目も合わせたいときは「固定していない項目を引く」を使えます。');
 });roll.setAttribute('aria-label',`${label}を引き直す`);
 const lock=button('固定',()=>commit(draft=>{draft.locks[key]=!draft.locks[key];}));lock.setAttribute('aria-label',`${label}の固定を切り替える`);
 const editor=node('div','editor');editor.id=`editor-${safeKey}`;editor.hidden=true;
 const contextInputs=[];
 const selectedContexts=()=>contextInputs.filter(c=>c.checked).map(c=>c.value);
 let baseline=null;
 const readEditor=()=>({key,text:text.value,titleWord:short.value,contextTags:selectedContexts()});
 const isDirty=()=>!editor.hidden&&baseline!==JSON.stringify(readEditor());
 const edit=button('編集',()=>{if(!editor.hidden){text.focus();return;}text.value=state.items[key]?.text||'';short.value=state.items[key]?.titleWord||'';for(const input of contextInputs)input.checked=state.items[key]?.source==='custom'&&(state.items[key].contextTags||[]).includes(input.value);baseline=JSON.stringify(readEditor());editor.hidden=false;edit.setAttribute('aria-expanded','true');validateEditor();text.focus();});edit.setAttribute('aria-label',`${label}を編集`);edit.setAttribute('aria-expanded','false');edit.setAttribute('aria-controls',editor.id);
 const textLabel=node('label','',`${label}の本文 `),count=node('span','input-count');textLabel.append(count);
 const text=node('textarea');text.id=`input-${safeKey}`;text.rows=3;textLabel.htmlFor=text.id;const inputError=node('span','input-error');inputError.id=`error-${safeKey}`;inputError.setAttribute('aria-live','polite');text.setAttribute('aria-describedby',inputError.id);
 const shortLabel=node('label','','タイトル用の短い言葉（任意 / 30文字まで）'),short=node('input');short.type='text';short.id=`short-${safeKey}`;shortLabel.htmlFor=short.id;
 const shortError=node('span','input-error');shortError.id=`short-error-${safeKey}`;short.setAttribute('aria-describedby',shortError.id);shortError.setAttribute('aria-live','polite');
 function validateEditor(){count.textContent=`${text.value.length} / 500文字`;const ok1=errorFor(text,inputError,!text.value.trim()?'本文を入力してください。':text.value.length>500?'500文字を超えています。短くしてから反映してください。':'');const ok2=errorFor(short,shortError,short.value.length>30?'30文字までで入力してください。':'');return ok1&&ok2;}
 text.addEventListener('input',validateEditor);short.addEventListener('input',validateEditor);
 const editActions=node('div','inline-actions');
 const close=()=>{editor.hidden=true;edit.setAttribute('aria-expanded','false');edit.focus();renderHandoff();};
 editActions.append(button('反映',()=>{if(!isDirty()){close();return;}if(!validateEditor())return;commit(draft=>editField(draft,key,text.value,short.value,selectedContexts()),{output:true,randomize:false});close();}),button('キャンセル',close));
 if(optional)editActions.append(button('未設定に戻す',()=>{commit(draft=>{draft.items[key]=null;draft.locks[key]=false;},{output:true});close();},'text-btn'));
 editor.append(textLabel,text,inputError,shortLabel,short,shortError);
 if(key==='world'){
  const background=node('fieldset','background-editor'),legend=node('legend','','この世界にある要素（任意）');
  const hint=node('p','note','文章からは自動判定しません。手入力の世界で、実際にある要素を選んでください。候補の背景は自動で引き継ぎません。');
  const options=node('div','context-options');
  for(const [id,name] of CONTEXTS){const label=node('label','context-option'),input=node('input');input.type='checkbox';input.value=id;input.id=`context-${id}`;label.append(input,document.createTextNode(name));options.append(label);contextInputs.push(input);}
  background.append(legend,hint,options);editor.append(background);
 }
 const badges=node('div','material-badges');
 editor.append(editActions);actions.append(roll,lock,edit);card.append(head);if(key==='world')card.append(node('p','note world-help','時代・社会・暮らしの前提です。人物や事件は、ほかのお題と組み合わせて決められます。'));card.append(value,example,badges,actions,editor);$(container).append(card);
 cards.set(key,{card,value,example,exampleBody,source,roll,lock,edit,editor,text,short,contextInputs,selectedContexts,badges,inputError,shortError,isDirty,readEditor});
}
function makeQuestions(category){
 const panel=node('div');panel.dataset.category=category;
 const empty=node('p','note','まだ質問はありません。「質問を3つ出す」で始められます。');panel.append(empty);
 const slots=[];
 for(let index=0;index<3;index++){
  const card=node('article','question-slot'),heading=node('h4'),label=node('label','',`質問${index+1}への回答（2,000文字まで）`),input=node('textarea');input.rows=3;input.id=`answer-${category}-${index}`;label.htmlFor=input.id;
  const error=node('span','input-error');error.id=`answer-error-${category}-${index}`;error.setAttribute('aria-live','polite');input.setAttribute('aria-describedby',error.id);
  const draftKey=`${category}:${index}`;
  input.addEventListener('input',()=>{const pending=questionDrafts.get(draftKey),slot=pending?.slot||state.questions[category][index];if(input.value===slot.answer)questionDrafts.delete(draftKey);else questionDrafts.set(draftKey,{value:input.value,slot:clone(slot),group:pending?.group||clone(state.questions[category])});errorFor(input,error,input.value.length>2000?'回答は2,000文字までです。短くしてから反映してください。':'');});
  const actions=node('div','inline-actions');
  const apply=button('回答を反映',()=>{if(!errorFor(input,error,input.value.length>2000?'回答は2,000文字までです。':''))return;commit(draft=>{const pending=questionDrafts.get(draftKey);const next=prepareDrafts(draft,{answers:[{category,index,value:input.value,...(pending&&draft.questions[category][index]?.id!==pending.slot.id?{slot:pending.slot,group:pending.group}:{})}]});Object.assign(draft,next);});questionDrafts.delete(draftKey);renderQuestions();renderHandoff();showToast('回答を反映しました。');});
  const lock=button('固定',()=>commit(draft=>{draft.questions[category][index].locked=!draft.questions[category][index].locked;}));
  const reroll=button('この質問を引き直す',()=>{if(questionDrafts.has(draftKey)){showToast('編集中の回答は残しました。先に「回答を反映」してください。');return;}commit(draft=>drawQuestions(draft,category,{index}));});
  const clear=button('回答を消して引き直す',async()=>{const pending=questionDrafts.get(draftKey);const choice=await decide('回答を消して引き直しますか？',(pending?.slot||state.questions[category][index]).text,[['clear','回答を消して引き直す'],['cancel','キャンセル']]);if(choice!=='clear')return;commit(draft=>{if(pending&&draft.questions[category][index]?.id!==pending.slot.id)Object.assign(draft,prepareDrafts(draft,{answers:[{category,index,value:'',slot:pending.slot,group:pending.group}]}));return drawQuestions(draft,category,{index,clearAnswer:true});});questionDrafts.delete(draftKey);renderQuestions();renderHandoff();},'text-btn');
  lock.setAttribute('aria-label',`質問${index+1}の固定を切り替える`);actions.append(apply,lock,reroll,clear);card.append(heading,label,input,error,actions);panel.append(card);slots.push({card,heading,input,lock,clear,reroll,error});
 }
 $('questionFields').append(panel);questionCards.set(category,{panel,empty,slots});
}
const metaBindings=[
 ['workName','name',200],['workTags','tags',0],['workNotes','notes',10000],['protagonistName','protagonist',100],['counterpartName','counterpart',100]
];
function parseMeta(id,key,max){
 const input=$(id),value=input.value;let message='',parsed=value;
 if(key==='tags'){parsed=[...new Set(value.split(/[,、\n]/).map(x=>x.trim()).filter(Boolean))];if(parsed.length>10||parsed.some(x=>x.length>30))message='タグは最大10個、1個30文字までです。';}
 else if(value.length>max)message=`${max.toLocaleString()}文字までで入力してください。`;
 errorFor(input,$(`${id}Error`),message);if(message)throw new Error(message);
 return parsed;
}
function hasFieldDraft(){return [...cards.values()].some(c=>c.isDirty());}
function revealInput(input){for(let p=input.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;input.scrollIntoView({block:'center'});input.focus({preventScroll:true});}
function requireApplied({record=true}={}){
 const fields=[...cards.values()].filter(c=>c.isDirty()).map(c=>c.readEditor());
 const answers=[...questionDrafts].map(([key,pending])=>{const [category,index]=key.split(':');return {category,index:Number(index),value:pending.value,...(state.questions[category][index]?.id!==pending.slot.id?{slot:pending.slot,group:pending.group}:{})};});
 const metadata=metaBindings.filter(([id])=>dirtyInputs.has(id)).map(([id,key])=>({id,key,value:$(id).value}));
 let next;
 try{next=prepareDrafts(state,{fields,answers,metadata,handoff:{...state.handoff,...handoffDraft}});}catch(error){
  if(error instanceof DraftError){let first;
   for(const issue of error.errors){const [kind,key,part]=issue.target.split(':');let input,notice;
    if(kind==='field'){const c=cards.get(key);input=part==='short'?c.short:c.text;notice=part==='short'?c.shortError:c.inputError;}
    if(kind==='answer'){const c=questionCards.get(key).slots[Number(part)];input=c.input;notice=c.error;if(!first){questionCategory=key;$('questionCategory').value=key;renderQuestions();}}
    if(kind==='handoff'){input=$(key);notice=$('handoffError');$('handoffPanel').open=true;$('chatOptions').hidden=false;$('chatOptions').open=true;}
    if(kind==='meta'){input=$(key);notice=$(`${key}Error`);}
    if(input){errorFor(input,notice,issue.message);first??=input;}
   }if(first)revealInput(first);
  }throw error;
 }
 const changed=JSON.stringify(next)!==JSON.stringify(state);
 for(const c of cards.values()){c.editor.hidden=true;c.edit.setAttribute('aria-expanded','false');}
 dirtyInputs.clear();questionDrafts.clear();handoffDraft={};
 if(changed){state=next;if(record){history.record(state);persist();}}
 render();
 return changed;
}
function dirtyWork(){
 if(Object.keys(handoffDraft).length||dirtyInputs.size||hasFieldDraft()||questionDrafts.size)return true;
 const original=repository.works.find(w=>w.id===state.loadedWorkId);if(!original)return true;
 const now=clone(state);now.loadedWorkId=null;return JSON.stringify(now)!==JSON.stringify(original.state);
}
function renderMetadata(){
 const values={workName:state.metadata.name,workTags:state.metadata.tags.join('、'),workNotes:state.metadata.notes,protagonistName:state.characters.protagonist.name,counterpartName:state.characters.counterpart.name};
 for(const [id,value] of Object.entries(values))if(!dirtyInputs.has(id)&&document.activeElement!==$(id))$(id).value=value;
 const loaded=repository.works.find(w=>w.id===state.loadedWorkId);
 $('saveNew').hidden=Boolean(loaded);$('saveAs').hidden=!loaded;$('saveOverwrite').hidden=!loaded;
 $('loadedLabel').textContent=loaded?`編集中：${loaded.state.metadata.name}（元の作品は上書き保存するまで変わりません）`:'新しいタネ';
}
function renderQuestions(){
 for(const [category,group] of questionCards){group.panel.hidden=category!==questionCategory;group.empty.hidden=state.questions[category].length>0||[...questionDrafts.keys()].some(k=>k.startsWith(category+':'));
  group.slots.forEach((c,index)=>{const draftKey=`${category}:${index}`,pending=questionDrafts.get(draftKey),current=state.questions[category][index],slot=pending&&pending.slot.id!==current?.id?pending.slot:current;c.card.hidden=!slot;if(!slot)return;c.heading.textContent=`${index+1}. ${slot.text}`;
   c.input.value=pending?pending.value:slot.answer;
   c.lock.textContent=slot.locked?'固定中 ✓':'固定';c.lock.setAttribute('aria-pressed',String(slot.locked));c.lock.disabled=Boolean(pending&&pending.slot.id!==current?.id);c.reroll.disabled=slot.locked||Boolean(slot.answer);c.clear.hidden=!slot.answer&&!questionDrafts.has(draftKey);
  });
 }
}
function render(){
 renderHandoff();
 document.body.dataset.tone=state.settings.tone;
 $('stageMixSelect').value=stagePairKey(state.settings)||'';
 if(!state.settings.stage2)$('stageMixPending').hidden=true;
 $('stageMixCondition').textContent=`選択した舞台：${stageLabel(state.settings)}`;
 $('clearStageMix').disabled=!state.settings.stage2;
 $('mixReport').hidden=!state.settings.stage2;$('mixReport').textContent=mixReport(state)?.text||'';
 $('stageSelect').value=state.settings.stage;$('toneSelect').value=state.settings.tone;$('purposeSelect').value=state.settings.purpose;$('purposeLabel').textContent=state.settings.purpose;
 for(const b of document.querySelectorAll('[data-coherence]'))b.setAttribute('aria-pressed',String(b.dataset.coherence===state.settings.coherence));
 $('coherenceHelp').textContent=state.settings.stage2?(state.settings.coherence==='cohesive'?'両方をつなぐ素材を優先します。':'二つの舞台の素材を広く混ぜます。つながりは自分で育てられます。'):state.settings.coherence==='cohesive'?'同じ題材や葛藤を持つ素材を優先します。':'舞台と背景の条件を守りながら、意外な組み合わせも残します。';
 $('lockStatus').hidden=!BASIC.every(([key])=>state.locks[key]);
 $('groupNotice').hidden=state.items.relation?.relationShape!=='group';
 $('cozyToneAction').hidden=!(state.settings.themes.includes('cozy-fantasy')&&state.settings.tone===5);
 if(!$('cozyToneAction').hidden){$('drawNotice').hidden=false;$('drawNotice').textContent='日常ファンタジーには破滅寄りの候補がありません。ダーク・シリアスなら、別れや受け継ぐ暮らしの素材を選べます。';}
 const selected=state.settings.themes;for(const el of $('themeButtons').querySelectorAll('[data-theme]'))el.setAttribute('aria-pressed',String(selected.includes(el.dataset.theme)));
 $('themeCount').textContent=selected.length?`${selected.length}つ選択中`:'お任せ';
 $('activeThemes').textContent=`選んだ方向：${selected.map(id=>THEMES.find(([key])=>id===key)?.[1]).join(' ＋ ')||'お任せ'}${selected.length?'（次の抽選で反映）':''}`;
 const world=state.items.world;
 const mismatch=state.locks.world&&state.settings.stage!=='all'&&(world?.source==='custom'||!world?.stageTags.includes(state.settings.stage));
 $('worldNotice').hidden=!mismatch;$('worldNotice').textContent='世界観は固定中。舞台設定は世界観を引き直すと反映します。';
 for(const [key,c] of cards){const item=state.items[key],locked=state.locks[key],core=coreForField(item,key);if(c.exampleBody.textContent!==item?.text)c.example.open=false;c.value.textContent=core||item?.text||'未設定';c.example.hidden=!core;c.exampleBody.textContent=core?item.text:'';c.value.classList.toggle('seed-value',Boolean(core));c.value.classList.toggle('empty',!item);c.source.hidden=!item||item.source!=='custom';c.source.textContent='自分で入力';c.card.dataset.locked=String(locked);c.lock.textContent=locked?'固定中 ✓':'固定';c.lock.setAttribute('aria-pressed',String(locked));c.roll.disabled=locked;
  const badges=[];
  const badge=BASIC.some(([k])=>k===key)?mixBadge(item,state.settings,worldContext(state)):'';if(badge)badges.push(node('span','mix-tag',badge));
  if(item?.source==='generated')for(const [id,label] of PACKS)if(item.themeTags.includes(id))badges.push(node('span','material-tag',label));
  if(key==='world'&&item)for(const label of contextLabels(item.contextTags||[]))badges.push(node('span','context-tag',label));
  c.badges.replaceChildren(...badges);c.badges.hidden=!badges.length;
 }
 $('summaryBody').textContent=state.texts.summary;$('memoBody').textContent=state.texts.memo;$('hintBody').textContent=state.texts.hint;
 $('titleList').replaceChildren(...state.texts.titles.map(t=>node('li','',t)));
 $('undo').disabled=!history.canUndo;$('redo').disabled=!history.canRedo;
 renderMetadata();renderQuestions();
}
function renderSaved(){
 backup.observe(repository.works);renderBackup();
 const active=document.activeElement,focusId=active?.dataset?.workId,focusAction=active?.dataset?.action;
 const works=filterWorks(repository.works,$('searchWorks').value,$('favoriteOnly').checked),container=$('savedList');
 const elements=works.map(work=>{
  const card=node('article','saved-card'),head=node('div','card-head'),title=node('h3','',work.state.metadata.name||'無題のタネ');
  const fav=button(work.fav?'★ お気に入り':'☆ お気に入り',()=>{repository.favorite(work.id,state);renderSaved();});fav.setAttribute('aria-pressed',String(work.fav));fav.dataset.workId=String(work.id);fav.dataset.action='favorite';head.append(title,fav);
  const summary=node('p','saved-summary',work.state.texts.summary),tags=node('p','saved-tags',work.state.metadata.tags.map(t=>`#${t}`).join('　'));
  let date=work.updatedAt;const parsed=new Date(date);if(!Number.isNaN(parsed.getTime()))date=parsed.toLocaleString('ja-JP');
  const updated=node('p','note',`更新：${date}`),actions=node('div','inline-actions');
  const load=button('読み込む',()=>loadWork(work),'secondary'),duplicate=button('複製して編集',()=>loadWork(work,{duplicate:true})),remove=button('削除',async()=>{
   const choice=await decide('保存作品を削除しますか？',`「${work.state.metadata.name}」を保存一覧から削除します。作業履歴の「戻す」では取り消せません。`,[['delete','この作品を削除する'],['cancel','キャンセル']]);if(choice!=='delete')return;
   const current=clone(state);if(current.loadedWorkId===work.id)current.loadedWorkId=null;repository.remove(work.id,current);state=current;render();renderSaved();showToast('保存作品を削除しました。現在の作業内容は残しています。');
  },'text-btn');
  for(const [b,action] of [[load,'load'],[duplicate,'duplicate'],[remove,'delete']]){b.dataset.workId=String(work.id);b.dataset.action=action;}
  actions.append(load,duplicate,remove);card.append(head,summary,tags,updated,actions);return card;
 });
 if(!elements.length)elements.push(node('p','empty-library',repository.works.length?'条件に合う作品がありません。':'まだ保存したタネはありません。気になる案をここに残しておけます。'));
 container.replaceChildren(...elements);$('savedCount').textContent=`${repository.works.length} / ${MAX_WORKS}件`;
 if(focusId)for(const b of container.querySelectorAll('button'))if(b.dataset.workId===focusId&&b.dataset.action===focusAction){b.focus({preventScroll:true});break;}
}
function renderBackup(){
 $('backupStatus').textContent=backup.meta.lastExportAt?`保存済み作品のJSONを書き出した操作：${new Date(backup.meta.lastExportAt).toLocaleString('ja-JP')}。${backup.changed?'書き出し後に変更があります。':'以後の保存作品の変更はありません。'}`:'保存済み作品のJSONは、まだ書き出していません。';
 $('backupAuxWarning').textContent=backup.warning;$('backupAuxWarning').hidden=!backup.warning;$('backupPrompt').hidden=!backup.shouldPrompt;
}
function resetDrafts(){handoffDraft={};questionDrafts.clear();dirtyInputs.clear();for(const c of cards.values()){c.editor.hidden=true;c.edit.setAttribute('aria-expanded','false');}for(const [id] of metaBindings)$(id).setAttribute('aria-invalid','false');}
function saveCurrent(overwrite=false){requireApplied();state=repository.save(state,{overwrite});history.record(state);render();renderSaved();showToast(overwrite?'上書き保存しました。':'新しい作品として保存しました。');}
async function loadWork(work,{duplicate=false}={}){
 if(dirtyWork()){
  const choice=await decide('現在のタネは保存前です',`「${work.state.metadata.name}」を${duplicate?'複製して編集':'読み込む'}前に、今の作業内容をどうしますか？`,[['save','現在のタネを保存して読み込む'],['discard','保存せず読み込む'],['cancel','キャンセル']]);
  if(!choice||choice==='cancel')return;
  if(choice==='save'){requireApplied();state=repository.save(state,{overwrite:Boolean(repository.works.find(w=>w.id===state.loadedWorkId))});renderSaved();}
 }
 const next=duplicate?repository.duplicate(work.id,state):clone(work.state);if(!duplicate)next.loadedWorkId=work.id;
 resetDrafts();state=next;history.record(state);persist();render();renderSaved();showToast(duplicate?'元の作品を残して、複製を開きました。':'保存作品を読み込みました。');
}
function decide(title,body,choices){return new Promise(resolve=>{
 const dialog=$('decisionDialog');$('decisionTitle').textContent=title;$('decisionBody').textContent=body;
 $('decisionActions').replaceChildren(...choices.map(([value,label],i)=>button(label,()=>{dialog.close();resolve(value);},i===0?'secondary':'')));
 const cancel=()=>{dialog.removeEventListener('cancel',cancel);resolve(null);};dialog.addEventListener('cancel',cancel,{once:true});dialog.addEventListener('close',()=>dialog.removeEventListener('cancel',cancel),{once:true});dialog.showModal();
});}
function download(text,filename,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function filename(extension){return (state.metadata.name||state.texts.titles[0]||'物語のタネ').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/[. ]+$/,'').slice(0,80)+extension;}
async function copy(text){
 let copied=false;
 try{if(navigator.clipboard){await navigator.clipboard.writeText(text);copied=true;}}catch{}
 if(!copied){const ta=node('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-10000px';document.body.append(ta);ta.select();try{copied=document.execCommand('copy');}catch{}ta.remove();}
 if(copied)showToast('コピーしました。');else{$('manualCopyText').value=text;$('manualCopy').showModal();$('manualCopyText').focus();$('manualCopyText').select();}
}
const handoffBindings={handoffPurpose:'purpose',handoffLength:'length',preserveAll:'preserveAll',suggestMissing:'suggestMissing',includeNotes:'includeNotes',userRole:'userRole',aiRole:'aiRole',userRoleText:'userRoleText',extraRequest:'extraRequest'};
function renderHandoff(){
 const value={...state.handoff,...handoffDraft},purpose=value.purpose||(state.settings.purpose==='AIキャラプロットの種'?'chat':'story');
 for(const [id,key] of Object.entries(handoffBindings)){if(document.activeElement===$(id))continue;const v=key==='purpose'?purpose:value[key];if($(id).type==='checkbox')$(id).checked=v;else $(id).value=v;}
 $('chatOptions').hidden=purpose!=='chat';
 $('handoffPending').hidden=!(Object.keys(handoffDraft).length||dirtyInputs.size||hasFieldDraft()||questionDrafts.size);
 try{const text=buildAIHandoff(state);$('handoffPreview').value=text;$('handoffCount').textContent=characterCount(text)+'文字（全文）';if(!Object.keys(handoffDraft).length)$('handoffError').textContent='';}catch(e){$('handoffError').textContent=e.message;}
}
function openHandoff(){if(state.handoff.purpose===null)commit(draft=>{draft.handoff.purpose=draft.settings.purpose==='AIキャラプロットの種'?'chat':'story';});$('handoffPanel').open=true;renderHandoff();$('handoffPanel').scrollIntoView({block:'start'});$('handoffPurpose').focus({preventScroll:true});}
bind('openHandoff',openHandoff);
$('handoffPanel').addEventListener('toggle',()=>{if($('handoffPanel').open&&state.handoff.purpose===null)commit(draft=>{draft.handoff.purpose=draft.settings.purpose==='AIキャラプロットの種'?'chat':'story';});});
for(const [id,key] of Object.entries(handoffBindings))$(id).addEventListener(['userRoleText','extraRequest'].includes(id)?'input':'change',()=>{
 handoffDraft[key]=$(id).type==='checkbox'?$(id).checked:$(id).value;
 try{validateHandoff({...state.handoff,...handoffDraft});$('handoffError').textContent='';if(!['userRoleText','extraRequest'].includes(id)){const value={...state.handoff,[key]:handoffDraft[key]};validateHandoff(value);delete handoffDraft[key];commit(draft=>{draft.handoff=value;});}}catch(e){$('handoffError').textContent=e.message;}
 $('chatOptions').hidden=({...state.handoff,...handoffDraft}).purpose!=='chat';$('handoffPending').hidden=!(Object.keys(handoffDraft).length||dirtyInputs.size||hasFieldDraft()||questionDrafts.size);
});
document.addEventListener('input',()=>{$('handoffPending').hidden=!(Object.keys(handoffDraft).length||dirtyInputs.size||hasFieldDraft()||questionDrafts.size);});
bind('updateHandoff',()=>{requireApplied();renderHandoff();showToast('依頼文を更新しました。');});
bind('copyHandoff',()=>{requireApplied();renderHandoff();return copy($('handoffPreview').value);});
// UIは初回だけ組み立てる。抽選や描画で編集中の入力欄やフォーカスを作り直さない。
setOptions('handoffPurpose',HANDOFF_PURPOSES);
setOptions('stageMixSelect',[['','なし'],...STAGE_PAIRS]);
setOptions('stageSelect',STAGES);setOptions('toneSelect',TONES.map((label,i)=>[i+1,label]));setOptions('purposeSelect',PURPOSES.map(p=>[p,p]));setOptions('questionCategory',QUESTION_CATEGORIES);
for(const [key,label] of BASIC)makeField(key,label,'basicFields',false);
for(const [key,label] of OPTIONAL)makeField(key,label,key.startsWith('scene.')?'sceneFields':key.includes('.')?'characterFields':'progressionFields',true);
for(const [category] of QUESTION_CATEGORIES)makeQuestions(category);
for(const [key,label] of THEMES){
 const pack=PACKS.find(([id])=>id===key);
 const b=button(label,()=>{const themes=state.settings.themes.includes(key)?state.settings.themes.filter(t=>t!==key):[...state.settings.themes,key];commit(draft=>updateSettings(draft,{themes}),{output:true});},pack?'pack-choice':'chip');
 b.dataset.theme=key;b.setAttribute('aria-pressed','false');
 if(pack)b.replaceChildren(node('span','pack-title',label),node('span','pack-description',pack[2]));
 $(pack?'packButtons':'classicThemeButtons').append(b);
}
bind('clearThemes',()=>commit(draft=>updateSettings(draft,{themes:[]}),{notice:'テーマの選択を全解除しました。'}));
bind('unlockAll',()=>commit(draft=>{for(const key of Object.keys(draft.locks))draft.locks[key]=false;for(const slots of Object.values(draft.questions))for(const slot of slots)slot.locked=false;},{notice:'すべてのロックを外しました。回答や本文は残しています。'}));
for(const b of document.querySelectorAll('[data-coherence]'))b.addEventListener('click',()=>guard(()=>commit(draft=>updateSettings(draft,{coherence:b.dataset.coherence}))));
bind('cozyToneAction',()=>commit(draft=>updateSettings(draft,{tone:4})));
$('stageSelect').addEventListener('change',()=>guard(()=>commit(draft=>{updateSettings(draft,{stage:$('stageSelect').value,stage2:null});$('stageMixPending').hidden=true;},{notice:'単独の舞台に変更しました。'})));
$('stageMixSelect').addEventListener('change',()=>guard(()=>{const pair=$('stageMixSelect').value;commit(draft=>updateSettings(draft,pair?settingsForPair(pair):{stage2:null}),{notice:pair?'新しい組み合わせは次の抽選で使います。':`組み合わせを解除しました。舞台：${stageLabel({...state.settings,stage2:null})}`});$('stageMixPending').hidden=!pair;}));
bind('clearStageMix',()=>{commit(draft=>updateSettings(draft,{stage2:null}),{notice:`組み合わせを解除しました。舞台：${stageLabel({...state.settings,stage2:null})}`});$('stageMixPending').hidden=true;$('stageMixSelect').focus();});
for(const [id,key] of [['toneSelect','tone'],['purposeSelect','purpose']])$(id).addEventListener('change',()=>guard(()=>commit(draft=>updateSettings(draft,{[key]:key==='tone'?Number($(id).value):$(id).value}),{output:true})));
function roll(keys=BASIC.map(([k])=>k)){return commit(draft=>rollFields(draft,keys,{data:EXTRA_DATA,recent}),{output:true,randomize:true});}
setOptions('presetSelect',[['','選ばない'],...MODERN_PRESETS.map(({id,label})=>[id,label])]);
function renderPresetSelection(){$('presetPreview').textContent=presetDescription($('presetSelect').value);$('runPreset').disabled=!$('presetSelect').value;$('presetResult').textContent='';$('presetResult').hidden=true;}
$('presetSelect').addEventListener('change',renderPresetSelection);renderPresetSelection();
bind('clearPreset',()=>{$('presetSelect').value='';renderPresetSelection();$('presetSelect').focus();});
bind('runPreset',()=>{
 if(!$('presetSelect').value)return;
 const authored=requireApplied({record:false});let result;
 try{result=tryModernPreset(state,recent,$('presetSelect').value);}catch(error){if(authored){history.record(state);persist();render();}throw error;}
 if(!result.ok){if(authored){history.record(state);persist();render();}$('presetResult').textContent=result.reason;$('presetResult').hidden=false;showToast(result.reason);return;}
 state=result.state;Object.assign(recent,result.recent);refreshTexts(state,{randomize:result.changed>0});history.record(state);persist();render();
 $('drawNotice').textContent=result.notices.join('\n');$('drawNotice').hidden=!result.notices.length;
 $('presetResult').textContent='選んだ方向で基本の抽選を実行しました。固定中の素材は残しています。この世界観条件は今回のみで、次の通常ガチャには持ち越しません。';$('presetResult').hidden=false;
 showToast(result.notices.length?result.notices.join('\n'):'選んだ方向で基本の素材を引きました。');
});
bind('rollAll',()=>roll());
bind('rollLight',()=>commit(draft=>{draft.settings.tone=1;return rollFields(draft,undefined,{data:EXTRA_DATA,recent});},{output:true,randomize:true,notice:'ほのぼののトーンで引きました。固定した項目は残しています。'}));
bind('rollScene',()=>roll(SCENE.map(([k])=>k)));
bind('rollCharacters',()=>roll(CHARACTER_FIELDS.map(([k])=>k)));bind('rollProgression',()=>roll(PROGRESSION_FIELDS.map(([k])=>k)));
bind('undo',()=>{const previous=history.undo();if(previous){state=previous;$('drawNotice').hidden=true;persist();render();showToast('一つ前の作業に戻しました。');}});bind('redo',()=>{const next=history.redo();if(next){state=next;$('drawNotice').hidden=true;persist();render();showToast('作業を進めました。');}});
bind('rebuild',()=>{requireApplied();commit(()=>{},{output:true,randomize:true,notice:'素材を残して、出力文を作り直しました。'});});bind('rollTitles',()=>{requireApplied();commit(()=>{},{output:true,titlesOnly:true});});
$('questionCategory').addEventListener('change',()=>{questionCategory=$('questionCategory').value;renderQuestions();});
bind('rollQuestions',()=>{
 const protectedDrafts=[0,1,2].filter(i=>questionDrafts.has(`${questionCategory}:${i}`));
 commit(draft=>{if(!protectedDrafts.length)return drawQuestions(draft,questionCategory);let changed=0;for(let i=0;i<3;i++)if(!protectedDrafts.includes(i))changed+=drawQuestions(draft,questionCategory,{index:i}).changed;return {notice:changed?'編集中の回答は残して、他の質問を引き直しました。':'回答済み・固定中・編集中の質問は残しました。'};});
});
for(const [id,key,max] of metaBindings){
 $(id).setAttribute('aria-describedby',`${id}Error`);
 $(id).addEventListener('input',()=>{dirtyInputs.add(id);try{parseMeta(id,key,max);}catch{}});
}
bind('saveNew',()=>saveCurrent());bind('saveAs',()=>saveCurrent());bind('saveOverwrite',()=>saveCurrent(true));
$('searchWorks').addEventListener('input',renderSaved);$('favoriteOnly').addEventListener('change',renderSaved);
for(const b of document.querySelectorAll('[data-copy]'))b.addEventListener('click',()=>guard(()=>{requireApplied();const key=b.dataset.copy;const text=key==='markdown'?markdown(state):key==='titles'?state.texts.titles.join('\n'):state.texts[key];return copy(text);}));
bind('downloadMarkdown',()=>{requireApplied();download(markdown(state),filename('.md'),'text/markdown;charset=utf-8');});
bind('exportCurrent',()=>{requireApplied();download(exportJSON(state,null,{sourceWork:repository.works.find(w=>w.id===state.loadedWorkId)}),filename('.json'),'application/json');});
function exportSaved(){const text=exportJSON(state,repository.works);const unsaved=dirtyWork();download(text,'creative-idea-gacha-saved-works.json','application/json');backup.exported(repository.works);renderBackup();$('backupExportNotice').textContent=unsaved?'保存済み作品を書き出しました。現在の未保存編集は含みません。現在のタネは個別のJSON保存で持ち出せます。':'保存済み作品のJSONの書き出しを開始しました。';}
bind('exportAll',exportSaved);bind('backupNow',exportSaved);bind('dismissBackup',()=>{backup.dismiss();renderBackup();});
bind('exportRaw',()=>download(repository.rawBackup||'{}','creative-idea-gacha-original-data.json','application/json'));
$('importFile').addEventListener('change',()=>guard(async()=>{
 pendingImport=null;$('confirmImport').hidden=true;const file=$('importFile').files[0];if(!file)return;
 try{if(file.size>MAX_BYTES)throw new Error('ファイルは5MiBまでです。');const works=inspectImport(await file.text());if(works.length+repository.works.length>MAX_WORKS)throw new Error('取り込み後の作品数が500件を超えます。');pendingImport=works;
  const collisions=works.filter(w=>repository.works.some(old=>String(old.id)===String(w.id))).length;
  $('importPreview').textContent=`検証OK：${works.length}件を追加できます。${collisions?`既存IDと重なる${collisions}件は新しいIDにします。`:''} 既存作品はそのまま残ります。`;$('confirmImport').hidden=!works.length;
 }catch(e){$('importPreview').textContent=`取り込みできません：${e.message}`;}
}));
bind('confirmImport',()=>{if(!pendingImport)return;const count=repository.addImported(pendingImport,state);pendingImport=null;$('confirmImport').hidden=true;$('importFile').value='';$('importPreview').textContent=`${count}件を追加しました。`;renderSaved();showToast(`${count}件の作品を取り込みました。`);});
bind('closeManualCopy',()=>$('manualCopy').close());
for(const details of document.querySelectorAll('details')){const summary=details.querySelector('summary');summary.setAttribute('aria-expanded',String(details.open));details.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(details.open)));}
window.addEventListener('beforeunload',event=>{if(Object.keys(handoffDraft).length||dirtyInputs.size||hasFieldDraft()||questionDrafts.size){event.preventDefault();event.returnValue='';}});
document.addEventListener('compositionstart',()=>{composing=true;});document.addEventListener('compositionend',()=>{composing=false;});
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&(composing||event.isComposing||event.keyCode===229)){event.stopImmediatePropagation();if(event.target.closest('button'))event.preventDefault();}},true);
document.addEventListener('focusin',event=>{if(event.target.matches('textarea,input:not([type="checkbox"])'))document.body.classList.add('text-input-active');});
document.addEventListener('focusout',()=>{setTimeout(()=>{if(!document.activeElement?.matches('textarea,input:not([type="checkbox"])'))document.body.classList.remove('text-input-active');},0);});
function keepInputVisible(){const input=document.activeElement;if(input?.matches('textarea,input:not([type="checkbox"])'))requestAnimationFrame(()=>input.scrollIntoView({block:'center',behavior:'instant'}));}
window.addEventListener('resize',keepInputVisible);window.visualViewport?.addEventListener('resize',keepInputVisible);
render();renderSaved();
$('exportRaw').hidden=!repository.rawBackup;
if(initial.warnings.length)storageWarning(initial.warnings.join('\n'));
else if(!repository.needsV3Write)persist();
