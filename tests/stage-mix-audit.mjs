import fs from 'node:fs';
import {DATA,BASIC} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {emptyState,updateSettings,rollFields,refreshTexts} from '../js/core.js';
import {STAGE_PAIRS,settingsForPair} from '../js/stage-selection.js';
import {stageMixData} from '../js/stage-mix-data.js';
import {mixReport,isBridge} from '../js/stage-mix.js';
import {availablePool} from '../js/priority.js';
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const setting=(pair,tone)=>{const s=emptyState();updateSettings(s,{...settingsForPair(pair),tone});return s;};
const categoryCounts=(s,data,world)=>Object.fromEntries(BASIC.map(([key])=>{const pool=availablePool(s,key,data,world?.contextTags||[]).pool;return [key,{eligible:pool.length,bridges:pool.filter(row=>isBridge(row,s.settings)).length,themeRelated:pool.filter(row=>row.themeTags.some(t=>s.settings.themes.includes(t))).length}];}));
const countRows=[],conditional=[],samples=[];
for(const [pair,label] of STAGE_PAIRS){
 for(let tone=1;tone<=5;tone++){
  const s=setting(pair,tone),data=stageMixData(s.settings,EXTRA_DATA),worlds=availablePool(s,'world',data,[]).pool;
  countRows.push({pair,tone,conditions:'固定なし・テーマなし・初回（直前除外なし）',worlds:worlds.length,bridgeWorlds:worlds.filter(row=>isBridge(row,s.settings)).length,categories:Object.fromEntries(BASIC.map(([key])=>{if(key==='world')return [key,{eligible:worlds.length,bridges:worlds.filter(row=>isBridge(row,s.settings)).length}];const counts=worlds.map(world=>categoryCounts(s,data,world)[key]);return [key,{eligibleMin:Math.min(...counts.map(c=>c.eligible)),eligibleMax:Math.max(...counts.map(c=>c.eligible)),bridgeMin:Math.min(...counts.map(c=>c.bridges)),bridgeMax:Math.max(...counts.map(c=>c.bridges))}];}))});
 }
 for(const tone of [1,3,5]){const s=setting(pair,tone),recent={},rng=rngFor(20261007);for(let n=1;n<=5;n++){const result=rollFields(s,undefined,{data:EXTRA_DATA,recent,rng});refreshTexts(s,{rng});samples.push({pair,label,tone,number:n,report:mixReport(s),notices:result.notices,items:Object.fromEntries(BASIC.map(([key,name])=>[key,{label:name,...s.items[key]}]))});}}
 const s=setting(pair,3),data=stageMixData(s.settings,EXTRA_DATA);s.settings.themes=['buddy','mystery','journey'];s.items.world={candidateId:null,text:'作者の背景なしの舞台',source:'custom',contextTags:[],stageTags:[],themeTags:[],blendPairs:[],tones:[],requiresContext:[]};s.locks.world=true;
 conditional.push({pair,conditions:'トーン3・手入力の背景なし世界観を固定・テーマbuddy/mystery/journey',counts:categoryCounts(s,data,s.items.world),result:rollFields(s,undefined,{data:EXTRA_DATA,rng:rngFor(7)}),report:mixReport(s)});
}
const output=new URL('../docs/round8/',import.meta.url);fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(new URL('candidate-pools.json',output),JSON.stringify({baseBasic:Object.values(DATA).flat().length,countRows,conditional},null,2)+'\n');
fs.writeFileSync(new URL('samples.json',output),JSON.stringify(samples,null,2)+'\n');
fs.writeFileSync(new URL('samples.md',output),['# 混合ガチャの実例45件','',...samples.flatMap(s=>[`## ${s.label} / トーン${s.tone} / ${s.number}`,'',s.report.text,...Object.values(s.items).map(item=>`- ${item.label}：${item.text}`),s.notices.length?`通知：${s.notices.join(' ')}`:'',''])].join('\n'));
console.log(JSON.stringify({samples:samples.length,unconditionalRows:countRows.length,conditionalRows:conditional.length}));
