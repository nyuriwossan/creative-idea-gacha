const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
module.exports=async({browser,base,out,check})=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{let n=5105;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}}});});
 const boot=async()=>{await p.goto(base);await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();};
 const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('creativeIdeaGacha_v2')));
 try{
 await boot();
 await check('round5 school tone5 uses constrained world, retains settings-only behavior and locks',async()=>{
  const original=(await read()).current.items;await p.selectOption('#stageSelect','school');await p.selectOption('#toneSelect','5');assert.deepEqual((await read()).current.items,original);
  await p.click('#rollAll');const s=(await read()).current;assert.ok(s.items.world.candidateId.startsWith('sf-school-world-'));assert.ok(s.items.world.tones.includes(5));assert.match(s.items.world.text,/島外への通学手段|成績記録の訂正|仮設の教室と乏しい物資/);
  await p.locator('[data-key="world"]').getByRole('button',{name:'世界観の固定を切り替える'}).click();await p.click('#rollAll');assert.deepEqual((await read()).current.items.world,s.items.world);await p.click('#unlockAll');await p.click('#rollAll');assert.notEqual((await read()).current.items.world.candidateId,s.items.world.candidateId);
 });
 await check('round5 six stages preserve new candidate IDs through UI saves/reload, eight handoffs, Markdown and JSON',async()=>{
  for(const stage of ['school','underworld','western','research','modern','scifi']){
   await p.evaluate(async stage=>{
    const {DATA,BASIC}=await import('./js/data.js'),{STAGE_FILL_BASIC}=await import('./js/stage-fill-data.js'),{emptyState,rollFields,refreshTexts}=await import('./js/core.js'),{meetsContext}=await import('./js/context.js');
    const s=emptyState();Object.assign(s.settings,{stage,tone:3});
    const w=stage==='scifi'?DATA.world.find(r=>r.id==='r4-cross-scifi-world-appeal-ai'):STAGE_FILL_BASIC.world.find(r=>r.primaryStage===stage&&r.tones.includes(3))||DATA.world.find(r=>r.stageTags.includes(stage)&&r.tones.includes(3));
    rollFields(s,['world'],{data:{world:[w]},rng:()=>0});
    for(const [key] of BASIC.slice(1)){const pool=STAGE_FILL_BASIC[key].filter(r=>r.primaryStage===stage&&r.tones.includes(3)&&meetsContext(r,w.contextTags));rollFields(s,[key],{data:pool.length?{[key]:pool}:DATA,rng:()=>0});}
    refreshTexts(s,{rng:()=>0});s.metadata.name='第5回・'+stage;s.questions.consistency=[{id:'author-q',text:'引き継ぎの条件は？',answer:'作者があとで決める',locked:true}];localStorage.setItem('creativeIdeaGacha_v2',JSON.stringify({schemaVersion:2,current:s,works:[]}));
   },stage);
   await p.reload();await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();const state=(await read()).current;assert.ok(Object.values(state.items).some(r=>r?.candidateId?.startsWith('sf-')));
   await p.click('#saveNew');const saved=await read();await p.reload();await p.locator('#summaryBody').filter({hasText:'舞台'}).waitFor();assert.deepEqual(await read(),saved);
   await p.click('#openHandoff');for(const purpose of ['story','chat','brainstorm','setting'])for(const length of ['simple','detail']){await p.selectOption('#handoffPurpose',purpose);await p.selectOption('#handoffLength',length);await p.click('#copyHandoff');const text=await p.evaluate(()=>window.copied);assert.equal(text,await p.inputValue('#handoffPreview'));for(const row of Object.values(state.items).filter(Boolean))assert.ok(text.includes(row.text));assert.doesNotMatch(text,/sf-(school|modern|scifi|western|research|underworld)-/);assert.ok(text.includes('作者があとで決める'));}
   let pending=p.waitForEvent('download');await p.click('#exportCurrent');let download=await pending;await download.saveAs(path.join(out,`round5-${stage}.json`));let bundle=JSON.parse(fs.readFileSync(path.join(out,`round5-${stage}.json`),'utf8'));assert.deepEqual(bundle.works[0].state.items,state.items);
   pending=p.waitForEvent('download');await p.click('#downloadMarkdown');download=await pending;await download.saveAs(path.join(out,`round5-${stage}.md`));const markdown=fs.readFileSync(path.join(out,`round5-${stage}.md`),'utf8');for(const row of Object.values(state.items).filter(Boolean))assert.ok(markdown.includes(row.text));
   if(['school','scifi'].includes(stage)){await p.locator('#basicFields').evaluate(x=>x.scrollIntoView({block:'start'}));await p.screenshot({path:path.join(out,`round5-${stage}-mobile.png`)});}
  }
 });
 await check('round5 new generated edits, undo, separate save and reset actions preserve prose and answers',async()=>{
  const before=(await read()).current;await p.locator('[data-key="conflict"]').getByRole('button',{name:'葛藤を編集',exact:true}).click();await p.fill('#input-conflict',before.items.conflict.text+'。作者が結末を考える');await p.click('#copyHandoff');const edited=(await read()).current;assert.equal(edited.items.conflict.source,'custom');assert.equal(edited.locks.conflict,true);assert.match(await p.evaluate(()=>window.copied),/作者が結末を考える/);
  await p.click('#undo');assert.deepEqual((await read()).current.items,before.items);await p.click('#redo');assert.deepEqual((await read()).current,edited);await p.fill('#workName','第5回・別案');await p.click('#saveAs');assert.equal((await read()).works.length,2);
  await p.click('#unlockAll');const reset=(await read()).current;assert.deepEqual(reset.items,edited.items);assert.equal(reset.questions.consistency[0].answer,'作者があとで決める');await p.click('#clearThemes');assert.deepEqual((await read()).current.items,edited.items);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 });
 }finally{await ctx.close();}
};
