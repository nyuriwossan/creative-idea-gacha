// 「他から選ぶ」：今の設定・固定のまま、1項目ぶんの候補を最大10個並べる。
// 抽選そのものは既存の rollFields に任せ、渡された state と recent は一切変更しない。
import {clone,rollFields} from './core.js';
import {coreForField} from './seed-core.js';

export const PICK_COUNT=10;

export function candidateLabel(item,key){return coreForField(item,key)||item?.text||'';}

export function candidatesFor(state,key,{n=PICK_COUNT,data,recent={},rng=Math.random}={}){
 const tmpRecent=clone(recent),current=candidateLabel(state.items[key],key),seen=new Set([current]),out=[];
 for(let attempt=0;attempt<n*4&&out.length<n;attempt++){
  // 毎回もとの state から試す：直前の候補ではなく「今の項目」を避ける条件のまま、直近を避ける重みでばらけさせる。
  const tmp=clone(state);tmp.locks[key]=false;
  const result=rollFields(tmp,[key],{data,recent:tmpRecent,rng});
  if(!result?.changed){if(result?.notices?.length)break;continue;}
  const item=tmp.items[key],label=candidateLabel(item,key);
  if(!label||seen.has(label))continue;
  seen.add(label);out.push(clone(item));
 }
 return out;
}
