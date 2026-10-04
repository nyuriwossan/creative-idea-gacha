import { QUESTION_DATA } from './extra-data.js';
export function drawQuestions(state,category,{index=null,clearAnswer=false,rng=Math.random}={}) {
 if(!Object.hasOwn(QUESTION_DATA,category))throw new Error('質問の区分が不正です。');
 const slots=state.questions[category];
 let changed=0;
 for(let i=0;i<3;i++){
  if(index!==null&&i!==index)continue;
  const old=slots[i];
  if(old&&(old.locked||old.answer)&&!clearAnswer)continue;
  const used=slots.filter((_,j)=>j!==i).map(s=>s.id);
  const pool=QUESTION_DATA[category].map((text,n)=>({id:`question-${category}-${n+1}`,text})).filter(q=>q.id!==old?.id&&!used.includes(q.id));
  if(!pool.length)continue;
  const picked=pool[Math.floor(rng()*pool.length)];
  slots[i]={...picked,answer:'',locked:false};changed++;
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
