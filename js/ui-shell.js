// 画面の外枠（設定シート・AIに渡すシート・設定チップ・任意欄への導線）。抽選や保存のロジックは持たない。
import {settingsChips,settingsChipsLabel} from './settings-chips.js';

const $=id=>document.getElementById(id);
const openers=new WeakMap();
let toastHome=null;

export function renderChips(state){
 const chips=settingsChips(state),list=$('settingsChips');
 list.replaceChildren(...chips.map(({key,label,value})=>{
  const chip=document.createElement('span');chip.className='setting-chip';chip.dataset.chip=key;
  chip.textContent=key==='stage'||key==='themes'?`${label}：${value}`:value;
  return chip;
 }));
 $('openSettings').setAttribute('aria-label',settingsChipsLabel(chips));
}

// シートは同時に1枚だけ。開いている間は、通知（トースト）がシートの下に隠れないよう閉じるボタンの上へ移す。
export function openSheet(sheet,from=document.activeElement){
 if(sheet.open)return;
 for(const other of document.querySelectorAll('dialog.sheet[open]'))other.close();
 openers.set(sheet,from instanceof HTMLElement?from:null);
 const toast=$('toast');
 if(!toastHome)toastHome={parent:toast.parentElement,next:toast.nextSibling};
 sheet.querySelector('.sheet-foot').before(toast);
 sheet.showModal();
}
export function openSettings(from){openSheet($('settingsSheet'),from);}
// 閉じてすぐ通知を出したいとき用：トーストを先に元の位置へ戻してから閉じ終える。
export function closeSheet(sheet){sheet.close();restoreToast();}

function restoreToast(){
 if(!toastHome||document.querySelector('dialog.sheet[open]'))return;
 toastHome.parent.insertBefore($('toast'),toastHome.next);toastHome=null;
}

function initSheet(sheet,fallback){
 for(const button of sheet.querySelectorAll('[data-close-sheet]'))button.addEventListener('click',()=>sheet.close());
 // 背景（シートの外側）を押したら閉じる。シート内の余白では閉じない。
 sheet.addEventListener('click',event=>{
  if(event.target!==sheet)return;
  const r=sheet.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();
 });
 sheet.addEventListener('close',()=>{
  restoreToast();
  const opener=openers.get(sheet),target=opener&&opener.isConnected?opener:fallback;openers.delete(sheet);
  // 閉じた直後に別の欄へフォーカスが移っていたら（入力エラーの案内など）、それを奪わない。
  const active=document.activeElement;
  if(!active||active===document.body||active===target||sheet.contains(active))target.focus({preventScroll:true});
 });
}

// 「AIへの依頼内容」は select を正本として残し、見た目は4つのチップで操作する（change を発火して既存の処理に渡す）。
export function initPurposeChips(){
 const select=$('handoffPurpose'),group=$('handoffPurposeChips');
 group.replaceChildren(...[...select.options].map(option=>{
  const chip=document.createElement('button');chip.type='button';chip.className='purpose-chip';chip.dataset.purpose=option.value;chip.textContent=option.textContent;
  chip.setAttribute('aria-pressed','false');
  chip.addEventListener('click',()=>{if(select.value===option.value)return;select.value=option.value;select.dispatchEvent(new Event('change'));syncPurposeChips();});
  return chip;
 }));
 select.addEventListener('change',syncPurposeChips);
}
export function syncPurposeChips(){
 const value=$('handoffPurpose').value;
 for(const chip of $('handoffPurposeChips').children)chip.setAttribute('aria-pressed',String(chip.dataset.purpose===value));
}
export function focusPurposeChip(){$('handoffPurposeChips').querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});}

export function initShell(){
 const settings=$('settingsSheet');
 $('openSettings').addEventListener('click',event=>openSettings(event.currentTarget));
 initSheet(settings,$('openSettings'));
 initSheet($('handoffSheet'),$('openHandoff'));
 initSheet($('pickSheet'),$('rollAll'));
 // 「この方向で引く」は抽選なので、先にシートを閉じて結果（または直すべき入力欄）が見える状態で実行する。
 settings.addEventListener('click',event=>{if(event.target.closest('#runPreset')&&!$('runPreset').disabled)settings.close();},true);
 // 「人物・進行・入口・質問」への導線：該当する欄を開いて、そこまで移動する。
 for(const link of document.querySelectorAll('[data-open-details]'))link.addEventListener('click',()=>{
  const details=$(link.dataset.openDetails);details.open=true;
  details.scrollIntoView({block:'start'});details.querySelector('summary').focus({preventScroll:true});
 });
}
