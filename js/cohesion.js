import {ROUND4_BASIC} from './round4-data.js';
import {ROUND4_CHARACTERS,ROUND4_PROGRESSION} from './round4-extra.js';
import {SCENE_DATA} from './scene-data.js';
import {TOPICS,STORY_PATCHES} from './story-metadata.js';
import {STORY_BASIC,STORY_PROGRESS} from './story-data.js';
export const COHERENCE=[['cohesive','まとまり重視'],['mix','自由に混ぜる']];
const topics=new Set(TOPICS.map(([id])=>id));
const links=new Set([...Object.values(STORY_PATCHES),...Object.values(STORY_BASIC).flat(),...Object.values(STORY_PROGRESS).flat(),...Object.values(SCENE_DATA).flat(),...Object.values(ROUND4_BASIC).flat(),...Object.values(ROUND4_CHARACTERS).flat(),...Object.values(ROUND4_PROGRESSION).flat()].flatMap(r=>r.plotLinks));
export const knownTopics=item=>(item?.topicTags||[]).filter(t=>topics.has(t));
export const knownLinks=item=>(item?.plotLinks||[]).filter(t=>links.has(t));
export const COHESION_WEIGHTS={topicMatch:3,plotLinkMatch:4,storyAnchorMatch:1.5,maxMultiplier:8,pairPreference:1.3};
export function focusTopics(state,rng=()=>0){
 const scores=new Map();
 for(const key of ['world','relation','incident','conflict','gimmick','twist']){
  if(key!=='world'&&!state.locks[key])continue;const item=state.items[key];
  for(const topic of knownTopics(item)){const score=(key==='world'?3:4)+(item.themeTags?.some(t=>state.settings.themes.includes(t))?2:0);scores.set(topic,Math.max(scores.get(topic)||0,score));}
 }
 const remaining=[...scores],chosen=[];
 while(remaining.length&&chosen.length<2){let n=rng()*remaining.reduce((s,[,v])=>s+v,0),index=remaining.findIndex(([,v])=>(n-=v)<0);if(index<0)index=remaining.length-1;chosen.push(remaining.splice(index,1)[0][0]);}
 return chosen;
}
export function cohesionMultiplier(item,state,key,axes=focusTopics(state)){
 if(state.settings.coherence!=='cohesive')return 1;
 const references=['relation','incident',...(key.startsWith('scene.')?['scene.goal','scene.opening','scene.problem']:[])].filter(k=>k!==key).map(k=>state.items[k]);
 const relatedTopics=new Set([...axes,...references.flatMap(knownTopics).filter(t=>axes.includes(t))]);
 let factor=knownTopics(item).some(t=>relatedTopics.has(t))?COHESION_WEIGHTS.topicMatch:1;
 if(knownTopics(item).some(t=>axes.includes(t)&&references.some(r=>knownTopics(r).includes(t))))factor*=COHESION_WEIGHTS.storyAnchorMatch;
 const referenceLinks=key==='twist'?knownLinks(state.items.conflict):key.includes('.')||['ending','cost','obstacle','deadline'].includes(key)?['relation','incident','conflict','twist',...(key.startsWith('scene.')?['scene.goal','scene.opening','scene.problem'].filter(k=>k!==key):[])].flatMap(k=>knownLinks(state.items[k])):references.flatMap(knownLinks);
 if(knownLinks(item).some(t=>referenceLinks.includes(t)))factor*=COHESION_WEIGHTS.plotLinkMatch;
 return Math.min(factor,COHESION_WEIGHTS.maxMultiplier);
}
