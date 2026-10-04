import { QUESTION_DATA } from './extra-data.js';
import { meetsContext,worldContext } from './context.js';
import { weightedPick } from './core.js';
export function drawQuestions(state,category,{index=null,clearAnswer=false,rng=Math.random}={}) {
 if(!Object.hasOwn(QUESTION_DATA,category))throw new Error('質問の区分が不正です。');
 const slots=state.questions[category];
 let changed=0;
 for(let i=0;i<3;i++){
  if(index!==null&&i!==index)continue;
  const old=slots[i];
  if(old&&(old.locked||old.answer)&&!clearAnswer)continue;
  const used=slots.filter((_,j)=>j!==i).map(s=>s.id);
  const context=worldContext(state);
  const pool=QUESTION_DATA[category].map((entry,n)=>typeof entry==='string'?{id:`question-${category}-${n+1}`,text:entry,themeTags:[],requiresContext:[]}:entry).filter(q=>q.id!==old?.id&&!used.includes(q.id)&&meetsContext(q,context));
  if(!pool.length)continue;
  const related=pool.filter(q=>q.themeTags.some(t=>state.settings.themes.includes(t)));
  const picked=weightedPick(related.length?related:pool,q=>1+(q.requiresContext?.length||0),rng);
  slots[i]={id:picked.id,text:picked.text,answer:'',locked:false};changed++;
 }
 return {changed,notice:changed?'':'回答済み・固定中の質問は残しました。回答を消す操作を選ぶと引き直せます。'};
}
export function answerQuestion(state,category,index,answer) {
 if(answer.length>2000)throw new Error('回答は2,000文字までです。');
 const slot=state.questions[category]?.[index];if(!slot)throw new Error('質問がありません。');
 if(slot.answer===answer)return false;
 slot.answer=answer; if(answer.trim())slot.locked=true;
 return true;
}
