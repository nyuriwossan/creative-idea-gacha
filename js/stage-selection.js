export const STAGES=[['all','すべて'],['modern','現代'],['western','西洋風'],['wafu','和風'],['fantasy','ファンタジー'],['isekai','異世界転生'],['scifi','SF'],['research','研究施設'],['underworld','裏社会'],['school','学園']];
export const STAGE_PAIRS=[['fantasy+school','学園 × ファンタジー'],['modern+underworld','現代 × 裏社会'],['fantasy+underworld','裏社会 × ファンタジー']];
export function normalizeStages(stage,stage2=null){
 if(!STAGES.some(([id])=>id===stage))throw Error('不明な舞台です。');
 if(stage2===null)return {stage,stage2:null};
 if(!STAGES.some(([id])=>id===stage2)||stage==='all'||stage2==='all'||stage===stage2)throw Error('舞台の組み合わせが不正です。');
 const pair=[stage,stage2].sort((a,b)=>STAGES.findIndex(([id])=>id===a)-STAGES.findIndex(([id])=>id===b));
 if(!STAGE_PAIRS.some(([key])=>key===pair.join('+')))throw Error('この舞台の組み合わせには対応していません。');
 return {stage:pair[0],stage2:pair[1]};
}
export const selectedStages=settings=>{const normalized=normalizeStages(settings.stage,settings.stage2??null);return normalized.stage2?[normalized.stage,normalized.stage2]:normalized.stage==='all'?[]:[normalized.stage];};
export const stagePairKey=settings=>settings.stage2?selectedStages(settings).join('+'):null;
export const stageLabel=settings=>stagePairKey(settings)?STAGE_PAIRS.find(([key])=>key===stagePairKey(settings))[1]:STAGES.find(([id])=>id===settings.stage)?.[1];
export function settingsForPair(key){const pair=STAGE_PAIRS.find(([id])=>id===key);if(!pair)throw Error('不明な組み合わせです。');const [stage,stage2]=pair[0].split('+');return normalizeStages(stage,stage2);}
export function validateBlendPairs(value){if(!Array.isArray(value)||value.length>3||new Set(value).size!==value.length||value.some(key=>typeof key!=='string'||!STAGE_PAIRS.some(([id])=>id===key)))throw Error('橋渡しの組み合わせが不正です。');return [...value];}
