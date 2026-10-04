// slug | 本文 | タイトル短語 | トーン | 舞台 | 関連テーマ | 背景 | 必須背景 | 関係の形
const split=value=>!value||value==='-'?[]:value.split(',');
export function define(pack,key,lines){return lines.trim().split('\n').map(line=>{
 const [slug,text,titleWord,tones='1234',stage='fantasy',themes='',context='',requires='',shape='pair']=line.trim().split('|');
 return {id:`${pack}-${key}-${slug}`,text,titleWord,tones:[...tones].map(Number),stageTags:split(stage),themeTags:[...new Set([pack,...split(themes)])],contextTags:split(context),requiresContext:key==='world'?[]:split(requires),source:'generated',origin:'theme-pack',primaryPack:pack,...(key==='relation'?{relationShape:shape}:{})};
});}
