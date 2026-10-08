import fs from 'node:fs';
import {DATA,STAGES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {WORLD_REVISIONS} from '../js/world-revision-data.js';
import {emptyState} from '../js/core.js';
import {MODERN_PRESETS,tryModernPreset} from '../js/presets.js';
import {WORLD_EXPAND_BASIC} from '../js/world-expand-data.js';
export const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/world-restructure-baseline.json',import.meta.url),'utf8'));
const originals=new Map(baseline.world.map(row=>[row.id,row]));
const revisedIds=new Set(WORLD_REVISIONS.map(row=>row.id));
// 過去の素材追加テストでは、今回許可された本文・短語だけを逆正規化する。
// メタデータを元候補で丸ごと置き換えない。別の回帰テストで32件の新本文を照合する。
export function restoreReviewedText(row){const before=originals.get(row.id??row.candidateId);return before&&revisedIds.has(before.id)?{...row,text:before.text,titleWord:before.titleWord}:row;}
// 第7弾（world-expand）の世界観は32件の改修とは無関係に末尾へ足したもの。改修前の比較用データにも同じく足す。
export const priorData={...EXTRA_DATA,world:[...baseline.world,...WORLD_EXPAND_BASIC.world]};
export const historicalWorlds=rows=>rows.filter(r=>r.origin!=='world-expand');
export const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function countWorldPools(world){return {
 stages:Object.fromEntries(STAGES.slice(1).map(([stage])=>[stage,[1,2,3,4,5].map(tone=>world.filter(w=>w.stageTags.includes(stage)&&w.tones.includes(tone)).length)])),
 professions:Object.fromEntries(['company','police','medical','education'].map(tag=>[tag,[1,2,3,4,5].map(tone=>world.filter(w=>w.stageTags.includes('modern')&&w.contextTags.includes(tag)&&w.tones.includes(tone)).length)]))
};}
export function simulatePresets(data=EXTRA_DATA){return MODERN_PRESETS.flatMap(preset=>[1,2,3,4,5].map(tone=>{
 let state=emptyState(),recent={},successes=0;state.settings.tone=tone;const rng=rngFor(20261006),attempts=[];
 for(let n=0;n<20;n++){
  const before=JSON.stringify({state,recent}),result=tryModernPreset(state,recent,preset.id,{data,rng});
  if(!result.ok){attempts.push({ok:false,reason:result.reason,atomic:JSON.stringify({state,recent})===before});break;}
  state=result.state;recent=result.recent;successes++;attempts.push({ok:true,world:state.items.world.candidateId,items:Object.fromEntries(Object.entries(state.items).map(([key,item])=>[key,item?.candidateId??null])),settings:state.settings,context:state.items.world.contextTags,notices:result.notices,recent:structuredClone(recent)});
 }
 return {id:preset.id,label:preset.label,tone,successes,attempts};
}));}
export function auditWorldRestructure(){return {baseline:baseline.sha,world:DATA.world.length,basic:Object.values(DATA).flat().length,changed:WORLD_REVISIONS.length,poolsBefore:countWorldPools(baseline.world),poolsAfter:countWorldPools(DATA.world),presetsBefore:simulatePresets(priorData),presetsAfter:simulatePresets()};}
