const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({browser,base,out,check})=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{let seed=20261007;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')));const pairs=['modern+fantasy','wafu+fantasy','scifi+research'];
 try{await p.goto(base);await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();await p.locator('#stageMixDetails>summary').click();
 await check('expanded six pairs select/clear without redrawing and save/reload all new combinations',async()=>{
  assert.equal(await p.locator('#stageMixSelect option').count(),7);
  for(const pair of pairs){const before=(await read()).current.items;await p.selectOption('#stageMixSelect',pair);assert.deepEqual((await read()).current.items,before);assert.equal(await p.inputValue('#stageMixSelect'),pair);await p.click('#clearStageMix');assert.equal(await p.inputValue('#stageMixSelect'),'');assert.deepEqual((await read()).current.items,before);await p.selectOption('#stageMixSelect',pair);await p.click('#rollAll');const s=(await read()).current;assert.equal(s.settings.stage2,pair.split('+')[1]);assert.ok(await p.evaluate(()=>!document.querySelector('#mixReport').hidden));await p.fill('#workName',pair+'の保存');await p.click(await p.isVisible('#saveNew')?'#saveNew':'#saveAs');const saved=(await read()).current;await p.reload();await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();assert.deepEqual((await read()).current,saved);await p.locator('#stageMixDetails>summary').click();assert.equal(await p.inputValue('#stageMixSelect'),pair);}
  assert.equal((await read()).works.length,3);
 });
 await check('expanded pair JSON download preserves snapshots and AI/Markdown report new stage labels',async()=>{
  const pending=p.waitForEvent('download');await p.click('#exportCurrent');const dl=await pending;const file=path.join(out,'expanded-pair.json');await dl.saveAs(file);const json=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(json.schemaVersion,3);assert.deepEqual(json.works[0].state.items,(await read()).current.items);await p.click('#openHandoff');assert.match(await p.inputValue('#handoffPreview'),/SF × 研究施設/);await p.locator('#handoffPanel>summary').click();
 });
 await check('expanded selector fits mobile widths and remains keyboard-operable with no page errors',async()=>{
  for(const width of [360,390,430]){await p.setViewportSize({width,height:844});await p.locator('#stageMixDetails').scrollIntoViewIfNeeded();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));for(const sel of ['#stageMixSelect','#clearStageMix'])assert.ok(await p.locator(sel).evaluate(x=>x.getBoundingClientRect().height>=44));await p.screenshot({path:path.join(out,`expanded-pairs-${width}.png`)});}
  await p.focus('#clearStageMix');await p.keyboard.press('Enter');assert.equal(await p.inputValue('#stageMixSelect'),'');assert.equal(await p.evaluate(()=>document.activeElement.id),'stageMixSelect');assert.deepEqual(errors,[]);
 });
 }finally{await ctx.close();}
};
