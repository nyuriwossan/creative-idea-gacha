// 「他から選ぶ」シートの画面部分。候補づくりは pick.js、採用（保存・履歴）は app.js の commit に任せる。
import {candidatesFor,candidateLabel,PICK_COUNT} from './pick.js';
import {openSheet,closeSheet} from './ui-shell.js';

const $=id=>document.getElementById(id);
let session=null,adopt=null;

function setChosen(index){
 session.chosen=index;
 [...$('pickList').children].forEach((row,i)=>row.setAttribute('aria-pressed',String(i===index)));
 const use=$('pickUse');use.disabled=index<0;use.textContent=index<0?'1つ選んでください':'これを使う';
}

function fill(){
 const {key,getState,data,recent}=session;
 session.list=candidatesFor(getState(),key,{n:PICK_COUNT,data,recent});
 $('pickList').replaceChildren(...session.list.map((item,i)=>{
  const row=document.createElement('button');row.type='button';row.className='pick-row';row.setAttribute('aria-pressed','false');
  const no=document.createElement('span');no.className='pick-no';no.textContent=String(i+1);no.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.className='pick-text';text.textContent=candidateLabel(item,key);
  row.append(no,text);row.addEventListener('click',()=>setChosen(i));
  return row;
 }));
 const count=session.list.length;
 $('pickEmpty').hidden=count>0;
 $('pickShort').hidden=!count||count>=PICK_COUNT;$('pickShort').textContent=`この条件で見つかった候補は${count}個です。`;
 $('pickMore').disabled=!count;
 setChosen(-1);
}

export function openPick(key,label,{getState,data,recent,from}){
 session={key,getState,data,recent,list:[],chosen:-1};
 $('pickTitle').textContent=`${label}を10連で選ぶ`;
 fill();
 openSheet($('pickSheet'),from);
 ($('pickList').firstElementChild||$('closePick')).focus({preventScroll:true});
}

export function initPickSheet(onAdopt){
 adopt=onAdopt;
 $('pickMore').addEventListener('click',()=>{if(session){fill();$('pickMore').focus({preventScroll:true});}});
 $('pickUse').addEventListener('click',()=>{
  if(!session||session.chosen<0)return;
  const {key,list,chosen}=session,candidate=list[chosen];
  closeSheet($('pickSheet'));adopt(key,candidate);
 });
 $('pickSheet').addEventListener('close',()=>{session=null;});
}
