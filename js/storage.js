import { emptyState, FIELDS, QUESTION_CATEGORIES, clone, updateSettings } from './core.js';
import { EXTRA_DATA } from './extra-data.js';
const DEFINITION_BY_ID=new Map(Object.values(EXTRA_DATA).flat().map(item=>[item.id,item]));
export const APP_ID='creative-idea-gacha';
export const STORAGE_KEY='creativeIdeaGacha_v2';
export const BACKUP_KEY='creativeIdeaGacha_legacyBackup';
export const OLD_KEYS=['creativeIdeaGacha_state','creativeIdeaGacha_savedItems'];
export const MAX_WORKS=500, MAX_BYTES=5*1024*1024;
export const uid=()=>globalThis.crypto?.randomUUID?.()||`seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=(v,label)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error(`${label}の型が不正です。`);return v;};
const string=(v,label,max=Infinity)=>{if(typeof v!=='string'||v.length>max)throw new Error(`${label}は文字列${Number.isFinite(max)?`（${max}文字まで）`:''}で指定してください。`);return v;};
const bool=(v,label)=>{if(typeof v!=='boolean')throw new Error(`${label}の型が不正です。`);return v;};
function strings(v,label,maxCount=Infinity,maxLength=Infinity){if(!Array.isArray(v)||v.length>maxCount)throw new Error(`${label}の件数が不正です。`);return v.map(x=>string(x,label,maxLength));}
function tags(value,label,maxCount,maxLength){const list=strings(value,label,maxCount,maxLength);if(new Set(list).size!==list.length)throw new Error(`${label}が重複しています。`);return list;}
function validItem(raw,{legacy=false}={}) {
 if(raw===null)return null;
 const row=object(raw,'候補');
 const source=legacy?'legacy':row.source;
 if(!['generated','custom','legacy'].includes(source))throw new Error('候補の入力元が不正です。');
 const text=string(row.text,'候補本文',source==='legacy'?Infinity:500);
 if(!text.trim())throw new Error('候補本文が空です。');
 const tones=row.tones??[];
 if(!Array.isArray(tones)||tones.some(t=>!Number.isInteger(t)||t<1||t>5))throw new Error('対応トーンが不正です。');
 const candidateId=legacy?null:row.candidateId;
 if(candidateId!==null&&typeof candidateId!=='string')throw new Error('候補IDが不正です。');
 const shape=row.relationShape||'neutral';if(!['pair','group','neutral'].includes(shape))throw new Error('関係性の形が不正です。');
 const definition=source==='generated'?DEFINITION_BY_ID.get(candidateId):null;
 const contextTags=tags(own(row,'contextTags')?row.contextTags:definition?.contextTags??[],'背景タグ',16,40),requiresContext=tags(own(row,'requiresContext')?row.requiresContext:definition?.requiresContext??[],'必要な背景',16,40);
 const themeTags=tags(row.themeTags??[],'テーマタグ',32,80);
 const hydratedThemes=tags([...new Set([...themeTags,...(definition?.themeTags||[])])],'テーマタグ',32,80);
 return {candidateId,text,source,stageTags:tags(row.stageTags??row.tags??[],'舞台タグ',20,80),themeTags:hydratedThemes,contextTags,requiresContext,tones:[...tones],titleWord:string(row.titleWord??'','タイトル用の言葉',source==='legacy'?Infinity:30),...(own(row,'relationShape')?{relationShape:shape}:{})};
}
function validTexts(raw){const t=object(raw,'生成文');return {summary:string(t.summary??'','要約'),memo:string(t.memo??'','構成メモ'),hint:string(t.hint??'','発想ヒント'),titles:strings(t.titles??[],'タイトル案')};}
export function validateState(raw,{legacy=false}={}) {
 const src=object(raw,'状態'), state=emptyState();
 if(!legacy&&src.schemaVersion!==2)throw new Error('未対応のデータバージョンです。');
 if(legacy){updateSettings(state,{stage:src.stage??'all',tone:src.tone??3,purpose:src.purpose??state.settings.purpose});}
 else{
  const settings=object(src.settings,'設定');
  updateSettings(state,{stage:settings.stage,tone:settings.tone,purpose:settings.purpose,themes:strings(settings.themes,'テーマ',3)});
  if(src.loadedWorkId!==null&&typeof src.loadedWorkId!=='string'&&typeof src.loadedWorkId!=='number')throw new Error('読み込み作品IDが不正です。');
  state.loadedWorkId=src.loadedWorkId;
 }
 const items=object(src.items??{},'項目'), locks=object(src.locks??{},'固定状態');
 for(const [key] of FIELDS){if(own(items,key))state.items[key]=validItem(items[key],{legacy});if(own(locks,key))state.locks[key]=bool(locks[key],'固定状態');}
 state.texts=validTexts(src.texts??{});
 if(!legacy){
  const chars=object(src.characters,'人物');
  for(const key of ['protagonist','counterpart'])state.characters[key].name=string(object(chars[key],'人物名').name,'人物名',100);
  const meta=object(src.metadata,'作品情報');state.metadata={name:string(meta.name,'保存名',200),tags:strings(meta.tags,'整理用タグ',10,30),notes:string(meta.notes,'自由メモ',10000)};
  const questions=object(src.questions,'質問');
  for(const [key] of QUESTION_CATEGORIES){
   const slots=questions[key];if(!Array.isArray(slots)||slots.length>3)throw new Error('質問枠が不正です。');
   state.questions[key]=slots.map(rawSlot=>{const slot=object(rawSlot,'質問枠');return {id:string(slot.id,'質問ID',200),text:string(slot.text,'質問文',2000),answer:string(slot.answer,'回答',2000),locked:bool(slot.locked,'質問の固定')};});
  }
 }
 return state;
}
export function validateWork(raw,{legacy=false}={}) {
 const src=object(raw,'保存作品');
 if(!legacy&&typeof src.id!=='string'&&typeof src.id!=='number')throw new Error('作品IDが不正です。');
 const state=validateState(legacy?src:src.state,{legacy});state.loadedWorkId=null;
 if(legacy)state.metadata.name=state.texts.titles[0]||'無題のタネ';
 const date=legacy?string(src.date??'','旧保存日'):'';
 const created=legacy?(date||new Date().toISOString()):string(src.createdAt,'作成日時');
 return {id:src.id??uid(),createdAt:created,updatedAt:legacy?created:string(src.updatedAt,'更新日時'),fav:bool(src.fav??(legacy?false:undefined),'お気に入り'),legacyDate:legacy?date:string(src.legacyDate??'','旧保存日'),state};
}
function validateBundle(raw){const bundle=object(raw,'保存領域');if(bundle.schemaVersion!==2)throw new Error('未対応の保存バージョンです。');if(!Array.isArray(bundle.works)||bundle.works.length>MAX_WORKS)throw new Error('保存作品数が上限を超えています。');const works=bundle.works.map(w=>validateWork(w));if(new Set(works.map(w=>String(w.id))).size!==works.length)throw new Error('保存作品IDが重複しています。');return {schemaVersion:2,current:bundle.current===null?null:validateState(bundle.current),works};}
export class Repository {
 constructor(storage){this.storage=storage;this.works=[];this.blocked=false;this.rawBackup=null;}
 load(){
  try{
   const raw=this.storage.getItem(STORAGE_KEY);
   if(raw){this.rawBackup=raw;const bundle=validateBundle(JSON.parse(raw));this.works=bundle.works;return {current:bundle.current,warnings:[]};}
   const oldCurrent=this.storage.getItem(OLD_KEYS[0]),oldWorks=this.storage.getItem(OLD_KEYS[1]);
   if(oldCurrent===null&&oldWorks===null)return {current:null,warnings:[]};
   const originals={state:oldCurrent,savedItems:oldWorks};this.rawBackup=JSON.stringify(originals);
   // 元キーは削除しない。バックアップと新領域の書き込みが成功した場合だけ移行完了。
   if(this.storage.getItem(BACKUP_KEY)===null)this.storage.setItem(BACKUP_KEY,this.rawBackup);
   const current=oldCurrent?validateState(JSON.parse(oldCurrent),{legacy:true}):null;
   const old=oldWorks?JSON.parse(oldWorks):[];if(!Array.isArray(old)||old.length>MAX_WORKS)throw new Error('旧保存作品の形式または件数が不正です。');
   const works=old.map(w=>validateWork(w,{legacy:true}));
   const bundle=validateBundle({schemaVersion:2,current,works});
   this.storage.setItem(STORAGE_KEY,JSON.stringify(bundle));this.works=bundle.works;
   return {current:bundle.current,warnings:['旧保存データを引き継ぎました。元データとバックアップを残しています。']};
  }catch(error){this.blocked=true;return {current:null,warnings:[`保存データを安全に読み込めませんでした：${error.message} 元データは残しています。画面下の「元データを取り出す」で保管できます。新規の作業はJSONで持ち出してください。`]};}
 }
 write(current,works=this.works){
  if(this.blocked)throw new Error('元データ保護のため、ブラウザへの書き込みを停止しています。JSONで取り出してください。');
  if(works.length>MAX_WORKS)throw new Error(`保存は${MAX_WORKS}件までです。バックアップ後に不要な作品を整理してください。`);
  try{this.storage.setItem(STORAGE_KEY,JSON.stringify({schemaVersion:2,current,works}));}catch{throw new Error('ブラウザに保存できませんでした。容量・ブラウザ設定を確認し、現在のタネをJSONで取り出してください。');}
  this.works=clone(works);
 }
 save(state,{overwrite=false}={}) {
  const now=new Date().toISOString();let work;
  const snapshot=clone(state);snapshot.loadedWorkId=null;
  snapshot.metadata.name=snapshot.metadata.name||snapshot.texts.titles[0]||'無題のタネ';
  let list=clone(this.works);
  if(overwrite){const index=list.findIndex(w=>w.id===state.loadedWorkId);if(index<0)throw new Error('上書きする作品が見つかりません。別名で保存してください。');work={...list[index],updatedAt:now,state:snapshot};list[index]=work;}
  else{if(list.length>=MAX_WORKS)throw new Error('保存は500件までです。');work={id:uid(),createdAt:now,updatedAt:now,fav:false,legacyDate:'',state:snapshot};list.push(work);}
  const current=clone(state);current.loadedWorkId=work.id;current.metadata.name=snapshot.metadata.name;
  this.write(current,list);return current;
 }
 duplicate(id,current){const original=this.works.find(w=>w.id===id);if(!original)throw new Error('作品が見つかりません。');const copy=clone(original.state);copy.loadedWorkId=null;copy.metadata.name=`${copy.metadata.name}（複製）`.slice(0,200);return this.save(copy);}
 remove(id,current){const list=this.works.filter(w=>w.id!==id);if(list.length===this.works.length)throw new Error('作品が見つかりません。');this.write(current,list);}
 favorite(id,current){const list=clone(this.works),work=list.find(w=>w.id===id);if(!work)throw new Error('作品が見つかりません。');work.fav=!work.fav;this.write(current,list);}
 addImported(works,current){
  if(this.works.length+works.length>MAX_WORKS)throw new Error('取り込み後の作品数が500件を超えます。');
  const used=new Set(this.works.map(w=>String(w.id)));
  const incoming=works.map(w=>{const copy=clone(w);if(used.has(String(copy.id)))copy.id=uid();used.add(String(copy.id));return copy;});
  this.write(current,[...this.works,...incoming]);return incoming.length;
 }
}
export function exportJSON(state,works=null,{sourceWork=null}={}) {
 const records=works??[{id:state.loadedWorkId??uid(),createdAt:sourceWork?.createdAt??new Date().toISOString(),updatedAt:new Date().toISOString(),fav:sourceWork?.fav??false,legacyDate:sourceWork?.legacyDate??'',state:clone(state)}];
 return JSON.stringify({app:APP_ID,schemaVersion:2,exportedAt:new Date().toISOString(),works:records},null,2);
}
export function inspectImport(text) {
 if(new TextEncoder().encode(text).length>MAX_BYTES)throw new Error('ファイルは5MiBまでです。');
 let raw;try{raw=JSON.parse(text);}catch{throw new Error('JSONを読み取れません。ファイルの内容を確認してください。');}
 let works,legacy=false;
 if(Array.isArray(raw)){works=raw;legacy=true;}
 else{object(raw,'バックアップ');if(raw.app!==APP_ID)throw new Error('このアプリのバックアップではありません。');if(raw.schemaVersion!==2)throw new Error('未対応のデータバージョンです。');works=raw.works;}
 if(!Array.isArray(works)||works.length>MAX_WORKS)throw new Error('作品は500件までです。');
 // 全件通過して初めて追加可能。未知のキーはstateにコピーしない。
 return works.map((work,index)=>{try{return validateWork(work,{legacy});}catch(e){throw new Error(`${index+1}件目：${e.message}`);}});
}
export function filterWorks(works,query='',favoritesOnly=false) {
 const needle=query.trim().toLocaleLowerCase();
 return works.filter(w=>(!favoritesOnly||w.fav)&&[w.state.metadata.name,w.state.texts.summary,w.state.metadata.notes,...w.state.metadata.tags].join('\n').toLocaleLowerCase().includes(needle)).sort((a,b)=>Number(b.fav)-Number(a.fav)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
