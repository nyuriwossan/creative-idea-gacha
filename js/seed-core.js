import {CORE_BY_ID as ROUND9_CORE_BY_ID,CORE_FIELD_BY_ID as ROUND9_CORE_FIELD_BY_ID} from './core-data.js';
import {SHORT_CORE_BY_ID,SHORT_CORE_FIELD_BY_ID} from './short-core-data.js';
// 第9回の核（葛藤・ギミック・ひねり）に、短い核（全項目）を重ねる。同じIDなら短い核を使う。
export const CORE_BY_ID=Object.freeze({...ROUND9_CORE_BY_ID,...SHORT_CORE_BY_ID});
export const CORE_FIELD_BY_ID=Object.freeze({...ROUND9_CORE_FIELD_BY_ID,...SHORT_CORE_FIELD_BY_ID});
import {EXTRA_DATA} from './extra-data.js';
import {BASIC} from './data.js';
export const DATA_TEXT_BY_ID=Object.freeze(Object.fromEntries(Object.values(EXTRA_DATA).flat().map(item=>[item.id,item.text])));
export const CORE_FIELDS=Object.freeze(['world','genre','relation','incident','conflict','gimmick','twist']);
export function coreFor(item,dataTextById=DATA_TEXT_BY_ID){
 if(!item||item.source!=='generated'||!Object.hasOwn(CORE_BY_ID,item.candidateId))return null;
 return Object.hasOwn(dataTextById,item.candidateId)&&dataTextById[item.candidateId]===item.text?CORE_BY_ID[item.candidateId]:null;
}
export function coreForField(item,key){return CORE_FIELDS.includes(key)&&CORE_FIELD_BY_ID[item?.candidateId]===key?coreFor(item):null;}
export const seedOf=(state,key)=>coreForField(state.items[key],key)||state.items[key]?.text||'';
export function materialLines(state,key,label){
 const item=state.items[key],core=coreForField(item,key);
 return core?[`${label}：${core}`,`具体例：${item.text}`]:[`${label}：${item?.text||''}`];
}
// Markdown is a presentation projection. Stored prose is never refreshed here.
// Existing material rows get the same two-line display as a newly built memo;
// historical memos without material rows retain their prose below a short list.
export function memoForMarkdown(state){
 const pending=new Map(BASIC.filter(([key])=>coreForField(state.items[key],key)).map(([key,label])=>[key,{label,lines:materialLines(state,key,label)}]));
 const original=state.texts.memo.split('\n');
 const lines=original.flatMap((line,index)=>{
  for(const [key,row] of pending){if(line===`${row.label}：${state.items[key].text}`){pending.delete(key);return row.lines;}if(line===row.lines[0]){pending.delete(key);return original[index+1]===row.lines[1]?[line]:row.lines;}}
  return [line];
 });
 return pending.size?[...[...pending.values()].flatMap(row=>row.lines),'',...lines].join('\n'):lines.join('\n');
}
export const CORE_EXAMPLE_NOTE='素材は発想の種です。「具体例」は一例なので、設定に合わせて自由に変えたり捨てたりして構いません。';
