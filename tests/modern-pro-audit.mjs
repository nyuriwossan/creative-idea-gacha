import {pathToFileURL} from 'node:url';
import {DATA,BASIC,TONES} from '../js/data.js';
import {MODERN_PRO_BASIC,MODERN_PRO_A,MODERN_PRO_B,PROFESSIONAL_CONTEXTS} from '../js/modern-pro-data.js';
import {meetsContext} from '../js/context.js';
export function modernProCounts(data){return Object.fromEntries(['love','office','police','education','medical'].map(c=>[c,Object.fromEntries(BASIC.map(([key])=>[key,data[key].filter(r=>r.modernProCategory===c).length]))]));}
export function auditModernPro(){
 const rows=Object.values(MODERN_PRO_BASIC).flat(),links=[...new Set(rows.flatMap(r=>r.plotLinks))];
 const total=Object.fromEntries(BASIC.map(([key])=>[key,DATA[key].length]));
 const modern=Object.fromEntries(BASIC.map(([key])=>[key,TONES.map((_,i)=>DATA[key].filter(r=>r.stageTags.includes('modern')&&r.tones.includes(i+1)).length)]));
 const professions=Object.fromEntries(PROFESSIONAL_CONTEXTS.map(([tag])=>[tag,Object.fromEntries(BASIC.map(([key])=>[key,DATA[key].filter(r=>(key==='world'?r.contextTags:r.requiresContext).includes(tag)).length]))]));
 const pools=PROFESSIONAL_CONTEXTS.flatMap(([tag])=>TONES.map((_,i)=>{
  const tone=i+1,worlds=DATA.world.filter(w=>w.stageTags.includes('modern')&&w.tones.includes(tone)&&w.contextTags.includes(tag));
  return {tag,tone,worlds:worlds.length,fields:Object.fromEntries(BASIC.slice(1).map(([key])=>{
   const counts=worlds.map(w=>DATA[key].filter(r=>r.tones.includes(tone)&&r.stageTags.includes('modern')&&meetsContext(r,w.contextTags)).length);
   const jobCounts=worlds.map(w=>DATA[key].filter(r=>r.tones.includes(tone)&&r.requiresContext.includes(tag)&&meetsContext(r,w.contextTags)).length);
   return [key,{modern:counts.length?[Math.min(...counts),Math.max(...counts)]:null,profession:jobCounts.length?[Math.min(...jobCounts),Math.max(...jobCounts)]:null}];
  }))};
 }));
 return {total,basicTotal:Object.values(total).reduce((a,b)=>a+b,0),A:modernProCounts(MODERN_PRO_A),B:modernProCounts(MODERN_PRO_B),added:modernProCounts(MODERN_PRO_BASIC),modernTones:modern,professions,pools,themeTagged:rows.filter(r=>r.themeTags.length).length,links:links.map(link=>({link,conflict:MODERN_PRO_BASIC.conflict.find(r=>r.plotLinks.includes(link))?.id,twist:MODERN_PRO_BASIC.twist.find(r=>r.plotLinks.includes(link))?.id}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(auditModernPro(),null,2));
