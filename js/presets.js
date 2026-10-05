import {BASIC,THEMES} from './data.js';
import {EXTRA_DATA} from './extra-data.js';
import {clone,rollFields,updateSettings} from './core.js';
import {availablePool} from './priority.js';
import {worldContext,meetsContext,contextLabels} from './context.js';
export const MODERN_PRESETS=[
 {id:'lovers',label:'現代の恋人',themes:['modern-love','romance'],requiresContext:[]},
 {id:'secret-office',label:'秘密の社内恋愛',themes:['modern-love','romance','status-gap'],requiresContext:['company']},
 {id:'work-love',label:'仕事と恋愛の両立',themes:['modern-love','romance','daily-work'],requiresContext:[]},
 {id:'police',label:'警察と事件',themes:['workplace-pro','mystery'],requiresContext:['police']},
 {id:'education',label:'教師と学校の仕事',themes:['workplace-pro','daily-work'],requiresContext:['education']},
 {id:'medical',label:'医療と夜勤',themes:['workplace-pro','daily-work'],requiresContext:['medical']},
 {id:'company',label:'会社の再建',themes:['workplace-pro','daily-work','buddy'],requiresContext:['company']}
];
export function presetDescription(id){const p=MODERN_PRESETS.find(p=>p.id===id);if(!p)throw new Error('不明なプリセットです。');return `舞台：現代／テーマ：${p.themes.map(t=>THEMES.find(([key])=>key===t)[1]).join('・')}／今回の世界観に必要な背景：${contextLabels(p.requiresContext).join('・')||'指定なし'}。トーン・出力用途・抽選方針はそのままです。`;}
// 成功したstate/recentだけをUI側で一度に適用する。世界観の制約はこの呼び出し限り。
export function tryModernPreset(state,recent,id,{data=EXTRA_DATA,rng=Math.random}={}){
 const p=MODERN_PRESETS.find(p=>p.id===id);if(!p)throw new Error('不明なプリセットです。');
 const draft=clone(state),trialRecent=clone(recent);
 const failure=reason=>({ok:false,reason});
 if(draft.locks.world){
  const w=draft.items.world,stageOK=w&&(w.source==='custom'?['all','modern'].includes(state.settings.stage):w.stageTags.includes('modern'));
  if(!stageOK||!meetsContext({requiresContext:p.requiresContext},worldContext(draft)))return failure('世界観が固定中です。この方向で引くには世界観の固定を外すか、背景を編集してください。舞台が異なる手入力の世界観は、作者が舞台設定も変更してください。');
 }
 updateSettings(draft,{stage:'modern',themes:[...p.themes]});
 // 背景事実を後付けせず、明示された定義だけを今回のworld候補にする。
 const trialData={...data,world:(data.world||[]).filter(w=>p.requiresContext.every(tag=>(w.contextTags||[]).includes(tag)))};
 if(!draft.locks.world&&!availablePool(draft,'world',trialData,[]).pool.length)return failure('このトーンと職業背景では、直前と異なる世界観候補がありません。トーンや世界観の背景を確認してください。設定と抽選は適用していません。');
 const result=rollFields(draft,BASIC.map(([key])=>key),{data:trialData,recent:trialRecent,rng});
 const context=worldContext(draft);
 for(const [key,label] of BASIC.slice(1)){const row=draft.items[key];if(draft.locks[key]&&row&&!meetsContext(row,context))result.notices.push(`固定中の${label}に必要な背景（${contextLabels((row.requiresContext||[]).filter(t=>!context.includes(t))).join('・')||'未確認の要素'}）が今の世界観では確認できません。固定本文は残しました。`);}
 return {ok:true,state:draft,recent:trialRecent,...result};
}
