const assert=require('node:assert/strict'),path=require('node:path');
// 上部の「ロック解除」「テーマ解除」：設定シートを開かずに1回で操作でき、解除だけを行い、1回の「戻す」で戻る。
module.exports=async({browser,base,out,check})=>{
 async function fresh(fn,{width=390,height=844}={}){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{let n=2718;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);});
  await p.goto(base);await p.locator('#basicFields .field-card').first().waitFor();
  const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')||'null').current);
  try{await fn(p,read);assert.equal(errors.length,0,errors.join('\n'));}finally{await ctx.close();}
 }
 const sheetOpen=p=>p.evaluate(()=>Boolean(document.querySelector('dialog.sheet[open]')));
 const lockCard=(p,key,label)=>p.locator(`[data-key="${key}"]`).getByRole('button',{name:`${label}の固定を切り替える`}).click();

 await check('quick reset buttons sit under the settings summary, start disabled, and have Japanese labels',()=>fresh(async p=>{
  const geometry=await p.evaluate(()=>{const s=document.getElementById('openSettings').getBoundingClientRect(),u=document.getElementById('quickUnlock').getBoundingClientRect(),t=document.getElementById('quickClearThemes').getBoundingClientRect();return {below:u.top>=s.bottom&&t.top>=s.bottom,sameRow:Math.abs(u.top-t.top)<1,uh:u.height,th:t.height};});
  assert.ok(geometry.below,'buttons must be below the settings summary');assert.ok(geometry.sameRow);assert.ok(geometry.uh>=44&&geometry.th>=44);
  assert.equal((await p.locator('#quickUnlock').textContent()).trim(),'ロック解除');assert.equal((await p.locator('#quickClearThemes').textContent()).trim(),'テーマ解除');
  assert.equal(await p.locator('#quickUnlock').isDisabled(),true);assert.equal(await p.locator('#quickClearThemes').isDisabled(),true);
  assert.match(await p.locator('#quickUnlock').getAttribute('aria-label'),/ロック解除/);
  await lockCard(p,'world','世界観');
  assert.equal(await p.locator('#quickUnlock').isDisabled(),false);
  assert.match(await p.locator('#quickUnlock').getAttribute('aria-label'),/すべてのロックを解除する（1件固定中/);
 }));

 await check('quick unlock clears every lock and hidden question locks without rerolling or losing drafts; one undo restores',()=>fresh(async(p,read)=>{
  await lockCard(p,'world','世界観');await lockCard(p,'twist','ひねり');
  await p.locator('#charactersDetails>summary').click();await p.click('#rollCharacters');await lockCard(p,'protagonist.goal','主人公の目的');
  await p.locator('#questionsDetails>summary').click();
  await p.selectOption('#questionCategory','world');await p.click('#rollQuestions');
  await p.fill('#answer-world-0','回答済みの答え');await p.locator('[data-category="world"] .question-slot').first().getByRole('button',{name:'回答を反映'}).click();
  await p.locator('[data-category="world"] .question-slot').first().getByRole('button',{name:'質問1の固定を切り替える'}).click();
  const hidden=(await p.locator('#questionCategory option').evaluateAll(xs=>xs.map(x=>x.value))).find(v=>v!=='world');
  await p.selectOption('#questionCategory',hidden);await p.click('#rollQuestions');
  await p.locator(`[data-category="${hidden}"] .question-slot`).nth(1).getByRole('button',{name:'質問2の固定を切り替える'}).click();
  await p.selectOption('#questionCategory','world');
  // 未反映の入力：本文の編集・回答・名前・メモ
  const w=p.locator('[data-key="world"]');await w.getByRole('button',{name:'世界観を編集',exact:true}).click();await p.fill('#input-world','反映前の世界観メモ');
  await p.fill('#answer-world-1','反映前の回答');await p.fill('#protagonistName','未反映の名前');
  const before=await read();
  assert.ok(before.locks.world&&before.locks.twist&&before.locks['protagonist.goal']);assert.equal(before.questions[hidden][1].locked,true);
  await p.evaluate(()=>scrollTo(0,0));await p.click('#quickUnlock');assert.equal(await sheetOpen(p),false);
  const after=await read();
  assert.ok(Object.values(after.locks).every(v=>!v));assert.ok(Object.values(after.questions).flat().every(q=>!q.locked));
  assert.deepEqual(after.items,before.items);assert.deepEqual(after.texts,before.texts);assert.deepEqual(after.settings,before.settings);assert.deepEqual(after.characters,before.characters);assert.deepEqual(after.metadata,before.metadata);
  assert.equal(after.questions.world[0].answer,'回答済みの答え');
  assert.deepEqual(after.questions[hidden].map(q=>q.id),before.questions[hidden].map(q=>q.id));
  assert.equal(await p.inputValue('#input-world'),'反映前の世界観メモ');assert.equal(await p.inputValue('#answer-world-1'),'反映前の回答');assert.equal(await p.inputValue('#protagonistName'),'未反映の名前');
  assert.match(await p.locator('#toast').textContent(),/ロックを解除しました。本文と回答は残っています。/);
  assert.equal(await p.locator('#quickUnlock').isDisabled(),true);
  // 回答済みの質問は、固定を外しても「質問を引き直す」で回答ごと消えない（既存の回答保護）。
  await p.click('#rollQuestions');assert.equal((await read()).questions.world[0].answer,'回答済みの答え');
  await p.click('#undo');
  await p.click('#undo');const undone=await read();
  assert.deepEqual(undone.locks,before.locks);assert.deepEqual(undone.questions,before.questions);assert.deepEqual(undone.items,before.items);
  await p.click('#redo');assert.ok(Object.values((await read()).locks).every(v=>!v));
  await w.getByRole('button',{name:'キャンセル',exact:true}).click();
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'quick-reset-390.png')});
 }));

 await check('quick theme clear keeps stage pair, tone, purpose, coherence and locks; one undo restores',()=>fresh(async(p,read)=>{
  await lockCard(p,'genre','ジャンル');
  await p.click('#openSettings');await p.locator('#stageMixDetails>summary').click();
  await p.selectOption('#stageMixSelect',await p.locator('#stageMixSelect option').nth(1).getAttribute('value'));
  await p.selectOption('#toneSelect','2');await p.selectOption('#purposeSelect','漫画1話向け');
  await p.locator('#themeDetails>summary').click();for(const key of ['buddy','mystery'])await p.locator(`[data-theme="${key}"]`).click();
  await p.click('#doneSettings');
  assert.match(await p.locator('#quickClearThemes').getAttribute('aria-label'),/2個選択中/);
  const before=await read();assert.equal(before.settings.themes.length,2);assert.ok(before.settings.stage2);
  await p.click('#quickClearThemes');assert.equal(await sheetOpen(p),false);
  const after=await read();
  assert.deepEqual(after.settings,{...before.settings,themes:[]});assert.deepEqual(after.items,before.items);assert.deepEqual(after.locks,before.locks);assert.deepEqual(after.texts,before.texts);
  assert.match(await p.locator('#toast').textContent(),/テーマの選択を解除しました。/);
  assert.equal(await p.locator('#quickClearThemes').isDisabled(),true);
  assert.equal(await p.locator('#settingsChips [data-chip="themes"]').textContent(),'好み：お任せ');
  await p.click('#undo');assert.deepEqual(await read(),before);
 }));

 await check('top and settings-sheet reset buttons produce the same state',()=>fresh(async(p,read)=>{
  await lockCard(p,'world','世界観');await lockCard(p,'conflict','葛藤');
  await p.click('#openSettings');await p.locator('#themeDetails>summary').click();await p.locator('[data-theme="buddy"]').click();await p.click('#doneSettings');
  const start=await read();
  await p.click('#quickUnlock');await p.click('#quickClearThemes');const top=await read();
  await p.click('#undo');await p.click('#undo');assert.deepEqual(await read(),start);
  await p.click('#openSettings');await p.click('#unlockAll');await p.click('#clearThemes');await p.click('#doneSettings');
  assert.deepEqual(await read(),top);
 }));

 await check('quick reset row fits 320/390/768/1280px without overflow and stays keyboard operable',()=>fresh(async p=>{
  await lockCard(p,'world','世界観');
  for(const width of [320,390,768,1280]){
   await p.setViewportSize({width,height:844});
   const r=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,boxes:['quickUnlock','quickClearThemes'].map(id=>{const b=document.getElementById(id).getBoundingClientRect();return {h:b.height,right:b.right};})}));
   assert.equal(r.overflow,false,`overflow at ${width}`);for(const b of r.boxes){assert.ok(b.h>=44);assert.ok(b.right<=width);}
   await p.screenshot({path:path.join(out,`quick-reset-${width}.png`)});
  }
  await p.locator('#quickUnlock').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('#quickUnlock').isDisabled(),true);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'openSettings');
 }));
};
