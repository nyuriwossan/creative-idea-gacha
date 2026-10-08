// UI v2 の設定シート（<dialog id="settingsSheet">）に対応する browser テスト用 helper。
//
// 舞台・トーン・テーマなどの設定はモーダルのシートへ移ったため、閉じたままでは操作できない。
// 既存テストの手順はそのままに、操作の直前に「対象がシートの中か外か」を見て、
// 実際のボタン（#openSettings / #doneSettings）を押して開閉する。DOM を直接いじらない。
const OPEN='#openSettings',CLOSE='#doneSettings';
const LOCATOR_ACTIONS=['click','dblclick','tap','fill','type','pressSequentially','press','selectOption','check','uncheck','setChecked','focus','hover','isVisible','waitFor','boundingBox','scrollIntoViewIfNeeded','evaluate','evaluateAll','screenshot'];
const PAGE_ACTIONS=['click','dblclick','tap','fill','type','press','selectOption','check','uncheck','focus','hover','isVisible'];
let original=null;

async function sheetIsOpen(page){try{return await page.evaluate(()=>document.getElementById('settingsSheet')?.open===true);}catch{return false;}}
async function openSettings(page){
 if(await sheetIsOpen(page))return;
 await original.locator.click.call(page.locator(OPEN));
 await page.waitForFunction(()=>document.getElementById('settingsSheet').open===true);
}
async function closeSettings(page){
 if(!(await sheetIsOpen(page)))return;
 await original.locator.click.call(page.locator(CLOSE));
 await page.waitForFunction(()=>document.getElementById('settingsSheet').open!==true);
}
async function placeFor(locator){
 const page=locator.page();let where;
 try{where=await original.locator.evaluateAll.call(locator,els=>{const sheet=document.getElementById('settingsSheet');if(!els.length||!sheet)return 'none';return sheet.contains(els[0])?'in':'out';});}catch{return;}
 if(where==='in')await openSettings(page);
 else if(where==='out'&&!(await original.locator.evaluate.call(locator,el=>Boolean(el.closest('dialog[open]:not(#settingsSheet)'))).catch(()=>false)))await closeSettings(page);
}

async function installSettingsSheetHelper(browser){
 if(original)return;
 const ctx=await browser.newContext(),page=await ctx.newPage();
 const Page=Object.getPrototypeOf(page),Locator=Object.getPrototypeOf(page.locator('body'));
 await ctx.close();
 original={page:{},locator:{evaluateAll:Locator.evaluateAll,evaluate:Locator.evaluate,click:Locator.click}};
 for(const name of LOCATOR_ACTIONS){const fn=Locator[name];if(typeof fn!=='function')continue;original.locator[name]=fn;
  Locator[name]=async function(...args){await placeFor(this);return original.locator[name].apply(this,args);};}
 for(const name of PAGE_ACTIONS){const fn=Page[name];if(typeof fn!=='function')continue;original.page[name]=fn;
  Page[name]=async function(selector,...args){if(typeof selector==='string')await placeFor(this.locator(selector).first());return original.page[name].call(this,selector,...args);};}
}

module.exports={installSettingsSheetHelper,openSettings,closeSettings};
