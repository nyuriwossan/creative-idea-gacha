// 「素材から選ぶ」の計算部分（DOM なし）。分類・絞り込み・件数・条件の判定・保存用の形への変換。
// 条件の判定は既存の availablePool をそのまま使い、舞台・テーマの「重み」を必須条件に変えない。
// 渡された state・data は変更しない。
import {EXTRA_DATA} from './extra-data.js';
import {STAGE_MIX_BASIC,stageMixData} from './stage-mix-data.js';
import {availablePool} from './priority.js';
import {worldContext,contextLabels,meetsContext} from './context.js';
import {STAGES,STAGE_PAIRS,stagePairKey,selectedStages} from './stage-selection.js';
import {BASIC,TONES,THEMES} from './data.js';
import {coreForField} from './seed-core.js';

export const PAGE_SIZE=20;
const CHARACTER=/^(protagonist|counterpart)\./;
// 分類表の引き当て：基本7項目はそのまま、補助項目は共通の表（主人公・相手役は役割・目的・秘密を共有）。
export const browseGroup=key=>key.replace(CHARACTER,'');
export function browseTable(key,{basicTaxonomy,basicMap,extraTaxonomy,extraMap}){
 if(basicTaxonomy[key])return {taxonomy:basicTaxonomy[key],map:basicMap[key]};
 const group=browseGroup(key),shared=extraMap[group]||{},person=CHARACTER.exec(key)?.[1];
 return {taxonomy:extraTaxonomy[group]||[],map:person?Object.fromEntries(Object.entries(shared).map(([id,paths])=>[`${person}-${id}`,paths])):shared};
}
// 抽選時に state へ写さない、集計・出典用の内部属性（core.js / stage-mix.js の pick と同じ並び）。
const INTERNAL_FIELDS=['id','origin','key','primaryPack','storyGroup','round4Group','primaryStage','stageFillBatch','modernProCategory','modernProBatch'];
const copy=value=>JSON.parse(JSON.stringify(value));

// 素材の行 → 保存用の項目（candidateId 付き）。通常抽選・舞台の組み合わせ抽選と同じ形にする。
export function toStateItem(row){
 const fields=copy(row);for(const name of INTERNAL_FIELDS)delete fields[name];
 return {...fields,blendPairs:fields.blendPairs||[],candidateId:row.id};
}
export function rowLabel(row,key){return coreForField(toStateItem(row),key)||row.text;}

// 対象項目の全登録素材（安定した順）。今の舞台の組み合わせで注記される素材は注記後の形、
// 複合舞台用の追加素材は組み合わせを問わず末尾に、データの順で並べる。
export function catalog(key,settings,data=EXTRA_DATA){
 const active=stageMixData(settings,{[key]:data[key]||[]})[key];
 const byId=new Map(active.map(row=>[row.id,row]));
 return [...(data[key]||[]).map(row=>byId.get(row.id)||row),...(STAGE_MIX_BASIC[key]||[]).map(row=>byId.get(row.id)||row)];
}

// 今の条件で通常の抽選に入る素材（直前の素材の除外だけは外す）。
export function fittingIds(state,key,data=EXTRA_DATA){
 const probe={...state,items:{...state.items,[key]:null}};
 const context=key==='world'?[]:worldContext(state);
 return new Set(availablePool(probe,key,stageMixData(state.settings,data),context).pool.map(row=>row.id));
}

const stageName=id=>STAGES.find(([key])=>key===id)?.[1]||id;
const pairName=id=>STAGE_PAIRS.find(([key])=>key===id)?.[1]||id;
// 条件外の理由。利用者向けの短い日本語だけを返す（内部IDは出さない）。
export function misfitReasons(state,key,row){
 const reasons=[],settings=state.settings,pair=stagePairKey(settings);
 if(row.tones?.length&&!row.tones.includes(settings.tone))reasons.push(`トーンが異なる（${row.tones.map(t=>TONES[t-1]).join('・')}向け）`);
 const mixOnly=(STAGE_MIX_BASIC[key]||[]).some(r=>r.id===row.id);
 if(mixOnly&&!(row.blendPairs||[]).includes(pair))reasons.push(`複合舞台用（${(row.blendPairs||[]).map(pairName).join('・')}）`);
 if(key==='world'&&settings.stage!=='all'&&!mixOnly){
  const stages=selectedStages(settings);
  if(!stages.some(stage=>row.stageTags.includes(stage)))reasons.push(`舞台が異なる（${row.stageTags.map(stageName).join('・')||'舞台の指定なし'}）`);
 }
 if(key!=='world'&&!meetsContext(row,worldContext(state))){
  const missing=(row.requiresContext||[]).filter(t=>!worldContext(state).includes(t));
  reasons.push(`必要な背景：${contextLabels(missing).join('・')||'未確認の要素'}`);
 }
 return reasons;
}

// 一覧の札。舞台・テーマ・必要な背景・世界の背景・複合舞台用。
export function rowTags(row,key){
 const tags=[];
 const stages=row.stageTags||[];if(stages.length)tags.push({kind:'stage',text:stages.map(stageName).join('・')});
 const mixOnly=(STAGE_MIX_BASIC[key]||[]).some(r=>r.id===row.id);
 if(mixOnly)tags.push({kind:'mix',text:`複合舞台用：${(row.blendPairs||[]).map(pairName).join('・')}`});
 const themes=(row.themeTags||[]).map(id=>THEMES.find(([k])=>k===id)?.[1]).filter(Boolean);if(themes.length)tags.push({kind:'theme',text:themes.slice(0,3).join('・')});
 if(key==='world'&&row.contextTags?.length)tags.push({kind:'context',text:`背景：${contextLabels(row.contextTags).join('・')}`});
 if(key!=='world'&&row.requiresContext?.length)tags.push({kind:'requires',text:`必要な背景：${contextLabels(row.requiresContext).join('・')}`});
 return tags;
}

// 検索の正規化：全角・半角、大文字・小文字、カタカナ・ひらがな、空白の違いを吸収する。
export function normalize(text){
 return String(text||'').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/\s+/g,'');
}

export const pathsOf=(map,id)=>(map[id]||'').split('|').filter(Boolean);
export function inBranch(paths,major='all',minor='all'){
 if(major==='all')return true;
 return paths.some(path=>minor==='all'?path.startsWith(major+'.'):path===`${major}.${minor}`);
}

// 絞り込み：範囲（条件に合う／すべて）→ 分類 → 検索。同じ素材は1回だけ（行はIDで一意）。
export function filterRows(rows,{map,key,major='all',minor='all',query='',fit=null}){
 const q=normalize(query);
 return rows.filter(row=>(!fit||fit.has(row.id))&&inBranch(pathsOf(map,row.id),major,minor)&&(!q||normalize(`${rowLabel(row,key)} ${row.text} ${row.titleWord||''}`).includes(q)));
}

// 分類ごとの件数（範囲だけを反映。検索は件数表示の外で扱う）。複数分類に入る素材も各分類で1件。
export function branchCounts(rows,{map,taxonomy,fit=null}){
 const scoped=fit?rows.filter(row=>fit.has(row.id)):rows;
 const majors={all:scoped.length},minors={};
 for(const major of taxonomy){
  majors[major.id]=scoped.filter(row=>inBranch(pathsOf(map,row.id),major.id)).length;
  for(const minor of major.minors)minors[`${major.id}.${minor.id}`]=scoped.filter(row=>inBranch(pathsOf(map,row.id),major.id,minor.id)).length;
 }
 return {majors,minors};
}

// 「この中からガチャ」：候補群から1件。今のプレビューと別の候補を優先し、1件なら single を返す。
export function drawFrom(list,currentId=null,rng=Math.random){
 if(!list.length)return {row:null,single:false};
 if(list.length===1)return {row:list[0],single:true};
 const pool=list.filter(row=>row.id!==currentId);
 return {row:pool[Math.floor(rng()*pool.length)]||pool[0],single:false};
}

// 世界観を差し替えたあと、他の基本項目のうち新しい背景と合わなくなるもの（自動では引き直さない）。
export function contextMismatches(state,world){
 const context=(world?.contextTags||[]);
 return BASIC.filter(([key])=>key!=='world').map(([key,label])=>{
  const item=state.items[key];if(!item||item.source!=='generated')return null;
  const missing=(item.requiresContext||[]).filter(t=>!context.includes(t));
  return missing.length?{key,label,missing:contextLabels(missing)}:null;
 }).filter(Boolean);
}
