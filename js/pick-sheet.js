// 「素材から選ぶ」シートの画面部分。分類と絞り込みの計算は browse.js、10候補は pick.js、
// 採用（編集の保護・保存・履歴）は app.js に任せる。ここでの操作は採用するまで作品を変えない。
import {candidatesFor,candidateLabel,PICK_COUNT} from './pick.js';
import {PAGE_SIZE,catalog,fittingIds,filterRows,branchCounts,drawFrom,misfitReasons,rowTags,rowLabel,toStateItem,normalize} from './browse.js';
import {openSheet,closeSheet} from './ui-shell.js';

const $=id=>document.getElementById(id);
const el=(tag,className='',text='')=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
let session=null,adopt=null,taxonomyModule=null,mapModule=null;

// 分類表は大きいので、初めてシートを開くときに読み込む。
async function loadBrowse(){
 if(!taxonomyModule)[taxonomyModule,mapModule]=await Promise.all([import('./browse-taxonomy.js'),import('./browse-map-basic.js')]);
 return {taxonomy:taxonomyModule.BROWSE_TAXONOMY_BASIC,map:mapModule.BROWSE_MAP_BASIC};
}

const fitSet=()=>session.scope==='fit'?session.fit:null;
function filtered({query=session.query,major=session.major,minor=session.minor}={}){
 return filterRows(session.rows,{map:session.map,key:session.key,major,minor,query,fit:fitSet()});
}
const majorOf=id=>session.taxonomy.find(m=>m.id===id);

function setChosen(chosen){
 session.chosen=chosen;
 const use=$('pickUse');use.disabled=!chosen;use.textContent=chosen?'この素材を使う':'素材を選んでください';
 $('pickChosen').textContent=chosen?`選択中：${chosen.label}`:'';
 const reasons=chosen?.reasons||[];
 $('pickMisfit').hidden=!reasons.length;
 $('pickMisfit').textContent=reasons.length?`条件外：${reasons.join('／')}。採用しても舞台・トーン・世界の背景は変わりません。必要なら設定や他の項目を合わせてください。`:'';
}

function renderSelects(){
 const counts=branchCounts(session.rows,{map:session.map,taxonomy:session.taxonomy,fit:fitSet()});
 const major=$('browseMajor'),minor=$('browseMinor');
 const option=(value,label,count,selected)=>{const o=el('option','',`${label}（${count}）`);o.value=value;o.disabled=count===0&&!selected;o.selected=selected;return o;};
 major.replaceChildren(option('all','すべて',counts.majors.all,session.major==='all'),...session.taxonomy.map(m=>option(m.id,m.label,counts.majors[m.id],session.major===m.id)));
 const current=majorOf(session.major);
 minor.replaceChildren(option('all','すべて',current?counts.majors[current.id]:counts.majors.all,session.minor==='all'),...(current?current.minors.map(n=>option(n.id,n.label,counts.minors[`${current.id}.${n.id}`],session.minor===n.id)):[]));
 minor.disabled=!current;
}

function emptyActions(list){
 const actions=[],withoutQuery=session.query?filtered({query:''}).length:0;
 let message;
 const action=(text,fn)=>{const b=el('button','secondary',text);b.type='button';b.addEventListener('click',fn);actions.push(b);};
 if(session.query&&withoutQuery>0){message=`「${session.query.trim()}」に合う素材は、この分類にありません。`;action('検索を消す',()=>{$('browseSearch').value='';session.query='';update({focus:'browseSearch'});});}
 else{
  message=session.scope==='fit'?'今の条件（トーン・舞台・世界の背景）に合う素材が、この分類にはありません。':'この分類には素材がありません。';
  if(session.minor!=='all')action('小分類をすべてに戻す',()=>{session.minor='all';update({focus:'browseMinor'});});
  else if(session.major!=='all')action('大分類をすべてに戻す',()=>{session.major='all';session.minor='all';update({focus:'browseMajor'});});
  if(session.scope==='fit')action('条件外の素材も見る',()=>{setScope('all');});
  if(session.query)action('検索を消す',()=>{$('browseSearch').value='';session.query='';update({focus:'browseSearch'});});
 }
 $('browseEmptyText').textContent=message;$('browseEmptyActions').replaceChildren(...actions);
 $('browseEmpty').hidden=list.length>0;
}

function renderList(list){
 const {key,currentId}=session,shown=list.slice(0,session.shown);
 $('browseList').replaceChildren(...shown.map(row=>{
  const item=el('div','browse-item'),button=el('button','pick-row browse-row');button.type='button';
  const selected=session.chosen?.source==='browse'&&session.chosen.id===row.id;
  button.setAttribute('aria-pressed',String(selected));button.dataset.id=row.id;
  const label=rowLabel(row,key),reasons=session.fit.has(row.id)?[]:misfitReasons(session.state,key,row);
  const body=el('span','browse-body'),text=el('span','pick-text',label),tags=el('span','browse-tags');
  if(row.id===currentId)tags.append(el('span','browse-tag tag-current','使用中'));
  if(reasons.length)tags.append(el('span','browse-tag tag-misfit','条件外'));
  for(const tag of rowTags(row,key))tags.append(el('span',`browse-tag tag-${tag.kind}`,tag.text));
  body.append(text,tags);button.append(body);
  button.addEventListener('click',()=>choose(row,{focus:false}));
  item.append(button);
  if(selected){
   const preview=el('div','browse-preview');
   if(label!==row.text){const details=el('details','seed-example browse-full'),summary=el('summary','','全文・具体例を見る');details.append(summary,el('p','example-body',row.text));preview.append(details);}
   if(reasons.length)preview.append(el('p','browse-reasons',`条件外：${reasons.join('／')}`));
   if(preview.childElementCount)item.append(preview);
  }
  return item;
 }));
 const rest=list.length-shown.length;
 $('browseMore').hidden=rest<=0;$('browseMore').textContent=`さらに表示（残り${rest}件）`;
}

function pathText(list){
 const major=majorOf(session.major),minor=major?.minors.find(n=>n.id===session.minor);
 const path=major?`${major.label} → ${minor?minor.label:'すべて'}`:'すべての分類';
 return `${path}：${list.length}件${session.query.trim()?`（検索「${session.query.trim()}」）`:''}`;
}

// 絞り込みの変更を反映する。一覧から外れた未採用の選択は外す。
function update({focus=null,keepShown=false}={}){
 const list=filtered();session.list=list;
 if(!keepShown)session.shown=PAGE_SIZE;
 if(session.chosen?.source==='browse'&&!list.some(row=>row.id===session.chosen.id))setChosen(null);
 renderSelects();
 $('browsePath').textContent=session.notice?`${pathText(list)}　${session.notice}`:pathText(list);session.notice='';
 $('browseGacha').disabled=!list.length;
 emptyActions(list);renderList(list);
 if(focus)$(focus)?.focus({preventScroll:true});
}

function choose(row,{focus=true}={}){
 const reasons=session.fit.has(row.id)?[]:misfitReasons(session.state,session.key,row);
 setChosen({source:'browse',id:row.id,item:toStateItem(row),label:rowLabel(row,session.key),reasons,fits:!reasons.length});
 const index=session.list.findIndex(r=>r.id===row.id);
 if(index>=session.shown)session.shown=Math.ceil((index+1)/PAGE_SIZE)*PAGE_SIZE;
 renderList(session.list);
 const button=$('browseList').querySelector(`[data-id="${CSS.escape(row.id)}"]`);
 if(focus&&button){button.focus({preventScroll:true});button.scrollIntoView({block:'nearest'});}
}

function setScope(scope){
 session.scope=scope;for(const input of document.querySelectorAll('input[name="browseScope"]'))input.checked=input.value===scope;
 update({focus:null});
}

function fillTen(){
 const {key,getState,data,recent}=session;
 session.ten=candidatesFor(getState(),key,{n:PICK_COUNT,data,recent});
 $('pickList').replaceChildren(...session.ten.map((item,i)=>{
  const row=el('button','pick-row');row.type='button';row.setAttribute('aria-pressed','false');
  const no=el('span','pick-no',String(i+1));no.setAttribute('aria-hidden','true');
  row.append(no,el('span','pick-text',candidateLabel(item,key)));
  row.addEventListener('click',()=>{
   [...$('pickList').children].forEach((r,j)=>r.setAttribute('aria-pressed',String(j===i)));
   setChosen({source:'ten',id:item.candidateId,item,label:candidateLabel(item,key),reasons:[],fits:true});
  });
  return row;
 }));
 const count=session.ten.length;
 $('pickEmpty').hidden=count>0;
 $('pickShort').hidden=!count||count>=PICK_COUNT;$('pickShort').textContent=`この条件で見つかった候補は${count}個です。`;
 $('pickMore').disabled=!count;
 if(session.chosen?.source==='ten')setChosen(null);
}

function setMode(mode){
 session.mode=mode;
 $('pickModeBrowse').setAttribute('aria-pressed',String(mode==='browse'));$('pickModeTen').setAttribute('aria-pressed',String(mode==='ten'));
 $('browsePanel').hidden=mode!=='browse';$('tenPanel').hidden=mode!=='ten';$('pickMore').hidden=mode!=='ten';
 // 画面の切り替えだけでは採用しない。選択中の候補も切り替え時に外す。
 setChosen(null);
 if(mode==='ten'){if(!session.ten)fillTen();else [...$('pickList').children].forEach(r=>r.setAttribute('aria-pressed','false'));}
 else update({keepShown:true});
}

export async function openPick(key,label,{getState,data,recent,from}){
 const {taxonomy,map}=await loadBrowse();
 const state=getState(),current=state.items[key];
 session={key,label,getState,data,recent,state,taxonomy:taxonomy[key],map:map[key],rows:catalog(key,state.settings,data),fit:fittingIds(state,key,data),
  currentId:current?.source==='generated'?current.candidateId:null,mode:'browse',scope:'fit',major:'all',minor:'all',query:'',shown:PAGE_SIZE,list:[],ten:null,chosen:null,notice:''};
 $('pickTitle').textContent=`${label}の素材を選ぶ`;
 $('pickCurrent').textContent=current?candidateLabel(current,key):'未設定';$('pickCurrent').classList.toggle('empty',!current);
 const locked=Boolean(state.locks[key]);$('pickCurrentLock').hidden=!locked;$('pickLockedNote').hidden=!locked;
 $('pickLockAfter').checked=true;$('browseSearch').value='';
 for(const input of document.querySelectorAll('input[name="browseScope"]'))input.checked=input.value==='fit';
 setMode('browse');
 openSheet($('pickSheet'),from);
 $('pickModeBrowse').focus({preventScroll:true});
}

export function initPickSheet(onAdopt){
 adopt=onAdopt;
 $('pickModeBrowse').addEventListener('click',()=>{if(session&&session.mode!=='browse')setMode('browse');});
 $('pickModeTen').addEventListener('click',()=>{if(session&&session.mode!=='ten')setMode('ten');});
 for(const input of document.querySelectorAll('input[name="browseScope"]'))input.addEventListener('change',()=>{if(session&&input.checked)setScope(input.value);});
 $('browseMajor').addEventListener('change',()=>{
  if(!session)return;session.major=$('browseMajor').value;
  // 新しい大分類に今の小分類がなければ「すべて」に戻す。
  if(!majorOf(session.major)?.minors.some(n=>n.id===session.minor))session.minor='all';
  update();
 });
 $('browseMinor').addEventListener('change',()=>{if(session){session.minor=$('browseMinor').value;update();}});
 // 日本語入力の変換中は絞り込まない（確定後に反映）。
 let composing=false;
 $('browseSearch').addEventListener('compositionstart',()=>{composing=true;});
 $('browseSearch').addEventListener('compositionend',()=>{composing=false;if(session){session.query=$('browseSearch').value;update();}});
 $('browseSearch').addEventListener('input',event=>{if(!session||composing||event.isComposing)return;if(normalize(session.query)===normalize($('browseSearch').value)){session.query=$('browseSearch').value;return;}session.query=$('browseSearch').value;update();});
 $('browseMore').addEventListener('click',()=>{if(!session)return;const first=session.shown;session.shown+=PAGE_SIZE;renderList(session.list);$('browseList').querySelectorAll('.browse-row')[first]?.focus({preventScroll:true});});
 $('browseGacha').addEventListener('click',()=>{
  if(!session||!session.list.length)return;
  const current=session.chosen?.source==='browse'?session.chosen.id:null,{row,single}=drawFrom(session.list,current);
  if(single)session.notice='この条件の候補は1件です。';
  choose(row);
  if(single){$('browsePath').textContent=`${pathText(session.list)}　この条件の候補は1件です。`;session.notice='';}
 });
 $('pickMore').addEventListener('click',()=>{if(session){fillTen();$('pickMore').focus({preventScroll:true});}});
 $('pickUse').addEventListener('click',async()=>{
  if(!session?.chosen)return;
  const {key,chosen}=session,lock=$('pickLockAfter').checked;
  const done=await adopt(key,chosen.item,{lock,fits:chosen.fits,reasons:chosen.reasons});
  if(done!==false&&$('pickSheet').open)closeSheet($('pickSheet'));
 });
 $('pickSheet').addEventListener('close',()=>{session=null;});
}
