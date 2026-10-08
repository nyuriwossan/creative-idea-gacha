const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.TEST_OUTPUT_DIR || path.join(__dirname,'../test-artifacts'));
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{let relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/creative-idea-gacha\//,'');if(!relative||relative.endsWith('/'))relative+='index.html';const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));});
fs.mkdirSync(out,{recursive:true});
const results=[];
function check(name,fn){return Promise.resolve().then(fn).then(()=>{results.push(name);console.log('PASS',name);});}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/creative-idea-gacha/`;
 const browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
 await require('./ui-helpers.cjs').installSettingsSheetHelper(browser);
 try{
 const ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();
 const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')));
 await check('Pages subpath boots, seven items, collapsed empty optional areas',async()=>{const s=(await read()).current;assert.equal(Object.values(s.items).filter(Boolean).length,7);assert.equal(await p.locator('#charactersDetails').evaluate(x=>x.open),false);assert.equal(await p.locator('#basicFields .field-card').count(),7);});
 await p.screenshot({path:path.join(out,'desktop.png'),fullPage:false});
 await check('settings retain materials and theme selection caps at three',async()=>{const before=(await read()).current.items;await p.selectOption('#stageSelect','scifi');await p.selectOption('#toneSelect','1');assert.deepEqual((await read()).current.items,before);await p.locator('#themeDetails summary').click();for(const key of ['buddy','mystery','journey','romance'])await p.locator(`[data-theme="${key}"]`).click();assert.equal((await read()).current.settings.themes.length,3);});
 await check('custom sentence, auto lock, safe HTML, draft preservation and input length error',async()=>{
  const card=p.locator('[data-key="incident"]');await card.getByRole('button',{name:'中心事件を編集',exact:true}).click();await p.fill('#input-incident','神託が下る <img src=x onerror="window.HACKED=true">');await p.fill('#short-incident','神託');await card.getByRole('button',{name:'反映',exact:true}).click();
  assert.equal((await read()).current.locks.incident,true);await p.click('#rollAll');assert.match((await read()).current.items.incident.text,/神託が下る/);assert.ok((await read()).current.items.world.stageTags.includes('scifi'));assert.equal(await p.evaluate(()=>window.HACKED),undefined);assert.equal(await p.locator('.field-value img').count(),0);
  const w=p.locator('[data-key="world"]');await w.getByRole('button',{name:'世界観を編集',exact:true}).click();await p.fill('#input-world','途中の編集');await p.click('#rollAll');assert.equal(await p.inputValue('#input-world'),'途中の編集');await p.fill('#input-world','あ'.repeat(501));await w.getByRole('button',{name:'反映',exact:true}).click();assert.equal(await p.inputValue('#input-world'),'あ'.repeat(501));assert.match(await p.locator('#error-world').textContent(),/500/);await w.getByRole('button',{name:'キャンセル',exact:true}).click();
 });
 await check('undo/redo restores text; draw focus remains on original button',async()=>{const before=(await read()).current;await p.click('#rollAll');const after=(await read()).current;await p.click('#undo');assert.deepEqual((await read()).current,before);await p.click('#redo');assert.deepEqual((await read()).current,after);await p.locator('[data-key="genre"] button').first().focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('aria-label')),'ジャンルを引き直す');});
 await check('names and optional groups generate only on explicit draw',async()=>{
  await p.locator('#charactersDetails>summary').click();assert.equal((await read()).current.items['protagonist.role'],null);await p.fill('#protagonistName','葵');await p.click('#rollCharacters');assert.equal((await read()).current.characters.protagonist.name,'');assert.equal(await p.inputValue('#protagonistName'),'葵');assert.equal(Object.keys((await read()).current.items).filter(k=>/^(protagonist|counterpart)\./.test(k)).length,6);assert.ok((await read()).current.items['counterpart.secret']);const extra=(await read()).current.items['protagonist.role'];await p.click('#rollAll');assert.deepEqual((await read()).current.items['protagonist.role'],extra);
  await p.locator('#progressionDetails>summary').click();await p.click('#rollProgression');assert.ok((await read()).current.items.deadline);
 });
 await check('question answers survive reroll, category and purpose switches',async()=>{
  await p.locator('#questionsDetails>summary').click();await p.click('#rollQuestions');await p.fill('#answer-world-0','この街では、店の人たちが助け合っている。');await p.locator('[data-category="world"] .question-slot').first().getByRole('button',{name:'回答を反映'}).click();const slot=(await read()).current.questions.world[0];await p.locator('[data-category="world"] .question-slot').first().getByRole('button',{name:'質問1の固定を切り替える'}).click();await p.click('#rollQuestions');assert.equal((await read()).current.questions.world[0].answer,slot.answer);
  await p.selectOption('#questionCategory','character');await p.click('#rollQuestions');await p.selectOption('#questionCategory','world');assert.equal(await p.inputValue('#answer-world-0'),slot.answer);
  const items=(await read()).current.items;await p.selectOption('#purposeSelect','漫画1話向け');assert.deepEqual((await read()).current.items,items);assert.match((await read()).current.texts.memo,/最後の引き/);await p.selectOption('#purposeSelect','連載プロット向け');assert.match((await read()).current.texts.memo,/縦軸/);await p.selectOption('#purposeSelect','AIキャラプロットの種');assert.match((await read()).current.texts.memo,/共同作業/);assert.doesNotMatch((await read()).current.texts.memo,/undefined/);
 });
 await check('new save, overwrite and separate save maintain IDs and independent snapshots',async()=>{
  await p.fill('#workName','星港の修理屋');await p.fill('#workTags','SF、あとで書く');await p.fill('#workNotes','互いの得意を認める話にしたい。');await p.click('#saveNew');const first=(await read()).works[0];assert.equal(first.state.metadata.name,'星港の修理屋');await p.fill('#workNotes','別の余韻も考える。');await p.click('#loadedLabel');assert.equal((await read()).works[0].state.metadata.notes,first.state.metadata.notes);await p.click('#saveOverwrite');assert.equal((await read()).works[0].id,first.id);await p.fill('#workName','星港の修理屋・別案');await p.click('#saveAs');assert.equal((await read()).works.length,2);assert.notEqual((await read()).works[1].id,first.id);
 });
 await check('search, favorite and duplicate works; dirty load offers three choices',async()=>{
  await p.fill('#searchWorks','あとで書く');assert.equal(await p.locator('.saved-card').count(),2);await p.locator('.saved-card').first().getByRole('button',{name:/お気に入り/}).click();await p.check('#favoriteOnly');assert.equal(await p.locator('.saved-card').count(),1);await p.uncheck('#favoriteOnly');await p.fill('#searchWorks','');await p.locator('.saved-card').first().getByRole('button',{name:'複製して編集'}).click();assert.equal((await read()).works.length,3);await p.fill('#workNotes','まだ保存していない変更');await p.locator('.saved-card').last().getByRole('button',{name:'読み込む',exact:true}).click();assert.equal(await p.locator('#decisionActions button').count(),3);await p.locator('#decisionActions').getByRole('button',{name:'キャンセル',exact:true}).click();assert.equal(await p.inputValue('#workNotes'),'まだ保存していない変更');
 });
 await check('Markdown and JSON downloads include optional fields, answers and notes',async()=>{
  let pending=p.waitForEvent('download');await p.click('#downloadMarkdown');let dl=await pending;await dl.saveAs(path.join(out,'sample-seed.md'));let body=fs.readFileSync(path.join(out,'sample-seed.md'),'utf8');assert.match(body,/葵/);assert.match(body,/この街では/);assert.match(body,/まだ保存していない変更/);
  pending=p.waitForEvent('download');await p.click('#exportCurrent');dl=await pending;await dl.saveAs(path.join(out,'sample-seed.json'));const raw=JSON.parse(fs.readFileSync(path.join(out,'sample-seed.json'),'utf8'));assert.equal(raw.app,'creative-idea-gacha');assert.equal(raw.works[0].state.questions.world[0].answer,'この街では、店の人たちが助け合っている。');
 });
 await check('validated JSON import previews before appending, future format rejected intact',async()=>{
  await p.locator('.backup-panel summary').click();await p.setInputFiles('#importFile',path.join(out,'sample-seed.json'));await p.locator('#confirmImport').waitFor();const before=(await read()).works.length;await p.click('#confirmImport');assert.equal((await read()).works.length,before+1);fs.writeFileSync(path.join(out,'future-test.json'),JSON.stringify({app:'creative-idea-gacha',schemaVersion:999,works:[]}));await p.setInputFiles('#importFile',path.join(out,'future-test.json'));await p.locator('#importPreview').filter({hasText:'取り込みできません'}).waitFor();assert.equal((await read()).works.length,before+1);
 });
 await check('delete cancellation leaves stored data intact',async()=>{const before=(await read()).works;await p.locator('.saved-card').first().getByRole('button',{name:'削除',exact:true}).click();await p.locator('#decisionActions').getByRole('button',{name:'キャンセル',exact:true}).click();assert.deepEqual((await read()).works,before);});
 await check('page reload restores current seed, generated text and question answers',async()=>{const old=(await read()).current;await p.reload();await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();assert.deepEqual((await read()).current,old);});
 // Representative screenshots use safe custom examples instead of generated XSS-test input.
 await p.locator('[data-key="incident"]').getByRole('button',{name:'中心事件を編集',exact:true}).click();await p.fill('#input-incident','観測装置が珍しい星の便りを拾う');await p.fill('#short-incident','星の便り');await p.locator('[data-key="incident"]').getByRole('button',{name:'反映',exact:true}).click();
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>document.querySelectorAll('details').forEach(x=>x.open=false));
 await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'mobile-initial.png')});
 await p.locator('[data-key="world"]').getByRole('button',{name:'世界観を編集',exact:true}).click();await p.fill('#input-world','宇宙港の片隅で、壊れた道具と人の縁を直す工房');await p.fill('#short-world','星港の工房');await p.locator('[data-key="world"]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'mobile-edit.png')});await p.locator('[data-key="world"]').getByRole('button',{name:'キャンセル',exact:true}).click();
 await p.locator('#charactersDetails>summary').click();await p.locator('#charactersDetails').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'mobile-characters.png')});await p.locator('#charactersDetails>summary').click();
 await p.locator('#questionsDetails>summary').click();await p.locator('[data-category="world"] .question-slot').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'mobile-questions.png')});await p.locator('#questionsDetails>summary').click();
 await p.locator('#savedList').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'mobile-library.png')});
 await check('no horizontal overflow at 360/390/430px with all sections expanded',async()=>{
  await p.evaluate(()=>document.querySelectorAll('details').forEach(x=>x.open=true));
  for(const width of [360,390,430]){await p.setViewportSize({width,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}
 });
 await check('native accordion keyboard and aria states; no unhandled browser errors',async()=>{await p.locator('#themeDetails summary').focus();const before=await p.locator('#themeDetails').evaluate(x=>x.open);await p.keyboard.press('Enter');assert.equal(await p.locator('#themeDetails').evaluate(x=>x.open),!before);assert.equal(errors.length,0,errors.join('\n'));});
 await check('all locked is a real no-op, and unchanged editing adds no history step',async()=>{
  while(await p.locator('#basicFields button[aria-pressed="false"]').count())await p.locator('#basicFields button[aria-pressed="false"]').first().click();const before=(await read()).current;await p.click('#rollAll');assert.deepEqual((await read()).current,before);
  await p.locator('[data-key="world"]').getByRole('button',{name:'世界観を編集',exact:true}).click();await p.locator('[data-key="world"]').getByRole('button',{name:'反映',exact:true}).click();assert.deepEqual((await read()).current,before);
 });
 await check('browser quota error retains the current state in memory and offers JSON export',async()=>{
  const original=(await read()).works;await p.evaluate(()=>{window.nativeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');};});
  await p.selectOption('#toneSelect','2');await p.locator('#storageWarning').filter({hasText:'保存できません'}).waitFor();await p.click('#saveAs');assert.match(await p.locator('#toast').textContent(),/保存できません/);assert.deepEqual((await read()).works,original);
  const pending=p.waitForEvent('download');await p.click('#exportCurrent');const dl=await pending;assert.ok(dl.suggestedFilename().endsWith('.json'));await p.evaluate(()=>Storage.prototype.setItem=window.nativeSetItem);
 });
 await check('failed clipboard fallback opens selectable text, without a success message',async()=>{
  await p.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}},configurable:true});window.nativeExecCommand=document.execCommand;document.execCommand=()=>false;});await p.locator('[data-copy="summary"]').click();await p.locator('#manualCopy[open]').waitFor();assert.match(await p.inputValue('#manualCopyText'),/舞台/);await p.click('#closeManualCopy');await p.evaluate(()=>document.execCommand=window.nativeExecCommand);
 });
 await ctx.close();
 // Theme-pack acceptance runs in its own clean profile, through the same UI users operate.
 const themeContext=await browser.newContext({viewport:{width:1280,height:960},acceptDownloads:true}),tp=await themeContext.newPage();const themeErrors=[];tp.on('pageerror',e=>themeErrors.push(e.message));await tp.goto(base);await tp.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();
 const themeRead=()=>tp.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')).current);
 const choose=async(themes,tone='3')=>{if(!await tp.locator('#themeDetails').evaluate(x=>x.open))await tp.locator('#themeDetails summary').click();await tp.click('#clearThemes');await tp.selectOption('#stageSelect','fantasy');await tp.selectOption('#toneSelect',tone);for(const id of themes)await tp.locator(`[data-theme="${id}"]`).click();};
 const related=(s,themes)=>Object.entries(s.items).filter(([k,i])=>!k.includes('.')&&['world','genre','relation','incident','conflict','gimmick','twist'].includes(k)&&i?.themeTags.some(t=>themes.includes(t)));
 await check('eight understandable pack choices, twelve classic choices and next-draw summary',async()=>{
  assert.equal(await tp.locator('#themeDetails').evaluate(x=>x.open),false);await choose(['beastfolk']);assert.equal(await tp.locator('#packButtons button').count(),10);assert.equal(await tp.locator('#classicThemeButtons button').count(),12);assert.match(await tp.locator('#activeThemes').textContent(),/獣人・人外社会.*次の抽選/);await tp.screenshot({path:path.join(out,'theme-selection-desktop.png')});
 });
 const examples={};
 for(const [id,label] of [['beastfolk','beastfolk'],['desert-court','desert-court'],['romantasy','romantasy'],['cozy-fantasy','cozy-fantasy']])await check(`${label} actual UI draw reflects world and at least three categories`,async()=>{
  await choose([id],id==='cozy-fantasy'?'1':'3');await tp.click('#rollAll');const s=await themeRead();assert.ok(s.items.world.themeTags.includes(id));assert.ok(related(s,[id]).length>=3);assert.ok(['relation','incident','conflict','gimmick','twist'].filter(k=>s.items[k].themeTags.includes(id)).length>=2);if(id==='cozy-fantasy')for(const k of ['world','genre','relation','incident','conflict','gimmick','twist'])assert.ok(s.items[k].tones.includes(1));examples[id]=s;await tp.locator('#themeDetails summary').click();await tp.locator('#activeThemes').evaluate(x=>x.scrollIntoView({block:'start'}));await tp.screenshot({path:path.join(out,`${label}-draw.png`)});
 });
 await check('three-pack mixed UI draw includes every selected direction',async()=>{
  const themes=['beastfolk','desert-court','romantasy'];await choose(themes);await tp.click('#rollAll');const s=await themeRead();for(const id of themes)assert.ok(related(s,[id]).length);assert.ok(related(s,themes).length>=3);examples.mixed=s;await tp.locator('#themeDetails summary').click();await tp.locator('#activeThemes').evaluate(x=>x.scrollIntoView({block:'start'}));await tp.screenshot({path:path.join(out,'mixed-draw-desktop.png')});
  await tp.setViewportSize({width:390,height:844});await tp.locator('#activeThemes').evaluate(x=>x.scrollIntoView({block:'start'}));await tp.screenshot({path:path.join(out,'mixed-draw-mobile.png')});
  await tp.locator('#themeDetails summary').click();await tp.locator('#themeDetails').evaluate(x=>x.scrollIntoView({block:'start'}));await tp.screenshot({path:path.join(out,'theme-selection-mobile.png')});await tp.locator('#themeDetails summary').click();
 });
 await check('background editor is explicit, draft checkboxes survive rendering and apply with auto lock',async()=>{
  const w=tp.locator('[data-key="world"]');await w.getByRole('button',{name:'世界観を編集',exact:true}).click();assert.equal(await w.locator('input[type="checkbox"]:checked').count(),0);await tp.fill('#input-world','砂漠の王宮に、獣人と人間が通う魔法の工房がある');await tp.fill('#short-world','砂漠の工房');for(const id of ['beastfolk','desert','royal','magic'])await tp.check(`#context-${id}`);
  await tp.selectOption('#toneSelect','2');assert.equal(await w.locator('input[type="checkbox"]:checked').count(),4);assert.match(await tp.inputValue('#input-world'),/砂漠の王宮/);await w.locator('.background-editor').scrollIntoViewIfNeeded();await tp.screenshot({path:path.join(out,'background-edit-mobile.png')});await w.getByRole('button',{name:'反映',exact:true}).click();const s=await themeRead();assert.equal(s.locks.world,true);assert.deepEqual(s.items.world.contextTags,['beastfolk','desert','royal','magic']);assert.deepEqual(s.items.world.themeTags,[]);assert.equal(await w.locator('.material-tag').count(),0);
 });
 await check('custom background JSON, Markdown, reload and checkbox-only drafts are protected',async()=>{
  let pending=tp.waitForEvent('download');await tp.click('#exportCurrent');let dl=await pending;await dl.saveAs(path.join(out,'background-roundtrip.json'));const raw=JSON.parse(fs.readFileSync(path.join(out,'background-roundtrip.json'),'utf8'));assert.deepEqual(raw.works[0].state.items.world.contextTags,['beastfolk','desert','royal','magic']);
  pending=tp.waitForEvent('download');await tp.click('#downloadMarkdown');dl=await pending;await dl.saveAs(path.join(out,'background-roundtrip.md'));assert.match(fs.readFileSync(path.join(out,'background-roundtrip.md'),'utf8'),/獣人・知性ある人外、砂漠、王族・宮廷、魔法/);
  await tp.reload();await tp.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();const w=tp.locator('[data-key="world"]');await w.getByRole('button',{name:'世界観を編集',exact:true}).click();assert.equal(await w.locator('input[type="checkbox"]:checked').count(),4);await tp.check('#context-trade');const download=tp.waitForEvent('download');await tp.click('#exportCurrent');await download;assert.ok((await themeRead()).items.world.contextTags.includes('trade'));assert.equal(await tp.locator('#editor-world').isVisible(),false);
 });
 await check('locked plain world never gains beastfolk or magic and limitations remain visible',async()=>{
  const w=tp.locator('[data-key="world"]');await w.getByRole('button',{name:'世界観を編集',exact:true}).click();await tp.fill('#input-world','人間だけが暮らす静かな町');await tp.fill('#short-world','静かな町');for(const id of ['beastfolk','desert','royal','magic','trade'])await tp.uncheck(`#context-${id}`);await w.getByRole('button',{name:'反映',exact:true}).click();await choose(['beastfolk']);const before=(await themeRead()).items.world;await tp.click('#rollAll');const s=await themeRead();assert.deepEqual(s.items.world,before);for(const k of ['genre','relation','incident','conflict','gimmick','twist'])assert.equal(s.items[k].requiresContext.length,0);assert.equal(await tp.locator('#drawNotice').isVisible(),true);await tp.locator('#drawNotice').scrollIntoViewIfNeeded();await tp.screenshot({path:path.join(out,'locked-background-notice.png')});
 });
 await check('pack selection and background editing fit 360/390/430px with 44px controls and keyboard access',async()=>{
  await tp.locator('[data-key="world"]').getByRole('button',{name:'世界観を編集',exact:true}).click();for(const width of [360,390,430]){await tp.setViewportSize({width,height:844});assert.equal(await tp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await tp.locator('#packButtons button').evaluateAll(xs=>xs.every(x=>x.getBoundingClientRect().height>=44)),true);assert.equal(await tp.locator('.context-option').evaluateAll(xs=>xs.every(x=>x.getBoundingClientRect().height>=44)),true);}
  await tp.locator('#context-trade').focus();await tp.keyboard.press('Space');assert.equal(await tp.isChecked('#context-trade'),true);await tp.locator('[data-key="world"]').getByRole('button',{name:'キャンセル',exact:true}).click();assert.equal(themeErrors.length,0,themeErrors.join('\n'));
 });
 fs.writeFileSync(path.join(out,'actual-pack-draws.json'),JSON.stringify(examples,null,2));await themeContext.close();
 // Migration on a fresh browser origin; does not overwrite original keys or rebuild saved prose.
 const legacyContext=await browser.newContext(),lp=await legacyContext.newPage();
 await lp.addInitScript(()=>{if(localStorage.getItem('creativeIdeaGacha_v2'))return;const old={id:42,date:'2026/07/10 12:00',fav:true,tone:3,items:{world:{text:'以前の舞台',tags:['wafu'],tones:[3]}},locks:{world:true},texts:{summary:'以前の要約はそのまま',memo:'以前のメモ',hint:'以前のヒント',titles:['以前の題']}};localStorage.setItem('creativeIdeaGacha_state',JSON.stringify(old));localStorage.setItem('creativeIdeaGacha_savedItems',JSON.stringify([old]));});
 await lp.goto(base);await lp.locator('#summaryBody').filter({hasText:'以前の要約はそのまま'}).waitFor();
 await check('browser legacy migration preserves prose, favorite, locks and original backup',async()=>{const data=await lp.evaluate(()=>({v2:JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')),old:localStorage.getItem('creativeIdeaGacha_state'),backup:localStorage.getItem('creativeIdeaGacha_legacyBackup')}));assert.equal(data.v2.works[0].id,42);assert.equal(data.v2.works[0].fav,true);assert.equal(data.v2.current.locks.world,true);assert.ok(data.old&&data.backup);});
 await legacyContext.close();
 await require('./round3-browser.cjs')({browser,base,out,check});
 await require('./round4-browser.cjs')({browser,base,out,check});
 await require('./stage-fill-browser.cjs')({browser,base,out,check});
 await require('./modern-pro-browser.cjs')({browser,base,out,check});
 await require('./world-restructure-browser.cjs')({browser,base,out,check});
 await require('./stage-mix-browser.cjs')({browser,base,out,check});
 await require('./seed-core-browser.cjs')({browser,base,out,check});
 await require('./stage-expansion-browser.cjs')({browser,base,out,check});
 await require('./ui-v2-browser.cjs')({browser,base,out,check});
 fs.unlinkSync(path.join(out,'future-test.json'));
 fs.writeFileSync(path.join(out,'browser-check-results.json'),JSON.stringify({passed:results.length,checks:results,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
