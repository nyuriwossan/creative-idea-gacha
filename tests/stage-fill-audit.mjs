import {DATA,BASIC,STAGES,TONES} from '../js/data.js';
import {pathToFileURL} from 'node:url';
import {STAGE_FILL_A,STAGE_FILL_B,STAGE_FILL_BASIC} from '../js/stage-fill-data.js';
import {meetsContext} from '../js/context.js';
export function stageTables(data){
 const counts=Object.fromEntries(BASIC.map(([key])=>[key,data[key].length]));
 const stageCategories=Object.fromEntries(STAGES.slice(1).map(([stage])=>[stage,Object.fromEntries(BASIC.map(([key])=>[key,data[key].filter(r=>r.stageTags.includes(stage)).length]))]));
 const worldTones=Object.fromEntries(STAGES.slice(1).map(([stage])=>[stage,TONES.map((_,n)=>data.world.filter(r=>r.stageTags.includes(stage)&&r.tones.includes(n+1)).length)]));
 return {total:Object.values(counts).reduce((a,b)=>a+b,0),counts,stageCategories,worldTones,generic:Object.fromEntries(BASIC.map(([key])=>[key,data[key].filter(r=>!r.stageTags.length).length]))};
}
export function primaryCounts(data){
 return Object.fromEntries([...new Set(Object.values(data).flat().map(r=>r.primaryStage))].map(stage=>[stage,Object.fromEntries(BASIC.map(([key])=>[key,data[key].filter(r=>r.primaryStage===stage).length]))]));
}
export function contextPools(data){
 // 舞台タグ付き素材が、同舞台・同トーンのworldごとに何件使えるか。
 // 世界自体がない場合はnull。0件とは分ける。前回除外・固定・テーマ優先は含めない。
 return STAGES.slice(1).flatMap(([stage])=>TONES.map((_,n)=>{
  const tone=n+1,worlds=data.world.filter(w=>w.stageTags.includes(stage)&&w.tones.includes(tone));
  const fields=Object.fromEntries(BASIC.slice(1).map(([key])=>{
   const counts=worlds.map(w=>data[key].filter(r=>r.stageTags.includes(stage)&&r.tones.includes(tone)&&meetsContext(r,w.contextTags)).length);
   return [key,counts.length?{min:Math.min(...counts),max:Math.max(...counts)}:null];
  }));
  return {stage,tone,worlds:worlds.length,fields};
 }));
}
export function auditStageFill(){
 const rows=Object.values(STAGE_FILL_BASIC).flat(),old=Object.fromEntries(BASIC.map(([key])=>[key,DATA[key].filter(r=>r.origin!=='stage-fill')]));
 const links=[...new Set(rows.flatMap(r=>r.plotLinks))];
 return {
  before:stageTables(old),after:stageTables(DATA),A:primaryCounts(STAGE_FILL_A),B:primaryCounts(STAGE_FILL_B),combined:primaryCounts(STAGE_FILL_BASIC),
  addedTones:TONES.map((_,n)=>rows.filter(r=>r.tones.includes(n+1)).length),
  addedThemes:Object.fromEntries([...new Set(rows.flatMap(r=>r.themeTags))].map(tag=>[tag,rows.filter(r=>r.themeTags.includes(tag)).length])),
  themeTaggedA:Object.values(STAGE_FILL_A).flat().filter(r=>r.themeTags.length).length,
  backgrounds:rows.filter(r=>r.contextTags.length).map(({id,contextTags,requiresContext})=>({id,contextTags,requiresContext})),
  links:links.map(link=>({link,conflicts:STAGE_FILL_BASIC.conflict.filter(r=>r.plotLinks.includes(link)).map(r=>r.id),twists:STAGE_FILL_BASIC.twist.filter(r=>r.plotLinks.includes(link)).map(r=>r.id),relations:STAGE_FILL_BASIC.relation.filter(r=>r.plotLinks.includes(link)).map(r=>r.id)})),
  beforePools:contextPools(old),afterPools:contextPools(DATA)
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(auditStageFill(),null,2));
