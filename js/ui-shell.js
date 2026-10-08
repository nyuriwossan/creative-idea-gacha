// 画面の外枠（設定シート・設定チップ・任意欄への導線）。抽選や保存のロジックは持たない。
import {settingsChips,settingsChipsLabel} from './settings-chips.js';

const $=id=>document.getElementById(id);
let opener=null,toastHome=null;

export function renderChips(state){
 const chips=settingsChips(state),list=$('settingsChips');
 list.replaceChildren(...chips.map(({key,label,value})=>{
  const chip=document.createElement('span');chip.className='setting-chip';chip.dataset.chip=key;
  chip.textContent=key==='stage'||key==='themes'?`${label}：${value}`:value;
  return chip;
 }));
 $('openSettings').setAttribute('aria-label',settingsChipsLabel(chips));
}

export function openSettings(from=document.activeElement){
 const sheet=$('settingsSheet');if(sheet.open)return;
 opener=from instanceof HTMLElement?from:$('openSettings');
 // 設定変更の通知（トースト）がシートの下に隠れないよう、開いている間だけシート内（閉じるボタンの上）へ移す。
 const toast=$('toast');toastHome={parent:toast.parentElement,next:toast.nextSibling};sheet.querySelector('.sheet-foot').before(toast);
 sheet.showModal();
}

function restoreToast(){
 if(!toastHome)return;const toast=$('toast');
 toastHome.parent.insertBefore(toast,toastHome.next);toastHome=null;
}

export function initShell(){
 const sheet=$('settingsSheet');
 $('openSettings').addEventListener('click',event=>openSettings(event.currentTarget));
 $('closeSettings').addEventListener('click',()=>sheet.close());
 $('doneSettings').addEventListener('click',()=>sheet.close());
 // 背景（シートの外側）を押したら閉じる。シート内の余白では閉じない。
 sheet.addEventListener('click',event=>{
  if(event.target!==sheet)return;
  const r=sheet.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();
 });
 // 「この方向で引く」は抽選なので、先にシートを閉じて結果（または直すべき入力欄）が見える状態で実行する。
 sheet.addEventListener('click',event=>{if(event.target.closest('#runPreset')&&!$('runPreset').disabled)sheet.close();},true);
 sheet.addEventListener('close',()=>{
  restoreToast();
  const target=opener&&opener.isConnected?opener:$('openSettings');opener=null;
  // 閉じた直後に別の欄へフォーカスが移っていたら（入力エラーの案内など）、それを奪わない。
  const active=document.activeElement;
  if(!active||active===document.body||active===target||sheet.contains(active))target.focus({preventScroll:true});
 });
 // 「人物・進行・入口・質問」への導線：該当する欄を開いて、そこまで移動する。
 for(const link of document.querySelectorAll('[data-open-details]'))link.addEventListener('click',()=>{
  const details=$(link.dataset.openDetails);details.open=true;
  details.scrollIntoView({block:'start'});details.querySelector('summary').focus({preventScroll:true});
 });
}
