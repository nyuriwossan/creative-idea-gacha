import { BASIC, DATA, PURPOSES, STAGES, TONES, THEMES } from './data.js';
import { CONTEXTS,worldContext,contextLabels } from './context.js';
import { availablePool,priorityPlan,themeMask,bitCount,MAJOR_FIELDS } from './priority.js';
export const clone = value => JSON.parse(JSON.stringify(value));
export const WEIGHTS = Object.freeze({stageMatch:4,generic:2,stageMismatch:0.25,themeMatch:3,contextMatch:1.5,recent:0.25,characterDuplicate:0.35});
export const OPTIONAL = [
 ['protagonist.role','主人公の立場・役割'],['protagonist.goal','主人公の目的'],['protagonist.secret','主人公の秘密'],
 ['counterpart.role','相手役の立場・役割'],['counterpart.goal','相手役の目的'],['counterpart.secret','相手役の秘密'],
 ['deadline','期限'],['obstacle','最大の障害'],['cost','代償（失うもの）'],['ending','結末の方向性']
];
export const FIELDS = [...BASIC,...OPTIONAL];
export const QUESTION_CATEGORIES = [['world','世界観'],['character','人物・関係性'],['plot','物語を動かす'],['consistency','設定を確かめる']];
export function emptyState() {
 return {schemaVersion:2,loadedWorkId:null,settings:{stage:'all',tone:3,purpose:PURPOSES[1],themes:[]},items:Object.fromEntries(FIELDS.map(([key])=>[key,null])),locks:Object.fromEntries(FIELDS.map(([key])=>[key,false])),characters:{protagonist:{name:''},counterpart:{name:''}},questions:Object.fromEntries(QUESTION_CATEGORIES.map(([key])=>[key,[]])),texts:{summary:'',memo:'',hint:'',titles:[]},metadata:{name:'',tags:[],notes:''}};
}
export function weightedPick(list, weightFn, rng=Math.random) {
 if(!list.length)return null;
 const weights=list.map(weightFn), total=weights.reduce((a,b)=>a+b,0);
 let cursor=rng()*total;
 for(let i=0;i<list.length;i++){cursor-=weights[i];if(cursor<0)return list[i];}
 return list.at(-1);
}
export function weightFor(item, state, key, recent=[]) {
 const world=state.items.world;
 const tags=world?.source==='custom' ? (state.settings.stage==='all'?[]:[state.settings.stage]) : (world?.stageTags||[]);
 let weight=key==='world'?1:!item.stageTags.length?WEIGHTS.generic:item.stageTags.some(t=>tags.includes(t))?WEIGHTS.stageMatch:WEIGHTS.stageMismatch;
 if(item.themeTags.some(t=>state.settings.themes.includes(t)))weight*=WEIGHTS.themeMatch;
 if((item.contextTags||[]).some(t=>worldContext(state).includes(t)))weight*=WEIGHTS.contextMatch;
 if(/\.(goal|secret)$/.test(key)){const other=key.startsWith('protagonist.')?key.replace('protagonist.','counterpart.'):key.replace('counterpart.','protagonist.');if(state.items[other]?.text===item.text)weight*=WEIGHTS.characterDuplicate;}
 if(recent.includes(item.id))weight*=WEIGHTS.recent;
 return weight;
}
export function rollFields(state, keys=BASIC.map(([k])=>k), {rng=Math.random,recent={},data=DATA}={}) {
 const notices=[],themes=state.settings.themes,allBasic=BASIC.every(([k])=>keys.includes(k));let changed=0;
 const related=item=>Boolean(themeMask(item,themes));
 function pick(key,pool){
  const picked=weightedPick(pool,x=>weightFor(x,state,key,recent[key]||[]),rng);
  const {id,origin,primaryPack,...fields}=clone(picked);state.items[key]={...fields,candidateId:id};
  recent[key]=[...(recent[key]||[]),picked.id].slice(-10);changed++;
 }
 function shortage(key,info){
  const label=FIELDS.find(([k])=>k===key)?.[1]||key;
  notices.push(`${label}：${!info.beforeContext?'舞台・トーンの候補が足りません':!info.beforePrevious?'必要な背景要素が確認できません':'この条件では別候補がありません'}。元の値を保ちました。`);
 }
 if(keys.includes('world')&&!state.locks.world){
  const info=availablePool(state,'world',data,[]);let pool=info.pool;
  if(!pool.length)shortage('world',info);
  else{
   if(themes.length){
    const relatedWorlds=pool.filter(related);
    if(relatedWorlds.length){
     // 他カテゴリで使えるテーマも考慮し、複数選択を支えられる世界を優先する。
     const potential=world=>{
      let mask=themeMask(world,themes);
      for(const key of keys.filter(k=>k!=='world')){if(state.locks[key])mask|=themeMask(state.items[key],themes);else for(const item of availablePool(state,key,data,world.contextTags||[]).pool)mask|=themeMask(item,themes);}
      return bitCount(mask);
     };
     const scores=relatedWorlds.map(potential),max=Math.max(...scores);pool=relatedWorlds.filter((_,i)=>scores[i]===max);
    }else notices.push('この舞台・トーンでは、選んだテーマに合う別の世界観がありません。舞台・トーンを保って引きます。');
   }
   pick('world',pool);
  }
 }
 const otherKeys=keys.filter(k=>k!=='world'),context=worldContext(state),pools={},infos={};
 for(const key of otherKeys)if(!state.locks[key]){infos[key]=availablePool(state,key,data,context);pools[key]=infos[key].pool;}
 const baseKeys=keys.filter(k=>k==='world'||state.locks[k]||!pools[k]?.length);
 const baseMask=baseKeys.reduce((mask,k)=>mask|themeMask(state.items[k],themes),0),baseCount=baseKeys.filter(k=>related(state.items[k])).length,baseMajor=baseKeys.filter(k=>MAJOR_FIELDS.includes(k)&&related(state.items[k])).length;
 const target=allBasic?3:keys.length>1?2:1,majorTarget=allBasic?Math.min(2,MAJOR_FIELDS.filter(k=>keys.includes(k)&&(state.locks[k]?related(state.items[k]):pools[k]?.some(related))).length):0;
 const plan=themes.length?priorityPlan(Object.keys(pools),pools,themes,{baseMask,baseCount,baseMajor,target,majorTarget,rng}).plan:{};
 for(const key of otherKeys){
  if(state.locks[key])continue;let pool=pools[key];if(!pool.length){shortage(key,infos[key]);continue;}
  if(plan[key])pool=pool.filter(item=>themeMask(item,themes)===plan[key]);
  pick(key,pool);
 }
 const relatedCount=keys.filter(k=>related(state.items[k])).length,mask=keys.reduce((m,k)=>m|themeMask(state.items[k],themes),0),unavailableThemes=[];
 if(themes.length){
  for(let i=0;i<themes.length;i++)if(!(mask&(1<<i))){
   const theme=themes[i],label=THEMES.find(([k])=>k===theme)?.[1]||theme;
   const candidates=keys.flatMap(k=>data[k]||[]).filter(item=>item.themeTags.includes(theme)&&(!item.tones.length||item.tones.includes(state.settings.tone)));
   const missing=[...new Set(candidates.flatMap(item=>item.requiresContext||[]).filter(t=>!context.includes(t)))];
   const reason=missing.length?`必要な世界の背景（${contextLabels(missing).join('・')||'未確認の要素'}）や固定状態を確認してください。`:'舞台・トーン・固定状態や、直前と異なる候補の不足を確認してください。';
   unavailableThemes.push({id:theme,reason});notices.push(`${label}を反映できませんでした。${reason}`);
  }
  if(relatedCount<target&&!unavailableThemes.length){
   const missing=[...new Set(otherKeys.flatMap(k=>data[k]||[]).filter(item=>related(item)&&(!item.tones.length||item.tones.includes(state.settings.tone))).flatMap(item=>item.requiresContext||[]).filter(t=>!context.includes(t)))];
   const labels=contextLabels(missing).slice(0,2);
   notices.push(labels.length?`今の世界には「${labels.join('・')}」などの背景が確認できず、テーマ素材を一部の項目に反映しました。世界観の編集で背景を指定できます。`:'固定中の項目やトーン・別候補の不足により、テーマ素材を一部の項目にだけ反映しました。');
  }
 }
 if(!changed&&!notices.length)notices.push('対象の項目はすべて固定中です。固定を解除すると引き直せます。');
 return {changed,notices,relatedCount,unavailableThemes};
}
export function editField(state,key,text,titleWord='',contextTags=[]) {
 if(!FIELDS.some(([k])=>k===key))throw new Error('不明な項目です。');
 if(!text.trim())throw new Error('空欄は反映できません。');
 if(text.length>500)throw new Error('本文は500文字までです。');
 if(titleWord.length>30)throw new Error('タイトル用の言葉は30文字までです。');
 if(!Array.isArray(contextTags)||contextTags.length>8||new Set(contextTags).size!==contextTags.length||contextTags.some(t=>!CONTEXTS.some(([id])=>id===t)))throw new Error('世界の背景要素が不正です。');
 const old=state.items[key],sameBackground=key!=='world'||JSON.stringify(old?.contextTags||[])===JSON.stringify(contextTags)||(old?.source!=='custom'&&!contextTags.length);
 if(old?.text===text&&old?.titleWord===titleWord&&sameBackground)return false;
 state.items[key]={candidateId:null,text,titleWord,source:'custom',stageTags:[],themeTags:[],tones:[],contextTags:key==='world'?[...contextTags]:[],requiresContext:[],...(key==='relation'?{relationShape:'neutral'}:{})};
 state.locks[key]=true; return true;
}
export function updateSettings(state, patch) {
 const next={...state.settings,...patch};
 if(!STAGES.some(([k])=>k===next.stage)||!Number.isInteger(next.tone)||next.tone<1||next.tone>5||!PURPOSES.includes(next.purpose))throw new Error('設定が不正です。');
 if(!Array.isArray(next.themes)||next.themes.length>3||new Set(next.themes).size!==next.themes.length||next.themes.some(x=>!THEMES.some(([k])=>k===x)))throw new Error('テーマは3つまで選べます。');
 state.settings=next;
}
export class History {
 constructor(state,limit=20){this.limit=limit;this.snapshots=[clone(state)];this.index=0;}
 record(state){if(JSON.stringify(state)===JSON.stringify(this.snapshots[this.index]))return false;this.snapshots=this.snapshots.slice(0,this.index+1);this.snapshots.push(clone(state));if(this.snapshots.length>this.limit)this.snapshots.shift();this.index=this.snapshots.length-1;return true;}
 undo(){if(this.index===0)return null;return clone(this.snapshots[--this.index]);}
 redo(){if(this.index>=this.snapshots.length-1)return null;return clone(this.snapshots[++this.index]);}
 get canUndo(){return this.index>0;} get canRedo(){return this.index<this.snapshots.length-1;}
}
const directions=[
 '小さなすれ違いから、助け合いや回復につながる道を考えてみる。',
 '日常の中に違和感を置き、気づく順番を考えてみる。',
 '望みがぶつかる場面で、何を選ぶのかを考えてみる。',
 '選択によって変わる信頼や、失われるものを考えてみる。',
 '引き返せない選択と、そのあとに残るものを考えてみる。'
];
export const textOf=(state,key)=>state.items[key]?.text||'';
// 候補には名詞と完全文が混在する。引用をラベル付きの独立した単位として扱い、
// 「神託が下る」が起きる、などの接続や述語の二重化を避ける。手入力にも同じ規則。
export function buildSummary(state) {
 const q=key=>`「${textOf(state,key)}」`;
 const base=`舞台は${q('world')}。${q('relation')}という関係を軸に描く、${q('genre')}のタネ。`;
 if(state.settings.purpose==='一言ネタ')return `舞台：${q('world')}。関係：${q('relation')}。発端：${q('incident')}。鍵：${q('gimmick')}。`;
 if(state.settings.purpose==='三題噺向け')return `三つのお題：${q('world')}・${q('gimmick')}・${q('incident')}。\n${q('relation')}という関係を手がかりに、三つのお題をどうつなぐか考えてみる。`;
 if(state.settings.purpose==='世界観メモ')return `舞台は${q('world')}。世界づくりの手がかりは${q('gimmick')}。${q('relation')}に関わる人々の暮らしや利害から、この世界を考えてみる。`;
 return `${base}\n物語の発端は${q('incident')}。葛藤の核は${q('conflict')}。\n${directions[state.settings.tone-1]}`;
}
export function buildMemo(state) {
 const q=key=>`「${textOf(state,key)}」`;
 const or=(key,fallback)=>textOf(state,key)?q(key):fallback;
 const purpose=state.settings.purpose;
 let outline;
 switch(purpose){
 case 'ショートストーリー向け': outline=[`発端：${q('world')}を舞台に、${q('incident')}を物語の入口にする。`,`行動と障害：${or('protagonist.goal','主人公の目的を決める')}。${textOf(state,'obstacle')?`障害の候補は${q('obstacle')}`:'目的を妨げる状況を考える'}。`,`選択：${q('conflict')}を踏まえて、何を優先するか。${textOf(state,'cost')?`代償の候補は${q('cost')}`:'手放す可能性のあるものを考える'}。`,`変化・余韻：${or('ending','結末の方向を考える')}。ひねりの候補${q('twist')}をどこまで明かすか決める。`,'提案：短い期間や少ない登場人物に絞ると、ひとつの変化を描きやすい。'];break;
 case '漫画1話向け':outline=[`つかみ：${q('world')}の印象的な風景や日常を見せる。`,`人物と関係：${q('relation')}が伝わる場面を置く。`,`事件：${q('incident')}を発端として見せる。`,`行動・障害：${or('protagonist.goal','その場で達成したいことを決める')}。${or('obstacle','動きを妨げるものを考える')}。`,`最後の引き：次の行動を気にさせる問いや発見を置く。${q('twist')}は今回明かす必要があるか検討する。`];break;
 case '連載プロット向け':outline=[`縦軸：${or('protagonist.goal','主人公が長く追う目的を決める')}。中心となる問いは${q('conflict')}を手がかりに考える。`,`横軸：${q('incident')}を入口に、各話で試せる課題や小さな変化を考える。`,`中盤の変化候補：${q('twist')}によって、それまでの理解がどう変わるか。`,`終盤の選択：${or('cost','最後に手放す可能性のあるものを決める')}。目的と関係のどちらをどう守るか。`,`結末の方向性：${or('ending','望む着地点を決める')}。`];break;
 case 'AIキャラプロットの種':outline=[`世界と関係：${q('world')}／${q('relation')}。`,`キャラ側の事情：${or('counterpart.secret',or('protagonist.secret','表に出せない事情を考える'))}。`,`ユーザーが関われる立場の候補：依頼人、協力者、近所の人、偶然出会った旅人など。性別や行動は相手が選べる余地を残す。`,`開始場面の候補：日常の挨拶、依頼の相談、偶然の遭遇、共同作業。発端${q('incident')}への関わり方は対話で選べるようにする。`,`対話で変化できる要素：信頼、協力の範囲、秘密を伝える時期など。${textOf(state,'ending')?`展開候補：${q('ending')}。`:'結末は対話の展開に応じて考える。'}`];break;
 case '世界観メモ':outline=[`制度：${q('gimmick')}を暮らしや仕組みにどう関わらせるか。`,'例外：規則から外れる人や場所はあるか。','暮らし：食事、移動、仕事、休息はどんな様子か。',`利害：${q('relation')}に関わる人々は、何で得をし、何に困るか。`];break;
 case '三題噺向け':outline=[`選んだ三要素：${q('world')}・${q('gimmick')}・${q('incident')}。`,'つなぎ方：一つを舞台、一つを道具、一つをきっかけとして扱うなど、役割から考える。',`関係：${q('relation')}。どの要素が関係の変化を生むか。`];break;
 default:outline=[`発端：${q('incident')}。`,`膨らませる問い：${q('conflict')}の中で、登場人物は何を選ぶか。`];
 }
 const details=[...BASIC,...OPTIONAL].filter(([k])=>textOf(state,k)).map(([key,label])=>`${label}：${textOf(state,key)}`);
 const names=Object.entries(state.characters).filter(([,c])=>c.name).map(([key,c])=>`${key==='protagonist'?'主人公':'相手役'}の表示名：${c.name}`);
 const extra=['期限','最大の障害','代償（失うもの）','結末の方向性'];
 return [...details,...names,'',`構成メモ｜${purpose}`,'以下は、選んだ素材を育てるための構成案です。',...outline.map((x,i)=>`${i+1}. ${x}`),...OPTIONAL.filter(([k,label])=>extra.includes(label)&&textOf(state,k)&&!outline.some(x=>x.includes(q(k)))).map(([k,label])=>`参照する設定｜${label}：${q(k)}`)].join('\n');
}
export function buildTitles(state,rng=Math.random) {
 const vocab=state.settings.tone<=2?['約束','日和','便り','はじまり','小さな灯り','寄り道']:state.settings.tone===3?['境界','行方','残響','証明','輪郭','帰路']:['残り火','影','終焉','沈黙','罪','夜明け'];
 const words=[...new Set(BASIC.map(([k])=>state.items[k]?.titleWord).filter(Boolean))];
 const a=words.length?words[Math.floor(rng()*words.length)]:vocab[Math.floor(rng()*vocab.length)];
 const b=vocab[Math.floor(rng()*vocab.length)];
 const pool=[`${a}の${b}`,`${b}を待つ場所`,`${a}と帰り道`,`${b}の向こう側`,`${a}、その先へ`];
 return sampleUnique([...new Set(pool)],3,rng);
}
export function sampleUnique(list,count,rng=Math.random){const pool=[...list],out=[];while(pool.length&&out.length<count)out.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);return out;}
export function buildHint(state,rng=Math.random) {
 const pool=[`発端「${textOf(state,'incident')}」の直前と直後では、誰の見え方が変わるだろう。`,`「${textOf(state,'gimmick')}」を、道具・制約・日常の習慣のどれとして描けるだろう。`,`関係「${textOf(state,'relation')}」に関わる人々は、何を言えずにいるだろう。`,`ひねりの候補「${textOf(state,'twist')}」につながる小さな予兆を、どこに置けるだろう。`,'同じ場面を別の立場から見ると、何が変わるだろう。','初めて協力できるのは、どんな小さな出来事のあとだろう。'];
 return sampleUnique(pool,3,rng).join('\n\n');
}
export function refreshTexts(state,{rng=Math.random,randomize=true,titlesOnly=false}={}) {
 if(titlesOnly){state.texts.titles=buildTitles(state,rng);return;}
 state.texts.summary=buildSummary(state);state.texts.memo=buildMemo(state);
 if(randomize||!state.texts.hint)state.texts.hint=buildHint(state,rng);
 if(randomize||!state.texts.titles.length)state.texts.titles=buildTitles(state,rng);
}
export function markdown(state) {
 const lines=[`# ${state.metadata.name||state.texts.titles[0]||'無題のタネ'}`,'',`舞台：${STAGES.find(([k])=>k===state.settings.stage)?.[1]} / トーン：${TONES[state.settings.tone-1]} / 用途：${state.settings.purpose}`,`抽選テーマ：${state.settings.themes.map(k=>THEMES.find(([t])=>t===k)?.[1]).join('、')||'お任せ'}`,`整理用タグ：${state.metadata.tags.join('、')||'なし'}`,'','## 要約','',state.texts.summary,'','## 設定と構成メモ','',state.texts.memo,'','## 発想ヒント','',state.texts.hint,'','## タイトル案','',...state.texts.titles.map(t=>`- ${t}`)];
 const background=contextLabels(state.items.world?.contextTags||[]);if(background.length)lines.push('','## 世界の背景要素','',background.join('、'));
 for(const [category,label] of QUESTION_CATEGORIES){const slots=state.questions[category];if(!slots.length)continue;lines.push('',`## 質問｜${label}`);for(const slot of slots)lines.push('',`### ${slot.text}`,'',slot.answer||'（未回答）');}
 if(state.metadata.notes)lines.push('','## 自由メモ','',state.metadata.notes);
 return lines.join('\n');
}
