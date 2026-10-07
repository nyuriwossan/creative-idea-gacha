import fs from 'node:fs';
import {BASIC,STAGES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {emptyState,rollFields} from '../js/core.js';
import {knownLinks} from '../js/cohesion.js';
const before=Object.fromEntries(Object.entries(EXTRA_DATA).map(([key,rows])=>[key,rows.filter(r=>r.origin!=='abstract-seed')]));
const rngFor=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const abstract=id=>id?.startsWith('ab-');
const scenes=['scene.opening','scene.goal','scene.problem','scene.question'];
function audit(data){const s=emptyState();Object.assign(s.settings,{stage:'all',tone:3,purpose:'AIキャラプロットの種',themes:[],coherence:'cohesive'});const recent={},rng=rngFor(20261007),abstractCounts={conflict:0,twist:0},counts=Object.fromEntries(scenes.map(k=>[k,{}]));let matched=0;const examples=[];
 for(let n=1;n<=1000;n++){rollFields(s,undefined,{data,recent,rng});rollFields(s,scenes,{data,recent,rng});for(const key of ['conflict','twist'])if(abstract(s.items[key].candidateId))abstractCounts[key]++;if(knownLinks(s.items.conflict).some(l=>knownLinks(s.items.twist).includes(l)))matched++;for(const k of scenes){const id=s.items[k].candidateId;counts[k][id]=(counts[k][id]||0)+1;}if(examples.length<30&&BASIC.some(([k])=>abstract(s.items[k].candidateId)))examples.push({number:n,stage:s.items.world.stageTags,items:structuredClone(s.items)});}
 return {conditions:s.settings,draws:1000,seed:20261007,abstractCounts,abstractPercent:Object.fromEntries(Object.entries(abstractCounts).map(([k,n])=>[k,n/10])),matched,matchedPercent:matched/10,sceneTop:Object.fromEntries(Object.entries(counts).map(([key,byId])=>{const [id,count]=Object.entries(byId).sort((a,b)=>b[1]-a[1])[0];return [key,{id,count,percent:count/10}];})),examples};}
const baseline=audit(before),current=audit(EXTRA_DATA);
// Separate stage-specific samples prevent a random all-stage draw from standing in for every setting.
const stageSamples=[];for(const [stage,label] of STAGES.filter(([id])=>id!=='all')){const s=emptyState();Object.assign(s.settings,{stage,tone:3,purpose:'AIキャラプロットの種'});const recent={},rng=rngFor(20261007);let count=0;for(let n=1;n<=500&&count<3;n++){rollFields(s,undefined,{data:EXTRA_DATA,recent,rng});if(BASIC.some(([key])=>abstract(s.items[key].candidateId))){stageSamples.push({stage,label,number:n,items:structuredClone(s.items)});count++;}}}
const out=new URL('../docs/round6-b/',import.meta.url);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(new URL('usability-audit.json',out),JSON.stringify({baseline,current,stageSamples},null,2)+'\n');
fs.writeFileSync(new URL('samples.md',out),['# 抽象素材が出た30件（作者確認用）','', '舞台すべて・トーン3・AIキャラプロットの種・まとまり重視・固定なし・テーマなし。指定seedの抽選順。場面も毎回引いています。',...current.examples.flatMap(s=>[`\n## 抽選 ${s.number}`, ...Object.entries(s.items).filter(([,i])=>i).map(([key,i])=>`- ${key}${abstract(i.candidateId)?'【追加素材】':''}：${i.text}`)]),'\n# 舞台別27件',...stageSamples.flatMap(s=>[`\n## ${s.label} / 抽選 ${s.number}`,...BASIC.map(([key,label])=>`- ${label}${abstract(s.items[key].candidateId)?'【追加素材】':''}：${s.items[key].text}`)])].join('\n')+'\n');
console.log(JSON.stringify({baseline:{matchedPercent:baseline.matchedPercent,sceneTop:baseline.sceneTop},current:{abstractPercent:current.abstractPercent,matchedPercent:current.matchedPercent,sceneTop:current.sceneTop},samples:current.examples.length,stageSamples:stageSamples.length}));
