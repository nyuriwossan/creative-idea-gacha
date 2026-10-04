import {validateHandoff} from './handoff-options.js';
import {clone,editField,refreshTexts} from './core.js';
import {answerQuestion} from './questions.js';

export class DraftError extends Error {
 constructor(errors){super('入力を確認してください。ほかの編集もまだ反映していません。');this.errors=errors;}
}
// UIから読み取った下書きを、原本に触れず一度に検証する。
export function prepareDrafts(state,{fields=[],answers=[],metadata=[],handoff}={}){
 const next=clone(state),errors=[];
 const attempt=(target,fn)=>{try{fn();}catch(error){errors.push({target,message:error.message});}};
 for(const f of fields){
  const start=errors.length;
  attempt(`field:${f.key}:text`,()=>{if(typeof f.text!=='string'||!f.text.trim())throw new Error('本文を入力してください。');if(f.text.length>500)throw new Error('本文は500文字までです。');});
  attempt(`field:${f.key}:short`,()=>{if(typeof f.titleWord!=='string'||f.titleWord.length>30)throw new Error('タイトル用の言葉は30文字までです。');});
  if(errors.length===start)attempt(`field:${f.key}:text`,()=>editField(next,f.key,f.text,f.titleWord,f.contextTags||[]));
 }
 for(const a of answers)attempt(`answer:${a.category}:${a.index}`,()=>{
  if(typeof a.value!=='string'||a.value.length>2000)throw new Error('回答は2,000文字までです。');
  if(a.slot){for(let i=0;i<a.index;i++)if(!next.questions[a.category][i]&&a.group?.[i])next.questions[a.category][i]=clone(a.group[i]);next.questions[a.category][a.index]=clone(a.slot);}
  answerQuestion(next,a.category,a.index,a.value);
 });
 const limits={name:200,notes:10000,protagonist:100,counterpart:100};
 for(const m of metadata)attempt(`meta:${m.id}`,()=>{
  if(typeof m.value!=='string')throw new Error('文字で入力してください。');
  if(m.key==='tags'){
   const tags=[...new Set(m.value.split(/[,、\n]/).map(s=>s.trim()).filter(Boolean))];
   if(tags.length>10||tags.some(t=>t.length>30))throw new Error('タグは最大10個、1個30文字までです。');
   next.metadata.tags=tags;
  }else{
   if(!Object.hasOwn(limits,m.key))throw new Error('不明な入力欄です。');
   if(m.value.length>limits[m.key])throw new Error(`${limits[m.key].toLocaleString()}文字までで入力してください。`);
   if(['protagonist','counterpart'].includes(m.key))next.characters[m.key].name=m.value;else next.metadata[m.key]=m.value;
  }
 });
 if(handoff)attempt(`handoff:${typeof handoff.userRoleText==='string'&&handoff.userRoleText.length>100?'userRoleText':typeof handoff.extraRequest==='string'&&handoff.extraRequest.length>2000?'extraRequest':'userRole'}`,()=>{next.handoff=validateHandoff(handoff);});
 if(errors.length)throw new DraftError(errors);
 const before={...state,handoff:null},after={...next,handoff:null};
 if(JSON.stringify(after)!==JSON.stringify(before))refreshTexts(next,{randomize:false});
 return next;
}
