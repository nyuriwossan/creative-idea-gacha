import {BASIC,THEMES} from './data.js';
import {stagePairKey,selectedStages,STAGES} from './stage-selection.js';
import {worldContext,meetsContext,contextLabels} from './context.js';
import {availablePool,themeMask,bitCount,MAJOR_FIELDS,priorityPlan} from './priority.js';
import {focusTopics} from './cohesion.js';
const copy=value=>JSON.parse(JSON.stringify(value));
export const isBridge=(item,settings)=>item?.source==='generated'&&Boolean(stagePairKey(settings))&&(item.blendPairs||[]).includes(stagePairKey(settings));
export function stageMask(item,settings,context){
 if(item?.source!=='generated'||!meetsContext(item,context))return 0;
 if(isBridge(item,settings))return 3;
 return selectedStages(settings).reduce((mask,stage,i)=>mask|((item.stageTags||[]).includes(stage)?1<<i:0),0);
}
export function mixBadge(item,settings,context){
 if(!stagePairKey(settings)||item?.source!=='generated')return '';
 const mask=stageMask(item,settings,context);
 if(!mask)return '';
 if(isBridge(item,settings))return '両方をつなぐ素材';
 if(mask===3)return '両舞台のタグあり';
 return STAGES.find(([id])=>id===selectedStages(settings)[mask===1?0:1])[1];
}
export function mixReport(state){
 if(!stagePairKey(state.settings))return null;
 const context=worldContext(state),counts=[0,0];let bridges=0,custom=false;
 for(const [key] of BASIC){const item=state.items[key],mask=stageMask(item,state.settings,context);counts[0]+=Number(Boolean(mask&1));counts[1]+=Number(Boolean(mask&2));if(MAJOR_FIELDS.includes(key)&&mask&&isBridge(item,state.settings))bridges++;if(item?.source==='custom')custom=true;}
 const weak=counts.map((count,i)=>count===0?STAGES.find(([id])=>id===selectedStages(state.settings)[i])[1]:null).filter(Boolean);
 const status=counts.every(n=>n>=2)&&bridges>=2?'両方をつなぐ素材あり':counts.every(n=>n>=1)?'二つの舞台の素材あり':'片側の素材が少なめ';
 const text=[status,`（基本7項目：${selectedStages(state.settings).map((s,i)=>`${STAGES.find(([id])=>id===s)[1]}${counts[i]}件`).join('・')}／主要な橋渡し${bridges}件）`,weak.length?`現在の素材では${weak.join('・')}側が少なめです。背景・固定・トーン・別候補の不足を確認できます。`:'',custom?'手入力を含むため自動判定は参考。':''].filter(Boolean).join(' ');
 return {counts,bridges,custom,status,text};
}
function profile(item,key,state,context){const mask=stageMask(item,state.settings,context),theme=themeMask(item,state.settings.themes);return [theme,Number(Boolean(theme)),Number(Boolean(theme)&&MAJOR_FIELDS.includes(key)),Number(Boolean(mask&1)),Number(Boolean(mask&2)),Number(Boolean(mask)&&MAJOR_FIELDS.includes(key)&&isBridge(item,state.settings))];}
const caps=[7,3,2,2,2,2];
const add=(a,b)=>a.map((n,i)=>i===0?n|b[i]:Math.min(caps[i],n+b[i]));
const signature=p=>p.join(':');
const planCache=new Map();
const profileCache=new WeakMap();
// Bounded dynamic programming over at most seven categories and eight theme masks.
// No text search, retry loop or relaxed background condition is involved.
export function mixedPlan(state,keys,pools,context,{rng}={}){
 keys=[...keys];
 if(rng)for(let i=keys.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[keys[i],keys[j]]=[keys[j],keys[i]];}
 const pair=stagePairKey(state.settings),stages=selectedStages(state.settings),themes=state.settings.themes;
 const cacheSignature=JSON.stringify([pair,themes,context]);
 const cachedProfile=(item,key)=>{
  if(!item)return [0,0,0,0,0,0];
  let cache=profileCache.get(item);if(!cache){cache=new Map();profileCache.set(item,cache);}
  const id=cacheSignature+Number(MAJOR_FIELDS.includes(key));
  if(!cache.has(id)){
   const valid=item.source==='generated'&&meetsContext(item,context),bridge=valid&&(item.blendPairs||[]).includes(pair);
   const mask=valid?(bridge?3:stages.reduce((m,s,i)=>m|((item.stageTags||[]).includes(s)?1<<i:0),0)):0,theme=themeMask(item,themes),major=MAJOR_FIELDS.includes(key);
   cache.set(id,[theme,Number(Boolean(theme)),Number(Boolean(theme)&&major),Number(Boolean(mask&1)),Number(Boolean(mask&2)),Number(bridge&&major)]);
  }
  return cache.get(id);
 };
 const baseKeys=BASIC.map(([key])=>key).filter(key=>!keys.includes(key)||!pools[key]?.length);
 const base=baseKeys.reduce((p,key)=>add(p,cachedProfile(state.items[key],key)),[0,0,0,0,0,0]);
 const groups=keys.filter(key=>pools[key]?.length).map(key=>[key,[...new Map(pools[key].map(item=>{const p=cachedProfile(item,key);return [signature(p),p];})).values()]]);
 const cacheKey=JSON.stringify([state.settings.themes.length,base,groups]);
 if(planCache.has(cacheKey))return planCache.get(cacheKey);
 let states=new Map([[signature(base),{values:base,plan:{}}]]);
 for(const [key,profiles] of groups){const next=new Map();for(const current of states.values())for(const p of profiles){const values=add(current.values,p),id=signature(values);if(!next.has(id))next.set(id,{values,plan:{...current.plan,[key]:signature(p)}});}states=next;}
 const targetMask=(1<<state.settings.themes.length)-1,hasThemes=Boolean(targetMask);
 let best;
 for(const current of states.values()){
  const [mask,count,major,a,b,bridge]=current.values;
  const complete=(!hasThemes||(mask===targetMask&&count>=3&&major>=2))&&a>=2&&b>=2&&bridge>=2;
  const score=Number(complete)*100000+bitCount(mask)*1000+(a+b+bridge)*30+(hasThemes?count*5+major*3:0);
  if(!best||score>best.score)best={...current,score,complete};
 }
 if(planCache.size>=1000)planCache.clear();planCache.set(cacheKey,best);return best;
}
export function worldGroup(item,settings){if(isBridge(item,settings))return 0;const selected=selectedStages(settings),mask=selected.reduce((m,s,i)=>m|(item.stageTags.includes(s)?1<<i:0),0);return mask===3?1:mask===1?2:3;}
export function worldWeights(pool,state,recent=[]){
 const groups=[0,1,2,3].map(group=>pool.filter(item=>worldGroup(item,state.settings)===group));
 const coefficients=item=>(item.themeTags.some(t=>state.settings.themes.includes(t))?3:1)*(recent.includes(item.id)?0.25:1);
 const totals=groups.map(rows=>rows.reduce((n,item)=>n+coefficients(item),0));
 return item=>[2,1,1,1][worldGroup(item,state.settings)]*coefficients(item)/totals[worldGroup(item,state.settings)];
}
export function rollMixedFields(original,keys,{data,recent,rng,weightFor}){
 const state=copy(original),trialRecent=copy(recent),notices=[],allBasic=BASIC.every(([k])=>keys.includes(k)),cohesive=state.settings.coherence==='cohesive';
 let changed=0,axes=[];
 const other=keys.filter(key=>key!=='world'),unlocked=other.filter(key=>!state.locks[key]);
 if(keys.every(key=>state.locks[key]))return {changed:0,aborted:true,notices:['対象の項目はすべて固定中です。固定を解除すると引き直せます。']};
 const poolsFor=world=>Object.fromEntries(unlocked.map(key=>[key,availablePool(state,key,data,world?.contextTags||[]).pool]));
 function pick(key,pool,weights){let n=rng()*pool.reduce((sum,item)=>sum+weights(item),0),picked=pool.at(-1);for(const row of pool)if((n-=weights(row))<0){picked=row;break;}
  const {id,origin,key:definitionKey,primaryPack,storyGroup,round4Group,primaryStage,stageFillBatch,modernProCategory,modernProBatch,...fields}=copy(picked);state.items[key]={...fields,blendPairs:fields.blendPairs||[],candidateId:id};trialRecent[key]=[...(trialRecent[key]||[]),id].slice(-10);changed++;
 }
 if(keys.includes('world')&&!state.locks.world){
  let worlds=availablePool(state,'world',data,[]).pool;
  if(!worlds.length)return {changed:0,aborted:true,notices:['世界観：舞台・トーン・直前と異なる候補が足りません。元の値を保ちました。']};
  const allWorlds=worlds;
  const contextPools=new Map(),getPools=world=>{const signature=JSON.stringify(world.contextTags||[]);if(!contextPools.has(signature))contextPools.set(signature,poolsFor(world));return contextPools.get(signature);};
  if(cohesive){const bridges=worlds.filter(world=>isBridge(world,state.settings)&&MAJOR_FIELDS.filter(key=>getPools(world)[key]?.some(item=>isBridge(item,state.settings))).length>=Math.min(2,unlocked.filter(k=>MAJOR_FIELDS.includes(k)).length));
   if(bridges.length)worlds=bridges;
  }
  const evaluation=new Map();
  const evaluate=world=>{if(!evaluation.has(world)){const draft={...state,items:{...state.items,world}},pools=getPools(world),plan=mixedPlan(draft,unlocked.filter(key=>BASIC.some(([k])=>k===key)),pools,world.contextTags||[]);evaluation.set(world,{plan,pools});}};
  worlds.forEach(evaluate);
  // If no preferred world can support a full themed plan, also inspect the union.
  // A complete joint plan elsewhere must not be hidden by bridge-world preference.
  if(cohesive&&state.settings.themes.length&&!worlds.some(world=>evaluation.get(world).plan.complete)){worlds=allWorlds;worlds.forEach(evaluate);}
  // Look ahead before picking: themes first, then available stage/bridge coverage.
  if(cohesive||state.settings.themes.length){const scores=worlds.map(world=>evaluation.get(world).plan.score),max=Math.max(...scores);worlds=worlds.filter((_,i)=>scores[i]===max);}
  pick('world',worlds,worldWeights(worlds,state,trialRecent.world||[]));
  if(cohesive&&!isBridge(state.items.world,state.settings))notices.push('この条件では、世界観を片側の既存素材から引きます');
 }
 const context=worldContext(state),infos=Object.fromEntries(unlocked.map(key=>[key,availablePool(state,key,data,context)])),pools=Object.fromEntries(unlocked.map(key=>[key,infos[key].pool]));
 axes=cohesive?focusTopics(state,rng):[];
 const joint=cohesive&&allBasic?mixedPlan(state,unlocked,pools,context,{rng}):null;
 const themes=state.settings.themes,baseKeys=keys.filter(key=>key==='world'||state.locks[key]||!pools[key]?.length),related=item=>Boolean(themeMask(item,themes));
 const themePlan=!joint&&themes.length?priorityPlan(unlocked,pools,themes,{baseMask:baseKeys.reduce((m,k)=>m|themeMask(state.items[k],themes),0),baseCount:baseKeys.filter(k=>related(state.items[k])).length,baseMajor:baseKeys.filter(k=>MAJOR_FIELDS.includes(k)&&related(state.items[k])).length,target:allBasic?3:keys.length>1?2:1,majorTarget:allBasic?2:0,rng}).plan:{};
 const order=cohesive?[...other].sort((a,b)=>['relation','incident','conflict','gimmick','twist','genre'].indexOf(a)-['relation','incident','conflict','gimmick','twist','genre'].indexOf(b)):other;
 for(const key of order){if(state.locks[key])continue;let pool=pools[key];if(!pool.length){notices.push(`${BASIC.find(([k])=>k===key)?.[1]||'素材'}：背景・トーン・別候補の不足で元の値を保ちました。`);continue;}
  if(joint?.plan[key])pool=pool.filter(item=>signature(profile(item,key,state,context))===joint.plan[key]);else if(themePlan[key])pool=pool.filter(item=>themeMask(item,themes)===themePlan[key]);
  pick(key,pool,item=>weightFor(item,state,key,trialRecent[key]||[],axes));
 }
 for(const key of keys)if(state.locks[key]&&state.items[key]&&!meetsContext(state.items[key],context))notices.push(`固定中の${BASIC.find(([k])=>k===key)?.[1]||'素材'}に必要な背景（${contextLabels((state.items[key].requiresContext||[]).filter(t=>!context.includes(t))).join('・')}）が確認できません。固定本文は残しました。`);
 const report=mixReport(state),mask=keys.reduce((m,k)=>m|themeMask(state.items[k],themes),0),unavailableThemes=[];
 for(let i=0;i<themes.length;i++)if(!(mask&(1<<i))){const reason='背景・固定・トーン・直前と異なる候補の不足を確認してください。';unavailableThemes.push({id:themes[i],reason});notices.push(`${THEMES.find(([id])=>id===themes[i])[1]}を反映できませんでした。${reason}`);}
 const relatedCount=keys.filter(key=>related(state.items[key])).length;
 if(allBasic&&themes.length&&(relatedCount<3||MAJOR_FIELDS.filter(k=>related(state.items[k])).length<2))notices.push('背景・固定・候補不足のため、テーマ素材3項目・主要2項目の配分を満たせませんでした。');
 if(allBasic&&cohesive&&(report.counts.some(n=>n<2)||report.bridges<2))notices.push(`背景・固定・候補不足のため、各舞台2項目・主要な橋渡し2項目の目標を満たせませんでした。${report.text}`);
 Object.assign(original,state);Object.assign(recent,trialRecent);
 return {changed,notices,relatedCount,unavailableThemes,focusTopics:axes};
}
