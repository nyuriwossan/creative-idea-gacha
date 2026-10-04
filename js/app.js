import { BASIC,STAGES,TONES,PURPOSES,THEMES } from './data.js';
import { EXTRA_DATA } from './extra-data.js';
import { emptyState,FIELDS,OPTIONAL,QUESTION_CATEGORIES,clone,rollFields,editField,updateSettings,refreshTexts,History,markdown } from './core.js';
import { Repository,exportJSON,inspectImport,filterWorks,MAX_BYTES,MAX_WORKS } from './storage.js';
import { drawQuestions,answerQuestion } from './questions.js';
const $=id=>document.getElementById(id);
const node=(tag,className='',text='')=>{const el=document.createElement(tag);el.className=className;el.textContent=text;return el;};
const button=(text,handler,className='')=>{const el=node('button',className,text);el.type='button';el.addEventListener('click',()=>guard(handler));return el;};
const cards=new Map(),questionCards=new Map(),questionDrafts=new Map(),dirtyInputs=new Set();
const recent={};let questionCategory='world',pendingImport=null,toastTimer;
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw new Error('ブラウザが保存領域を利用できません。');},setItem(){throw new Error('保存領域を利用できません。');}};}
const repository=new Repository(storage),initial=repository.load();
let state=initial.current||emptyState();
if(!initial.current){rollFields(state,undefined,{data:EXTRA_DATA,recent});refreshTexts(state);}
const history=new History(state);
function showToast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
function storageWarning(message){$('storageWarning').textContent=message;$('storageWarning').hidden=false;}
function persist(){try{repository.write(state);if(!repository.blocked)$('storageWarning').hidden=true;}catch(e){storageWarning(e.message);}}
async function guard(fn){try{await fn();}catch(e){showToast(e.message||'操作を完了できませんでした。');}}
function commit(fn,{output=false,randomize=false,titlesOnly=false,notice=''}={}){
 const draft=clone(state),result=fn(draft);
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
 const value=node('p','field-value'),actions=node('div','field-actions');
 const roll=button('引き直す',()=>{
  const result=commit(draft=>rollFields(draft,[key],{data:EXTRA_DATA,recent}),{output:true,randomize:true});
  if(key==='world'&&result?.changed)showToast('世界観を引き直しました。他の項目も合わせたいときは「全部ガチャ」を使えます。');
 });roll.setAttribute('aria-label',`${label}を引き直す`);
 const lock=button('固定',()=>commit(draft=>{draft.locks[key]=!draft.locks[key];}));lock.setAttribute('aria-label',`${label}の固定を切り替える`);
 const editor=node('div','editor');editor.id=`editor-${safeKey}`;editor.hidden=true;
 const edit=button('編集',()=>{if(!editor.hidden){text.focus();return;}text.value=state.items[key]?.text||'';short.value=state.items[key]?.titleWord||'';editor.hidden=false;edit.setAttribute('aria-expanded','true');validateEditor();text.focus();});edit.setAttribute('aria-label',`${label}を編集`);edit.setAttribute('aria-expanded','false');edit.setAttribute('aria-controls',editor.id);
 const textLabel=node('label','',`${label}の本文 `),count=node('span','input-count');textLabel.append(count);
 const text=node('textarea');text.id=`input-${safeKey}`;text.rows=3;textLabel.htmlFor=text.id;const inputError=node('span','input-error');inputError.id=`error-${safeKey}`;inputError.setAttribute('aria-live','polite');text.setAttribute('aria-describedby',inputError.id);
 const shortLabel=node('label','','タイトル用の短い言葉（任意 / 30文字まで）'),short=node('input');short.type='text';short.id=`short-${safeKey}`;shortLabel.htmlFor=short.id;
 const shortError=node('span','input-error');shortError.id=`short-error-${safeKey}`;short.setAttribute('aria-describedby',shortError.id);shortError.setAttribute('aria-live','polite');
 function validateEditor(){count.textContent=`${text.value.length} / 500文字`;const ok1=errorFor(text,inputError,text.value.length>500?'500文字を超えています。短くしてから反映してください。':'');const ok2=errorFor(short,shortError,short.value.length>30?'30文字までで入力してください。':'');return ok1&&ok2;}
 text.addEventListener('input',validateEditor);short.addEventListener('input',validateEditor);
 const editActions=node('div','inline-actions');
 const close=()=>{editor.hidden=true;edit.setAttribute('aria-expanded','false');edit.focus();};
 editActions.append(button('反映',()=>{if(!validateEditor())return;commit(draft=>editField(draft,key,text.value,short.value),{output:true,randomize:false});close();}),button('キャンセル',close));
 if(optional)editActions.append(button('未設定に戻す',()=>{commit(draft=>{draft.items[key]=null;draft.locks[key]=false;},{output:true});close();},'text-btn'));
 editor.append(textLabel,text,inputError,shortLabel,short,shortError,editActions);actions.append(roll,lock,edit);card.append(head,value,actions,editor);$(container).append(card);
 cards.set(key,{card,value,source,roll,lock,edit,editor,text,short});
}
function makeQuestions(category){
 const panel=node('div');panel.dataset.category=category;
 const empty=node('p','note','まだ質問はありません。「質問を3つ出す」で始められます。');panel.append(empty);
 const slots=[];
 for(let index=0;index<3;index++){
  const card=node('article','question-slot'),heading=node('h4'),label=node('label','',`質問${index+1}への回答（2,000文字まで）`),input=node('textarea');input.rows=3;input.id=`answer-${category}-${index}`;label.htmlFor=input.id;
  const error=node('span','input-error');error.id=`answer-error-${category}-${index}`;error.setAttribute('aria-live','polite');input.setAttribute('aria-describedby',error.id);
  const draftKey=`${category}:${index}`;
  input.addEventListener('input',()=>{questionDrafts.set(draftKey,input.value);errorFor(input,error,input.value.length>2000?'回答は2,000文字までです。短くしてから反映してください。':'');});
  const actions=node('div','inline-actions');
  const apply=button('回答を反映',()=>{if(!errorFor(input,error,input.value.length>2000?'回答は2,000文字までです。':''))return;commit(draft=>answerQuestion(draft,category,index,input.value));questionDrafts.delete(draftKey);renderQuestions();showToast('回答を反映しました。');});
  const lock=button('固定',()=>commit(draft=>{draft.questions[category][index].locked=!draft.questions[category][index].locked;}));
  const reroll=button('この質問を引き直す',()=>{if(questionDrafts.has(draftKey)){showToast('編集中の回答は残しました。先に「回答を反映」してください。');return;}commit(draft=>drawQuestions(draft,category,{index}));});
  const clear=button('回答を消して引き直す',async()=>{const choice=await decide('回答を消して引き直しますか？',state.questions[category][index].text,[['clear','回答を消して引き直す'],['cancel','キャンセル']]);if(choice!=='clear')return;questionDrafts.delete(draftKey);commit(draft=>drawQuestions(draft,category,{index,clearAnswer:true}));},'text-btn');
  lock.setAttribute('aria-label',`質問${index+1}の固定を切り替える`);actions.append(apply,lock,reroll,clear);card.append(heading,label,input,error,actions);panel.append(card);slots.push({card,heading,input,lock,clear,reroll});
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
function commitMetadata(ids=null){
 const changes=metaBindings.filter(([id])=>dirtyInputs.has(id)&&(!ids||ids.includes(id))).map(([id,key,max])=>[id,key,parseMeta(id,key,max)]);
 if(!changes.length)return;
 commit(draft=>{for(const [,key,value] of changes){if(key==='protagonist'||key==='counterpart')draft.characters[key].name=value;else draft.metadata[key]=value;}},{output:changes.some(([,key])=>key==='protagonist'||key==='counterpart')});
 for(const [id] of changes)dirtyInputs.delete(id);renderMetadata();
}
function hasFieldDraft(){return [...cards.entries()].some(([key,c])=>!c.editor.hidden&&(c.text.value!==(state.items[key]?.text||'')||c.short.value!==(state.items[key]?.titleWord||'')));}
function requireApplied(){commitMetadata();if(hasFieldDraft()||questionDrafts.size)throw new Error('編集中の項目・質問回答を先に「反映」してください。入力した文字は残しています。');}
function dirtyWork(){
 if(dirtyInputs.size||hasFieldDraft()||questionDrafts.size)return true;
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
 for(const [category,group] of questionCards){group.panel.hidden=category!==questionCategory;group.empty.hidden=state.questions[category].length>0;
  group.slots.forEach((c,index)=>{const slot=state.questions[category][index];c.card.hidden=!slot;if(!slot)return;c.heading.textContent=`${index+1}. ${slot.text}`;const draftKey=`${category}:${index}`;
   if(!questionDrafts.has(draftKey))c.input.value=slot.answer;
   c.lock.textContent=slot.locked?'固定中 ✓':'固定';c.lock.setAttribute('aria-pressed',String(slot.locked));c.reroll.disabled=slot.locked||Boolean(slot.answer);c.clear.hidden=!slot.answer&&!questionDrafts.has(draftKey);
  });
 }
}
function render(){
 document.body.dataset.tone=state.settings.tone;
 $('stageSelect').value=state.settings.stage;$('toneSelect').value=state.settings.tone;$('purposeSelect').value=state.settings.purpose;$('purposeLabel').textContent=state.settings.purpose;
 const selected=state.settings.themes;for(const el of $('themeButtons').children)el.setAttribute('aria-pressed',String(selected.includes(el.dataset.theme)));
 $('themeCount').textContent=selected.length?`${selected.length}つ選択中`:'お任せ';
 const world=state.items.world;
 const mismatch=state.locks.world&&state.settings.stage!=='all'&&(world?.source==='custom'||!world?.stageTags.includes(state.settings.stage));
 $('worldNotice').hidden=!mismatch;$('worldNotice').textContent='世界観は固定中。舞台設定は世界観を引き直すと反映します。';
 for(const [key,c] of cards){const item=state.items[key],locked=state.locks[key];c.value.textContent=item?.text||'未設定';c.value.classList.toggle('empty',!item);c.source.hidden=!item||item.source!=='custom';c.source.textContent='自分で入力';c.card.dataset.locked=String(locked);c.lock.textContent=locked?'固定中 ✓':'固定';c.lock.setAttribute('aria-pressed',String(locked));c.roll.disabled=locked;}
 $('summaryBody').textContent=state.texts.summary;$('memoBody').textContent=state.texts.memo;$('hintBody').textContent=state.texts.hint;
 $('titleList').replaceChildren(...state.texts.titles.map(t=>node('li','',t)));
 $('undo').disabled=!history.canUndo;$('redo').disabled=!history.canRedo;
 renderMetadata();renderQuestions();
}
function renderSaved(){
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
function resetDrafts(){questionDrafts.clear();dirtyInputs.clear();for(const c of cards.values()){c.editor.hidden=true;c.edit.setAttribute('aria-expanded','false');}for(const [id] of metaBindings)$(id).setAttribute('aria-invalid','false');}
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
// UIは初回だけ組み立てる。抽選や描画で編集中の入力欄やフォーカスを作り直さない。
setOptions('stageSelect',STAGES);setOptions('toneSelect',TONES.map((label,i)=>[i+1,label]));setOptions('purposeSelect',PURPOSES.map(p=>[p,p]));setOptions('questionCategory',QUESTION_CATEGORIES);
for(const [key,label] of BASIC)makeField(key,label,'basicFields',false);
for(const [key,label] of OPTIONAL)makeField(key,label,key.includes('.')?'characterFields':'progressionFields',true);
for(const [category] of QUESTION_CATEGORIES)makeQuestions(category);
for(const [key,label] of THEMES){const b=button(label,()=>{const themes=state.settings.themes.includes(key)?state.settings.themes.filter(t=>t!==key):[...state.settings.themes,key];commit(draft=>updateSettings(draft,{themes}),{output:true});},'chip');b.dataset.theme=key;b.setAttribute('aria-pressed','false');$('themeButtons').append(b);}
bind('clearThemes',()=>commit(draft=>updateSettings(draft,{themes:[]}),{output:true}));
for(const [id,key] of [['stageSelect','stage'],['toneSelect','tone'],['purposeSelect','purpose']])$(id).addEventListener('change',()=>guard(()=>commit(draft=>updateSettings(draft,{[key]:key==='tone'?Number($(id).value):$(id).value}),{output:true})));
function roll(keys=BASIC.map(([k])=>k)){return commit(draft=>rollFields(draft,keys,{data:EXTRA_DATA,recent}),{output:true,randomize:true});}
bind('rollAll',()=>roll());bind('rollDifferent',()=>roll());
bind('rollLight',()=>commit(draft=>{draft.settings.tone=1;return rollFields(draft,undefined,{data:EXTRA_DATA,recent});},{output:true,randomize:true,notice:'ほのぼののトーンで引きました。固定した項目は残しています。'}));
bind('rollCharacters',()=>roll(OPTIONAL.slice(0,6).map(([k])=>k)));bind('rollProgression',()=>roll(OPTIONAL.slice(6).map(([k])=>k)));
bind('undo',()=>{const previous=history.undo();if(previous){state=previous;persist();render();showToast('一つ前の作業に戻しました。');}});bind('redo',()=>{const next=history.redo();if(next){state=next;persist();render();showToast('作業を進めました。');}});
bind('rebuild',()=>commit(()=>{},{output:true,randomize:true,notice:'素材を残して、出力文を作り直しました。'}));bind('rollTitles',()=>commit(()=>{},{output:true,titlesOnly:true}));
$('questionCategory').addEventListener('change',()=>{questionCategory=$('questionCategory').value;renderQuestions();});
bind('rollQuestions',()=>{
 const protectedDrafts=[0,1,2].filter(i=>questionDrafts.has(`${questionCategory}:${i}`));
 commit(draft=>{if(!protectedDrafts.length)return drawQuestions(draft,questionCategory);let changed=0;for(let i=0;i<3;i++)if(!protectedDrafts.includes(i))changed+=drawQuestions(draft,questionCategory,{index:i}).changed;return {notice:changed?'編集中の回答は残して、他の質問を引き直しました。':'回答済み・固定中・編集中の質問は残しました。'};});
});
for(const [id,key,max] of metaBindings){
 $(id).setAttribute('aria-describedby',`${id}Error`);
 $(id).addEventListener('input',()=>{dirtyInputs.add(id);try{parseMeta(id,key,max);}catch{}});
 $(id).addEventListener('blur',()=>guard(()=>commitMetadata([id])));
}
bind('saveNew',()=>saveCurrent());bind('saveAs',()=>saveCurrent());bind('saveOverwrite',()=>saveCurrent(true));
$('searchWorks').addEventListener('input',renderSaved);$('favoriteOnly').addEventListener('change',renderSaved);
for(const b of document.querySelectorAll('[data-copy]'))b.addEventListener('click',()=>guard(()=>{requireApplied();const key=b.dataset.copy;const text=key==='markdown'?markdown(state):key==='titles'?state.texts.titles.join('\n'):state.texts[key];return copy(text);}));
bind('downloadMarkdown',()=>{requireApplied();download(markdown(state),filename('.md'),'text/markdown;charset=utf-8');});
bind('exportCurrent',()=>{requireApplied();download(exportJSON(state,null,{sourceWork:repository.works.find(w=>w.id===state.loadedWorkId)}),filename('.json'),'application/json');});
bind('exportAll',()=>download(exportJSON(state,repository.works),'creative-idea-gacha-backup.json','application/json'));
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
window.addEventListener('beforeunload',event=>{if(dirtyInputs.size||hasFieldDraft()||questionDrafts.size){event.preventDefault();event.returnValue='';}});
render();renderSaved();
$('exportRaw').hidden=!repository.rawBackup;
if(initial.warnings.length)storageWarning(initial.warnings.join('\n'));
else persist();
