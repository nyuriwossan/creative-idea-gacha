// UI v2 のシート（<dialog class="sheet">）に対応する browser テスト用 helper。
//
// 設定（#settingsSheet）と「AIに渡す」（#handoffSheet）はモーダルのシートに移ったため、閉じたままでは操作できない。
// 既存テストの手順はそのままに、操作の直前に「対象がどのシートの中か」を見て、
// 実際のボタン（開く・閉じる）を押して開閉する。DOM を直接いじらない。
// 「くわしい設定」（#handoffDetails）の中の欄を操作するときは、その見出しを押して開く。
const SHEETS={
 settingsSheet:{open:'#openSettings',close:'#doneSettings'},
 handoffSheet:{open:'#openHandoff',close:'#closeHandoff'}
};
const FOLDS=['handoffDetails'];
const LOCATOR_ACTIONS=['click','dblclick','tap','fill','type','pressSequentially','press','selectOption','check','uncheck','setChecked','focus','hover','isVisible','waitFor','boundingBox','scrollIntoViewIfNeeded','evaluate','evaluateAll','screenshot'];
const PAGE_ACTIONS=['click','dblclick','tap','fill','type','press','selectOption','check','uncheck','focus','hover','isVisible'];
let original=null;

const openSheetId=page=>page.evaluate(()=>document.querySelector('dialog.sheet[open]')?.id||null).catch(()=>null);
async function closeSheets(page){
 const id=await openSheetId(page);if(!id)return;
 await original.locator.click.call(page.locator(SHEETS[id].close));
 await page.waitForFunction(id=>!document.getElementById(id).open,id);
}
async function showSheet(page,id){
 const current=await openSheetId(page);if(current===id)return;
 if(current)await closeSheets(page);
 await original.locator.click.call(page.locator(SHEETS[id].open));
 await page.waitForFunction(id=>document.getElementById(id).open,id);
}
const openSettings=page=>showSheet(page,'settingsSheet'),closeSettings=closeSheets;

async function placeFor(locator){
 const page=locator.page();let where;
 try{where=await original.locator.evaluateAll.call(locator,(els,folds)=>{
  if(!els.length)return null;const el=els[0],sheet=el.closest('dialog.sheet');
  const fold=folds.map(id=>document.getElementById(id)).find(d=>d&&!d.open&&d.contains(el)&&!d.querySelector(':scope>summary').contains(el));
  return {sheet:sheet?.id||null,otherDialog:!sheet&&Boolean(el.closest('dialog[open]')),fold:fold?.id||null};
 },FOLDS);}catch{return;}
 if(!where||where.otherDialog)return;
 if(where.sheet&&SHEETS[where.sheet])await showSheet(page,where.sheet);
 else if(!where.sheet)await closeSheets(page);
 if(where.fold)await original.locator.click.call(page.locator(`#${where.fold}>summary`));
}

async function installSettingsSheetHelper(browser){
 if(original)return;
 const ctx=await browser.newContext(),page=await ctx.newPage();
 const Page=Object.getPrototypeOf(page),Locator=Object.getPrototypeOf(page.locator('body'));
 await ctx.close();
 original={page:{},locator:{evaluateAll:Locator.evaluateAll,click:Locator.click}};
 for(const name of LOCATOR_ACTIONS){const fn=Locator[name];if(typeof fn!=='function')continue;original.locator[name]=fn;
  Locator[name]=async function(...args){await placeFor(this);return original.locator[name].apply(this,args);};}
 for(const name of PAGE_ACTIONS){const fn=Page[name];if(typeof fn!=='function')continue;original.page[name]=fn;
  Page[name]=async function(selector,...args){if(typeof selector==='string')await placeFor(this.locator(selector).first());return original.page[name].call(this,selector,...args);};}
}

module.exports={installSettingsSheetHelper,installSheetHelper:installSettingsSheetHelper,openSettings,closeSettings,showSheet,closeSheets};
