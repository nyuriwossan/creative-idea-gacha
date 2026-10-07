import fs from 'node:fs';
import {BASIC} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {emptyState,rollFields,refreshTexts} from '../js/core.js';
import {coreForField} from '../js/seed-core.js';
const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},samples=[];
for(const [index,stage] of ['modern','scifi','wafu','research','school'].entries()){
 const state=emptyState(),recent={},rng=rngFor(20261007+index*1000);state.settings.stage=stage;state.settings.tone=3;
 let accepted=0;
 for(let draw=1;draw<=200&&accepted<6;draw++){
  const result=rollFields(state,undefined,{data:EXTRA_DATA,recent,rng});refreshTexts(state,{rng});
  if(!BASIC.some(([key])=>coreForField(state.items[key],key)))continue;
  samples.push({stage,tone:3,draw,notices:result.notices,items:Object.fromEntries(BASIC.map(([key,label])=>[key,{label,...state.items[key],core:coreForField(state.items[key],key)}])),texts:{...state.texts}});accepted++;
 }
 if(accepted!==6)throw Error(stage+' samples unavailable');
}
const out=new URL('../docs/round9/',import.meta.url);fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(new URL('samples.json',out),JSON.stringify(samples,null,2)+'\n');
fs.writeFileSync(new URL('samples.md',out),['# 核を含む通常抽選30例','',
'現代・SF・和風・研究施設・学園で各6例。トーン3・テーマなし・まとまり重視、各舞台でseedを固定して通常抽選し、核のある結果を記録。核の表示以外の抽選条件は変えていません。JSONのcoreは検証資料用の派生列で、アプリの保存には含めません。','',
...samples.flatMap((sample,i)=>[`## ${i+1}. ${sample.stage} / 抽選${sample.draw}`,'',...Object.values(sample.items).flatMap(item=>item.core?[`- ${item.label}の核：${item.core}`,`  - 具体例：${item.text}`]:[`- ${item.label}：${item.text}`]),sample.notices.length?`通知：${sample.notices.join(' ')}`:'',''])].join('\n')+'\n');
console.log(JSON.stringify({samples:samples.length,coreCounts:Object.fromEntries(['conflict','gimmick','twist'].map(key=>[key,samples.filter(sample=>sample.items[key].core).length]))}));
