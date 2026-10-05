import {ROUND4_THEMES} from './round4-data.js';
import {MODERN_PRO_THEMES,PROFESSIONAL_CONTEXTS} from './modern-pro-data.js';
export const CONTEXTS=[['beastfolk','獣人・知性ある人外'],['desert','砂漠'],['nomadic','移動・遊牧の暮らし'],['oasis','オアシス'],['royal','王族・宮廷'],['trade','交易'],['magic','魔法'],['spirit','精霊'],['artificial-intelligence','自律的なAI・人工知能'],['memory-tech','記憶・人格を保存／編集する技術や魔法'],['future-record','未来の記録や予告を参照できる仕組み'],...PROFESSIONAL_CONTEXTS];
export const PACKS=[['beastfolk','獣人・人外社会','異種族の暮らし、文化、交流'],['desert-court','砂漠・王国・宮廷','水と交易、隊商と宮廷の利害'],['romantasy','恋愛ファンタジー・契約恋愛','契約と本心、選び直せる関係'],['cozy-fantasy','日常ファンタジー・店と共同生活','魔法の仕事、小さな困りごと'],...ROUND4_THEMES,...MODERN_PRO_THEMES];
export const contextLabels=tags=>CONTEXTS.filter(([id])=>tags.includes(id)).map(([,label])=>label);
export function worldContext(state){return (state.items.world?.contextTags||[]).filter(t=>CONTEXTS.some(([id])=>id===t));}
export function meetsContext(item,context){return (item.requiresContext||[]).every(t=>CONTEXTS.some(([id])=>id===t)&&context.includes(t));}
// 定義済み候補だけに補完する。保存本文や手入力を検索して背景を推測しない。
const supplements={
 '獣人と人間が共存する国':{themeTags:['beastfolk'],contextTags:['beastfolk']},
 '砂漠の王国':{themeTags:['desert-court'],contextTags:['desert','royal']},
 '宮廷社会':{themeTags:['desert-court'],contextTags:['royal']},
 '王位継承争いの渦中にある国':{themeTags:['desert-court'],contextTags:['royal']},
 '宮廷陰謀劇':{themeTags:['desert-court'],contextTags:['royal'],requiresContext:['royal']},
 '王族と護衛':{themeTags:['desert-court'],contextTags:['royal'],requiresContext:['royal']},
 '主君と近侍':{contextTags:['royal']},
 '水路でつながる職人の都':{themeTags:['desert-court'],contextTags:['trade']},
 '精霊が店番をする市場':{themeTags:['cozy-fantasy'],contextTags:['magic','spirit','trade']},
 '精霊と契約する世界':{themeTags:['cozy-fantasy'],contextTags:['magic','spirit']},
 '魔物と共存する世界':{themeTags:['beastfolk'],contextTags:['magic']},
 '妖と人が共存する都':{themeTags:['beastfolk'],contextTags:['beastfolk','magic']},
 'ロボットと人が働く配送所':{contextTags:[]},
 '魔法世界':{contextTags:['magic']},'魔法学校':{contextTags:['magic']},
 '魔法が制度化された世界':{contextTags:['magic']},'魔法学院のある異世界':{contextTags:['magic']},
 '剣と魔法の王国':{contextTags:['magic','royal']},'竜と契約する王国':{contextTags:['magic','royal','beastfolk']},
 '契約神を持つ貴族社会':{contextTags:['magic','royal']},'呪いが制度に組み込まれた世界':{contextTags:['magic']},
 '竜が支配する王国':{contextTags:['magic','royal','beastfolk']},
 '言霊が力を持つ世界':{contextTags:['magic']},'和歌や言霊に力が宿る世界':{contextTags:['magic']},
 '精霊と道具を直す修理屋':{themeTags:['cozy-fantasy'],contextTags:['magic','spirit'],requiresContext:['magic','spirit']},
 '精霊にも読みやすい案内板を作りたい':{themeTags:['cozy-fantasy'],contextTags:['spirit'],requiresContext:['spirit']},
 '精霊の言葉が分かるが恥ずかしくて黙っている':{contextTags:['spirit'],requiresContext:['spirit']},
 '人間の郵便係と精霊の受取人':{themeTags:['cozy-fantasy'],contextTags:['spirit'],requiresContext:['spirit']},
 '小さな精霊が引っ越しを手伝ってほしいと言う':{themeTags:['cozy-fantasy'],contextTags:['spirit'],requiresContext:['spirit']},
 '精霊は願いを叶えるより話を聞いてほしかった':{themeTags:['cozy-fantasy'],contextTags:['spirit'],requiresContext:['spirit']},
 '香りで道順を教える地図':{contextTags:['magic'],requiresContext:['magic']},
 '一度だけ願いを聞く小さな道具':{contextTags:['magic'],requiresContext:['magic']},
 '声の代わりに色で返事をする精霊':{themeTags:['cozy-fantasy'],contextTags:['spirit'],requiresContext:['spirit']},
 '名を伏せて敵側へ手紙を送っている':{themeTags:['desert-court']}
};
const magicMechanisms=['和歌に宿る力','言霊','式神','血筋の加護','神宝','夢告','呪詛','神託','霊視','祓い','契約神','封印','巫術','祭祀','異界渡り','妖との婚約','もののけ憑き','名前を呼ばれると緩む封印'];
for(const text of magicMechanisms)supplements[text]={contextTags:['magic'],requiresContext:['magic']};
export function supplementDefinition(item,key){
 const patch=supplements[item.text];
 const professional=key==='world'?PROFESSIONAL_WORLD_PATCHES[item.id]:null;
 return {...item,stageTags:[...item.stageTags],themeTags:[...new Set([...item.themeTags,...(patch?.themeTags||[])])],contextTags:[...new Set([...(item.contextTags||[]),...(patch?.contextTags||[]),...(professional||[])])],requiresContext:key==='world'?[]:[...new Set([...(item.requiresContext||[]),...(patch?.requiresContext||[])])]};
}
export const PROFESSIONAL_WORLD_PATCHES=Object.freeze({'world-original-26tx1z':['company'],'world-original-o07rlu':['medical'],'world-original-12aasa0':['education'],'world-original-1yvablk':['education']});
export const SUPPLEMENT_TEXTS=Object.keys(supplements);
