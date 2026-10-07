import {selectedStages} from './stage-selection.js';
import {meetsContext} from './context.js';
export const MAJOR_FIELDS=['relation','incident','conflict','gimmick','twist'];
export function themeMask(item,themes){return themes.reduce((mask,t,i)=>mask|((item?.themeTags||[]).includes(t)?1<<i:0),0);}
export const bitCount=mask=>mask.toString(2).replaceAll('0','').length;
export function availablePool(state,key,data,context){
 let pool=(data[key]||[]).filter(item=>!item.tones.length||item.tones.includes(state.settings.tone));
 if(key==='world'&&state.settings.stage!=='all')pool=pool.filter(item=>state.settings.stage2?selectedStages(state.settings).some(stage=>item.stageTags.includes(stage)):item.stageTags.includes(state.settings.stage));
 const beforeContext=pool.length;
 if(key!=='world')pool=pool.filter(item=>meetsContext(item,context));
 const beforePrevious=pool.length;
 const previous=state.items[key];
 if(previous)pool=pool.filter(item=>item.id!==previous.candidateId&&item.text!==previous.text);
 return {pool,beforeContext,beforePrevious};
}
// 圧縮したテーマ組合せを使って、枠数・物語素材の枠・未反映テーマを同時に割り当てる。
// 枠の順序は乱数で変える。必要な優先枠だけ使い、残りは通常抽選へ戻す。
export function priorityPlan(keys,pools,themes,{baseMask=0,baseCount=0,baseMajor=0,target=3,majorTarget=2,rng=Math.random}={}){
 let states=new Map([[`${baseMask}:${Math.min(target,baseCount)}:${Math.min(majorTarget,baseMajor)}`,{mask:baseMask,count:Math.min(target,baseCount),major:Math.min(majorTarget,baseMajor),plan:{},size:0}]]);
 const order=[...keys];for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 for(const key of order){
  const profiles=[...new Set((pools[key]||[]).map(item=>themeMask(item,themes)).filter(Boolean))];
  const next=new Map(states);
  for(const current of states.values())for(const mask of profiles){
   const value={mask:current.mask|mask,count:Math.min(target,current.count+1),major:Math.min(majorTarget,current.major+Number(MAJOR_FIELDS.includes(key))),plan:{...current.plan,[key]:mask},size:current.size+1};
   const id=`${value.mask}:${value.count}:${value.major}`,old=next.get(id);
   if(!old||value.size<old.size)next.set(id,value);
  }
  states=next;
 }
 let best;
 for(const current of states.values()){
  // 全テーマへの配慮を優先し、条件が揃うと3カテゴリ・主要2カテゴリも満たす。
  const score=bitCount(current.mask)*100+current.count*10+current.major*3-current.size*0.01;
  if(!best||score>best.score)best={...current,score};
 }
 return best;
}
