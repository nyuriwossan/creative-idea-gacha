const assert=require('node:assert/strict'),path=require('node:path');
// UI v2 段階1：結果を先に・設定はシート・下部バー。設定シートは実際のボタンとキー操作で開閉する。
module.exports=async({browser,base,out,check})=>{
 async function fresh(fn,{width=390,height=844}={}){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.copied=undefined;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});});
  await p.addInitScript(()=>{let n=31415;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);});
  await p.goto(base);await p.locator('#basicFields .field-card').first().waitFor();
  const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')||'null'));
  try{await fn(p,read);assert.equal(errors.length,0,errors.join('\n'));}finally{await ctx.close();}
 }
 const sheetOpen=p=>p.evaluate(()=>document.getElementById('settingsSheet').open);
 await check('ui v2 first view shows world and the next card; settings stay folded behind the chip row',()=>fresh(async p=>{
  for(const [width,height] of [[360,780],[390,844],[430,932],[1280,900]]){
   await p.setViewportSize({width,height});
   const layout=await p.evaluate(()=>{const bar=document.querySelector('.action-bar').getBoundingClientRect();const r=id=>document.querySelector(`[data-key="${id}"]`).getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,worldBottom:r('world').bottom,nextTop:r('genre').top,barTop:bar.top,barBottom:bar.bottom,inner:innerHeight};});
   assert.equal(layout.overflow,false,`overflow at ${width}`);
   assert.ok(layout.worldBottom<layout.barTop,`world card hidden at ${width}`);
   assert.ok(layout.nextTop<layout.barTop,`next card not visible at ${width}`);
   assert.ok(Math.abs(layout.barBottom-layout.inner)<1,`bottom bar not pinned at ${width}`);
   assert.equal(await p.evaluate(()=>document.getElementById('stageSelect').checkVisibility()),false,'settings must stay folded');
  }
  await p.setViewportSize({width:390,height:844});
  assert.deepEqual(await p.locator('#settingsChips .setting-chip').allTextContents(),['舞台：すべて','シリアス','ショートストーリー向け','好み：お任せ']);
  assert.match(await p.locator('#openSettings').getAttribute('aria-label'),/^設定を開く（舞台：すべて、トーン：シリアス/);
  for(const id of ['#undo','#redo','#openSettings','#rollAll','#openHandoff'])assert.ok((await p.locator(id).boundingBox()).height>=44,`${id} under 44px`);
  assert.equal(await p.locator('#rollAll').textContent(),'固定以外を引く');assert.equal(await p.locator('#openHandoff').textContent(),'AIに渡す');
  assert.equal(await p.locator('#openHandoff').count(),1);
  await p.screenshot({path:path.join(out,'ui-v2-main-390.png')});
 }));
 await check('ui v2 settings sheet opens from the chip row, closes with Esc, backdrop and done, and returns focus',()=>fresh(async(p,read)=>{
  const before=(await read()).current;
  await p.locator('#openSettings').click();assert.equal(await sheetOpen(p),true);
  const box=await p.locator('#settingsSheet').boundingBox();assert.ok(box.width>=389&&box.height>=843,'sheet is not full screen on phone');
  await p.screenshot({path:path.join(out,'ui-v2-settings-390.png')});
  await p.keyboard.press('Escape');assert.equal(await sheetOpen(p),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'openSettings');
  await p.setViewportSize({width:1280,height:900});
  await p.locator('#openSettings').click();assert.equal(await sheetOpen(p),true);await p.mouse.click(20,450);assert.equal(await sheetOpen(p),false);
  await p.locator('#openSettings').click();await p.mouse.click(640,450);assert.equal(await sheetOpen(p),true,'a click inside the sheet must not close it');
  await p.keyboard.press('Escape');assert.deepEqual((await read()).current,before,'opening and closing must not draw');
 }));
 await check('ui v2 changing settings in the sheet updates chips, keeps materials, and draws only from the bottom bar',()=>fresh(async(p,read)=>{
  const before=(await read()).current;
  await p.locator('#openSettings').click();await p.locator('#toneSelect').selectOption('1');await p.locator('#stageSelect').selectOption('wafu');
  await p.locator('#themeDetails>summary').click();await p.locator('#classicThemeButtons [data-theme]').first().click();
  assert.match(await p.locator('#toast').textContent(),/舞台|テーマ|変更|次の抽選/);assert.equal(await p.locator('#toast').isVisible(),true);
  await p.locator('#doneSettings').click();assert.equal(await sheetOpen(p),false);
  assert.deepEqual(await p.locator('#settingsChips .setting-chip').allTextContents(),['舞台：和風','ほのぼの','ショートストーリー向け','好み：1個']);
  const after=(await read()).current;assert.deepEqual(after.items,before.items,'settings alone must not redraw');
  await p.locator('#rollAll').click();assert.notDeepEqual((await read()).current.items,before.items);
  await p.locator('#undo').click();assert.deepEqual((await read()).current.items,before.items);
 }));
 await check('ui v2 optional entry opens the matching section and the bottom bar steps aside while typing',()=>fresh(async p=>{
  for(const [label,id] of [['人物','charactersDetails'],['進行','progressionDetails'],['入口','sceneDetails'],['質問','questionsDetails']]){
   await p.locator('.optional-entry').getByRole('button',{name:label,exact:true}).click();
   assert.equal(await p.locator(`#${id}`).evaluate(x=>x.open),true);assert.equal(await p.evaluate(()=>document.activeElement.tagName),'SUMMARY');
  }
  assert.equal(await p.locator('.action-bar').evaluate(x=>getComputedStyle(x).position),'sticky');
  await p.locator('#workNotes').focus();assert.equal(await p.locator('.action-bar').evaluate(x=>getComputedStyle(x).position),'static');
  await p.locator('#workNotes').blur();await p.waitForTimeout(20);assert.equal(await p.locator('.action-bar').evaluate(x=>getComputedStyle(x).position),'sticky');
 }));
 await check('ui v2 cards offer only redraw, lock and edit; lock disables redraw and keeps the label text',()=>fresh(async(p,read)=>{
  for(const key of ['world','genre','relation','incident','conflict','gimmick','twist']){
   const card=p.locator(`#basicFields [data-key="${key}"]`);
   const labels=await card.locator('button').evaluateAll(xs=>xs.filter(x=>x.checkVisibility()).map(x=>x.textContent.trim()));
   assert.deepEqual(labels,['固定','引き直す','編集'],key);
   assert.ok((await card.locator('.lock-toggle').boundingBox()).height>=44);
  }
  const card=p.locator('#basicFields [data-key="conflict"]'),roll=card.getByRole('button',{name:'葛藤を引き直す',exact:true}),lock=card.locator('.lock-toggle');
  await lock.click();assert.equal(await lock.textContent(),'固定中 ✓');assert.equal(await lock.getAttribute('aria-pressed'),'true');assert.equal(await roll.isDisabled(),true);assert.equal((await read()).current.locks.conflict,true);
  const locked=(await read()).current.items.conflict;await p.locator('#rollAll').click();assert.deepEqual((await read()).current.items.conflict,locked);
  await lock.click();assert.equal(await lock.textContent(),'固定');assert.equal(await roll.isDisabled(),false);
  await roll.click();assert.notDeepEqual((await read()).current.items.conflict,locked);
  await p.screenshot({path:path.join(out,'ui-v2-cards-390.png')});
 }));
 await check('ui v2 AI handoff sheet: purpose chips drive the select, preview updates and copy happen in one sheet',()=>fresh(async(p,read)=>{
  const before=(await read()).current.items;
  await p.locator('#openHandoff').click();assert.equal(await p.evaluate(()=>document.getElementById('handoffSheet').open),true);
  assert.equal((await read()).current.handoff.purpose,'story');assert.deepEqual((await read()).current.items,before);
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.purpose),'story');
  assert.equal(await p.locator('.purpose-chip').count(),4);assert.equal(await p.evaluate(()=>document.getElementById('handoffDetails').open),false);
  const story=await p.inputValue('#handoffPreview');
  await p.locator('.purpose-chip[data-purpose="chat"]').click();
  assert.equal(await p.evaluate(()=>document.getElementById('handoffPurpose').value),'chat');
  assert.deepEqual(await p.locator('.purpose-chip').evaluateAll(xs=>xs.map(x=>x.getAttribute('aria-pressed'))),['false','true','false','false']);
  assert.equal((await read()).current.handoff.purpose,'chat');
  const chat=await p.inputValue('#handoffPreview');assert.notEqual(chat,story);assert.match(chat,/本編は開始しない/);
  assert.match(await p.textContent('#handoffCount'),new RegExp('^'+Array.from(chat).length+'文字'));
  await p.locator('#copyHandoff').click();assert.equal(await p.evaluate(()=>window.copied),chat);
  assert.equal(await p.locator('#toast').textContent(),'コピーしました。');assert.equal(await p.evaluate(()=>document.getElementById('toast').checkVisibility()),true);
  await p.screenshot({path:path.join(out,'ui-v2-handoff-390.png')});
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.getElementById('handoffSheet').open),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'openHandoff');
  await p.locator('#undo').click();assert.equal((await read()).current.handoff.purpose,'story');
 }));
};
