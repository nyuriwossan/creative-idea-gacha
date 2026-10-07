export const NEW_PAIRS=['modern+fantasy','wafu+fantasy','scifi+research'];
export function stripExpansion(file,source){
 if(file==='js/stage-selection.js')return source.replace(",['modern+fantasy','現代 × ファンタジー'],['wafu+fantasy','和風 × ファンタジー'],['scifi+research','SF × 研究施設']",'');
 if(file==='js/stage-mix-data.js')return source.replace("import {STAGE_EXPANSION_ROWS} from './stage-expansion-data.js';\n",'').replace('STAGE_MIX_ROWS=[...STAGE_EXPANSION_ROWS,','STAGE_MIX_ROWS=[');
 return source;
}
