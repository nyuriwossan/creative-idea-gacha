const assert=require('node:assert/strict'),path=require('node:path');
// 素材から選ぶ（分類 → 小分類 → 個別素材）。実際のボタン・select・検索欄で操作し、保存内容を読んで確かめる。
module.exports=async({browser,base,out,check})=>{
 async function fresh(fn,{width=390,height=844}={}){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.copied=undefined;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});});
  await p.addInitScript(()=>{let n=1618;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);});
  await p.goto(base);await p.locator('#basicFields .field-card').first().waitFor();
  const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')||'null').current);
  try{await fn(p,read);assert.equal(errors.length,0,errors.join('\n'));}finally{await ctx.close();}
 }
 const open=async(p,key)=>{await p.locator(`#basicFields [data-key="${key}"] .pick-btn`).click();await p.locator('#pickSheet[open]').waitFor();await p.locator('#browseList .browse-row').first().waitFor();};
 const sheetOpen=p=>p.evaluate(()=>document.getElementById('pickSheet').open);
 const chosenId=p=>p.locator('#browseList .browse-row[aria-pressed="true"]').getAttribute('data-id');
 const pathsFor=(p,key,id)=>p.evaluate(async([key,id])=>{const m=await import('./js/browse-map-basic.js');return (m.BROWSE_MAP_BASIC[key][id]||'').split('|');},[key,id]);
 const pathCount=p=>p.textContent('#browsePath').then(t=>Number(/：(\d+)件/.exec(t)[1]));

 await check('browse: world 現代 → 学校・教育現場 → one material, adopted with lock, saved, exported and undoable',()=>fresh(async(p,read)=>{
  const before=await read();
  await open(p,'world');
  assert.equal(await p.textContent('#pickTitle'),'世界観の素材を選ぶ');
  assert.equal(await p.getAttribute('#pickModeBrowse','aria-pressed'),'true');assert.equal(await p.isChecked('#pickLockAfter'),true);
  assert.equal(await p.locator('input[name="browseScope"][value="fit"]').isChecked(),true);
  assert.equal(await p.inputValue('#browseMajor'),'all');assert.equal(await p.locator('#browseMinor').isDisabled(),true);
  await p.selectOption('#browseMajor','modern');await p.selectOption('#browseMinor','school');
  assert.match(await p.textContent('#browsePath'),/^現代 → 学校・教育現場：\d+件/);
  const rows=p.locator('#browseList .browse-row');assert.ok(await rows.count()>=5);
  await rows.nth(1).click();const id=await chosenId(p);assert.ok((await pathsFor(p,'world',id)).includes('modern.school'));
  const label=(await rows.nth(1).locator('.pick-text').textContent());
  assert.equal(await p.textContent('#pickChosen'),`選択中：${label}`);assert.equal(await p.textContent('#pickUse'),'この素材を使う');
  assert.deepEqual(await read(),before,'choosing alone changes nothing');
  await p.screenshot({path:path.join(out,'browse-world-school-390.png')});
  await p.click('#pickUse');assert.equal(await sheetOpen(p),false);
  const after=await read();
  assert.equal(after.items.world.candidateId,id);assert.equal(after.locks.world,true);assert.equal(after.items.world.source,'generated');
  assert.deepEqual({...after.items,world:null},{...before.items,world:null},'other items were redrawn');
  assert.ok(Array.isArray(after.items.world.contextTags)&&Array.isArray(after.items.world.stageTags)&&after.items.world.titleWord!==undefined);
  assert.equal(await p.locator('[data-key="world"] .field-value').textContent(),label);
  assert.match(await p.textContent('#toast'),/世界観を変えました。/);
  await p.click('#undo');const undone=await read();assert.deepEqual(undone.items.world,before.items.world);assert.equal(undone.locks.world,before.locks.world);
  await p.click('#redo');assert.deepEqual((await read()).items.world,after.items.world);assert.equal((await read()).locks.world,true);
  await p.locator('#openHandoff').click();assert.match(await p.inputValue('#handoffPreview'),new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await p.keyboard.press('Escape');
  await p.reload();await p.locator('#basicFields .field-card').first().waitFor();assert.deepEqual((await read()).items.world,after.items.world);assert.equal((await read()).locks.world,true);
 }));

 await check('browse: relation branches by meaning, minor resets on major change, すべて skips a level',()=>fresh(async p=>{
  await open(p,'relation');
  const majors=await p.locator('#browseMajor option').allTextContents();assert.ok(majors.some(t=>/^仕事・師弟（\d+）$/.test(t)),majors.join());
  await p.selectOption('#browseMajor','work');assert.equal(await p.locator('#browseMinor').isDisabled(),false);
  await p.selectOption('#browseMinor','master');const master=await pathCount(p);assert.ok(master>=5);
  for(const text of (await p.locator('#browseList .pick-text').allTextContents()).slice(0,8))assert.match(text,/師|弟子|見習い|新人|新米|教育実習/);
  await p.selectOption('#browseMajor','family');assert.equal(await p.inputValue('#browseMinor'),'all','minor resets when it does not exist in the new major');
  const minors=await p.locator('#browseMinor option').allTextContents();assert.ok(minors.some(t=>t.startsWith('血縁・親子・兄弟')));assert.ok(!minors.some(t=>t.startsWith('師匠と弟子')));
  const family=await pathCount(p);await p.selectOption('#browseMinor','blood');assert.ok(await pathCount(p)<=family);
  await p.selectOption('#browseMajor','all');assert.equal(await p.locator('#browseMinor').isDisabled(),true);assert.match(await p.textContent('#browsePath'),/^すべての分類：/);
 }));

 await check('browse: gacha inside a major only draws from that branch and does not touch the work',()=>fresh(async(p,read)=>{
  const before=await read();await open(p,'genre');
  await p.selectOption('#browseMajor','mystery');
  const seen=new Set();
  for(let i=0;i<8;i++){await p.click('#browseGacha');const id=await chosenId(p);assert.ok((await pathsFor(p,'genre',id)).some(x=>x.startsWith('mystery.')),id);seen.add(id);}
  assert.ok(seen.size>=3,'gacha keeps returning the same material');
  assert.deepEqual(await read(),before);await p.keyboard.press('Escape');assert.deepEqual(await read(),before);assert.equal(await p.locator('#undo').isDisabled(),true);
 }));

 await check('browse: twenty at a time, search over the whole branch, distinct empty states and recovery',()=>fresh(async p=>{
  await open(p,'world');
  assert.equal(await p.locator('#browseList .browse-row').count(),20);
  const total=await pathCount(p);assert.match(await p.textContent('#browseMore'),new RegExp(`残り${total-20}件`));
  await p.click('#browseMore');assert.equal(await p.locator('#browseList .browse-row').count(),Math.min(40,total));
  const ids=await p.locator('#browseList .browse-row').evaluateAll(xs=>xs.map(x=>x.dataset.id));assert.equal(new Set(ids).size,ids.length);
  await p.fill('#browseSearch','ｶﾞｯｺｳ');const hiragana=await pathCount(p);await p.fill('#browseSearch','学校');const kanji=await pathCount(p);
  assert.ok(kanji>=3);assert.equal(hiragana,0);
  await p.fill('#browseSearch','　学校 ');assert.equal(await pathCount(p),kanji,'spaces are ignored');
  await p.selectOption('#browseMajor','modern');assert.equal(await p.inputValue('#browseSearch'),'　学校 ','search text survives branch changes');
  await p.fill('#browseSearch','存在しない言葉です');assert.equal(await p.locator('#browseEmpty').isVisible(),true);
  assert.match(await p.textContent('#browseEmptyText'),/に合う素材は、この分類にありません/);assert.equal(await p.locator('#browseGacha').isDisabled(),true);
  await p.locator('#browseEmptyActions').getByRole('button',{name:'検索を消す'}).click();assert.equal(await p.inputValue('#browseSearch'),'');assert.equal(await p.locator('#browseEmpty').isVisible(),false);
  // 1件だけの条件：ガチャは無限に回らず、1件と案内する。
  const only=(await p.locator('#browseList .pick-text').first().textContent());await p.fill('#browseSearch',only);
  if(await pathCount(p)===1){await p.click('#browseGacha');assert.match(await p.textContent('#browsePath'),/この条件の候補は1件です/);await p.click('#browseGacha');assert.equal(await p.locator('#browseList .browse-row[aria-pressed="true"]').count(),1);}
  // 選択中の素材が絞り込みで一覧から外れたら、未採用の選択を外す。
  await p.fill('#browseSearch','');await p.selectOption('#browseMajor','scifi');await p.locator('#browseList .browse-row').first().click();assert.equal(await p.locator('#pickUse').isDisabled(),false);
  await p.selectOption('#browseMajor','wafu');assert.equal(await p.locator('#pickUse').isDisabled(),true);assert.equal(await p.textContent('#pickChosen'),'');
 }));

 await check('browse: the item in use is listed and marked, and condition-only empty branches offer the out-of-condition view',()=>fresh(async(p,read)=>{
  const current=(await read()).items.incident;await open(p,'incident');
  await p.fill('#browseSearch',current.text.slice(0,12));
  assert.ok(await p.locator('#browseList .browse-item').filter({has:p.locator('.tag-current')}).count()>=1,'item in use is not listed');
  await p.fill('#browseSearch','');await p.locator('#pickClose, #closePick').first().click();
  // トーン「ほのぼの」では、条件に合わない枝が0件になり、条件外の閲覧へ移れる。
  await p.click('#openSettings');await p.selectOption('#toneSelect','1');await p.click('#doneSettings');
  await open(p,'world');
  const disabled=await p.locator('#browseMajor option:disabled').count(),options=await p.locator('#browseMajor option').count();
  await p.check('input[name="browseScope"][value="all"]');assert.ok(await p.locator('#browseMajor option:disabled').count()<=disabled);assert.equal(await p.locator('#browseMajor option').count(),options);
 }));

 await check('browse: cancel, Esc and close keep the work and unapplied edits; previews and ten-mode do not record history',()=>fresh(async(p,read)=>{
  const w=p.locator('[data-key="world"]');await w.getByRole('button',{name:'世界観を編集',exact:true}).click();await p.fill('#input-world','反映前の世界観');
  await p.locator('#questionsDetails>summary').click();await p.click('#rollQuestions');await p.fill('#answer-world-0','反映前の回答');await p.fill('#workNotes','反映前のメモ');
  const before=await read();
  await open(p,'genre');await p.locator('#browseList .browse-row').nth(2).click();await p.click('#browseGacha');await p.locator('#pickModeTen').click();await p.locator('#pickList .pick-row').first().click();await p.locator('#pickModeBrowse').click();
  assert.equal(await p.locator('#pickUse').isDisabled(),true,'switching modes drops the unadopted choice');
  await p.keyboard.press('Escape');assert.equal(await sheetOpen(p),false);
  await open(p,'twist');await p.locator('#browseList .browse-row').first().click();await p.click('#closePick');
  assert.deepEqual(await read(),before);
  assert.equal(await p.inputValue('#input-world'),'反映前の世界観');assert.equal(await p.inputValue('#answer-world-0'),'反映前の回答');assert.equal(await p.inputValue('#workNotes'),'反映前のメモ');
  assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('aria-label')),'ひねりを素材から選ぶ','focus returns to the opener');
 }));

 await check('browse: a locked item can be re-chosen explicitly; the checkbox decides the lock; only that item changes',()=>fresh(async(p,read)=>{
  const card=p.locator('[data-key="conflict"]');await card.locator('.lock-toggle').click();
  await p.locator('#charactersDetails>summary').click();await p.fill('#protagonistName','葵');await p.click('#rollCharacters');
  const before=await read();assert.equal(before.locks.conflict,true);
  await p.click('#rollAll');assert.deepEqual((await read()).items.conflict,before.items.conflict,'normal draw keeps the lock');
  const mid=await read();
  assert.equal(await card.locator('.pick-btn').isDisabled(),false);await open(p,'conflict');
  assert.equal(await p.locator('#pickLockedNote').isVisible(),true);assert.match(await p.textContent('#pickLockedNote'),/現在は固定中です。採用すると、この項目だけを選び直します/);
  await p.selectOption('#browseMajor','truth');await p.locator('#browseList .browse-row').nth(0).click();const id=await chosenId(p);
  await p.uncheck('#pickLockAfter');await p.click('#pickUse');
  const after=await read();assert.equal(after.items.conflict.candidateId,id);assert.equal(after.locks.conflict,false);
  assert.deepEqual({...after.items,conflict:null},{...mid.items,conflict:null});assert.deepEqual(after.questions,mid.questions);assert.deepEqual(after.characters,mid.characters);assert.deepEqual(after.metadata,mid.metadata);
  await p.click('#undo');assert.deepEqual((await read()).items.conflict,mid.items.conflict);assert.equal((await read()).locks.conflict,true);
 }));

 await check('browse: an unapplied edit of the same item asks before replacing it, and cancel keeps both',()=>fresh(async(p,read)=>{
  const card=p.locator('[data-key="gimmick"]');await card.getByRole('button',{name:'ギミックを編集',exact:true}).click();await p.fill('#input-gimmick','まだ反映していないギミック');
  const before=await read();
  await open(p,'gimmick');await p.locator('#browseList .browse-row').nth(3).click();const id=await chosenId(p);await p.click('#pickUse');
  await p.locator('#decisionDialog[open]').waitFor();await p.locator('#decisionActions').getByRole('button',{name:'キャンセル'}).click();
  assert.equal(await sheetOpen(p),true);assert.deepEqual(await read(),before);assert.equal(await p.inputValue('#input-gimmick'),'まだ反映していないギミック');
  await p.click('#pickUse');await p.locator('#decisionActions').getByRole('button',{name:'編集中の本文を破棄して素材を使う'}).click();
  assert.equal(await sheetOpen(p),false);assert.equal((await read()).items.gimmick.candidateId,id);assert.equal(await card.locator('.editor').isHidden(),true);
 }));

 await check('browse: out-of-condition and stage-mix materials show reasons, adopt explicitly, and never change site settings',()=>fresh(async(p,read)=>{
  await p.click('#openSettings');await p.selectOption('#stageSelect','wafu');await p.selectOption('#toneSelect','3');await p.click('#doneSettings');
  const settings=(await read()).settings;
  await open(p,'world');
  const fitCount=await pathCount(p);await p.check('input[name="browseScope"][value="all"]');assert.ok(await pathCount(p)>fitCount);
  await p.selectOption('#browseMajor','mix');await p.selectOption('#browseMinor','fantasy+school');
  const row=p.locator('#browseList .browse-row').first();assert.match(await row.textContent(),/条件外/);assert.match(await row.textContent(),/複合舞台用：学園 × ファンタジー/);
  await row.click();assert.equal(await p.locator('#pickMisfit').isVisible(),true);assert.match(await p.textContent('#pickMisfit'),/条件外：.*複合舞台用（学園 × ファンタジー）/);
  assert.match(await p.locator('.browse-preview').textContent(),/条件外：/);
  await p.screenshot({path:path.join(out,'browse-misfit-390.png')});
  await p.click('#pickUse');const after=await read();
  assert.deepEqual(after.settings,settings,'site settings changed');assert.deepEqual(after.items.world.blendPairs,['fantasy+school']);
  assert.match(await p.textContent('#toast'),/条件外の素材です。/);
  await p.click('#rollAll');assert.deepEqual((await read()).items.world,after.items.world,'locked world stays');assert.deepEqual((await read()).settings,settings);
  // 背景が必要な素材：理由は「必要な背景」。採用しても世界の背景は足さない。
  await open(p,'relation');await p.check('input[name="browseScope"][value="all"]');await p.fill('#browseSearch','獣人');
  const needs=p.locator('#browseList .browse-item').filter({hasText:'必要な背景'}).first();
  if(await needs.count()){await needs.locator('.browse-row').click();assert.match(await p.textContent('#pickMisfit'),/必要な背景：/);await p.click('#pickUse');assert.deepEqual((await read()).items.world,after.items.world);}
 }));

 await check('browse: sheet fits 320/390/768/1280px, selects and long text stay inside, the use button is reachable by keyboard',()=>fresh(async p=>{
  await open(p,'conflict');await p.check('input[name="browseScope"][value="all"]');await p.locator('#browseList .browse-row').nth(4).click();
  for(const width of [320,390,768,1280]){
   await p.setViewportSize({width,height:width<700?700:900});
   const r=await p.evaluate(()=>{const sheet=document.querySelector('#pickSheet .sheet-frame'),over=[...sheet.querySelectorAll('select,button,input,.pick-text,.browse-tag')].filter(x=>{const b=x.getBoundingClientRect(),s=sheet.getBoundingClientRect();return b.width&&(b.right>s.right+1||b.left<s.left-1);}).map(x=>x.id||x.className);return {page:document.documentElement.scrollWidth>innerWidth,sheet:sheet.scrollWidth>sheet.clientWidth+1,over};});
   assert.equal(r.page,false,`page overflow at ${width}`);assert.equal(r.sheet,false,`sheet overflow at ${width}`);assert.deepEqual(r.over,[],`controls overflow at ${width}`);
   for(const id of ['#pickModeBrowse','#pickModeTen','#browseMajor','#browseMinor','#browseGacha','#pickUse','#closePick'])assert.ok((await p.locator(id).boundingBox()).height>=44,`${id} under 44px at ${width}`);
   const use=await p.locator('#pickUse').boundingBox();assert.ok(use.y+use.height<=(width<700?700:900)+1,'use button off-screen');
   await p.screenshot({path:path.join(out,`browse-${width}.png`)});
  }
  await p.selectOption('#browseMajor','self');await p.locator('#browseMajor').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'browseMinor');
  await p.locator('#browseList .browse-row').nth(2).focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#browseList .browse-row').nth(2).getAttribute('aria-pressed'),'true');
  await p.locator('#pickUse').focus();await p.keyboard.press('Enter');assert.equal(await sheetOpen(p),false);
  assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('aria-label')),'葛藤を素材から選ぶ');
 }));

 await check('browse: the 14 optional fields offer the same entry; an unset counterpart secret is chosen by branch and undoable',()=>fresh(async(p,read)=>{
  await p.locator('#charactersDetails>summary').click();await p.locator('#progressionDetails>summary').click();await p.locator('#sceneDetails>summary').click();
  for(const container of ['#characterFields','#progressionFields','#sceneFields'])for(const card of await p.locator(`${container} .field-card`).all()){
   const labels=await card.locator('button').evaluateAll(xs=>xs.filter(x=>x.checkVisibility()).map(x=>x.textContent.trim()));
   assert.deepEqual(labels,['固定','引き直す','素材から選ぶ','編集'],await card.getAttribute('data-key'));
  }
  const before=await read();assert.equal(before.items['counterpart.secret'],null);
  await p.locator('[data-key="counterpart.secret"] .pick-btn').click();await p.locator('#pickSheet[open]').waitFor();await p.locator('#browseList .browse-row').first().waitFor();
  assert.equal(await p.textContent('#pickTitle'),'相手役の秘密の素材を選ぶ');assert.equal(await p.textContent('#pickCurrent'),'未設定');
  const majors=await p.locator('#browseMajor option').allTextContents();assert.ok(majors.some(t=>t.startsWith('記録・証拠（')),majors.join());
  await p.selectOption('#browseMajor','record');await p.selectOption('#browseMinor','doc');
  await p.locator('#browseList .browse-row').first().click();const id=await chosenId(p);assert.match(id,/^counterpart-secret-/);
  assert.ok((await p.evaluate(async id=>{const m=await import('./js/browse-map-extra.js');return m.BROWSE_MAP_EXTRA.secret[id.replace('counterpart-','')];},id)).split('|').includes('record.doc'));
  await p.click('#pickUse');const after=await read();
  assert.equal(after.items['counterpart.secret'].candidateId,id);assert.equal(after.locks['counterpart.secret'],true);
  assert.deepEqual({...after.items,'counterpart.secret':null},{...before.items,'counterpart.secret':null});
  await p.click('#undo');assert.equal((await read()).items['counterpart.secret'],null);assert.equal((await read()).locks['counterpart.secret'],false);
  // 入口の項目もお任せ10候補で選べる。
  await p.locator('[data-key="scene.goal"] .pick-btn').click();await p.locator('#pickSheet[open]').waitFor();await p.locator('#pickModeTen').click();
  assert.ok(await p.locator('#pickList .pick-row').count()>=1);await p.locator('#pickList .pick-row').first().click();await p.click('#pickUse');
  assert.ok((await read()).items['scene.goal']);
  await p.screenshot({path:path.join(out,'browse-optional-390.png')});
 }));
};
