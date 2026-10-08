export const NEW_PAIRS=['modern+fantasy','wafu+fantasy','scifi+research'];
// 第7弾（world-expand）の配線は、既存ファイルに足した import と連結だけ。ここで外して、それ以前の版と比べる。
function stripWorldExpand(file,source){
 if(file==='js/data.js')return source.replace("import {WORLD_EXPAND_BASIC} from './world-expand-data.js';\n",'').replace(',WORLD_EXPAND_BASIC[key])',')');
 if(file==='js/extra-data.js')return source.replace("import {WORLD_EXPAND_CHARACTERS} from './world-expand-data.js';\n",'').replace(',...(WORLD_EXPAND_CHARACTERS[key]||[])]',']');
 if(file==='js/context.js')return source.replace("import {WORLD_EXPAND_CONTEXTS} from './world-expand-data.js';\n",'').replace(',...PROFESSIONAL_CONTEXTS,...WORLD_EXPAND_CONTEXTS];',',...PROFESSIONAL_CONTEXTS];');
 return source;
}
export function stripExpansion(file,source){
 source=stripWorldExpand(file,source);
 if(file==='js/stage-selection.js')return source.replace(",['modern+fantasy','現代 × ファンタジー'],['wafu+fantasy','和風 × ファンタジー'],['scifi+research','SF × 研究施設']",'');
 if(file==='js/stage-mix-data.js')return source.replace("import {STAGE_EXPANSION_ROWS} from './stage-expansion-data.js';\n",'').replace('STAGE_MIX_ROWS=[...STAGE_EXPANSION_ROWS,','STAGE_MIX_ROWS=[');
 return source;
}
