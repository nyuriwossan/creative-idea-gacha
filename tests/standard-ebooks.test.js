import test from 'node:test';
import assert from 'node:assert/strict';
import {SE_BASIC,SE_CHARACTERS,SE_SOURCES,standardEbooksSourceOf,parseStandardEbooks} from '../js/standard-ebooks-data.js';
import {DATA,BASIC,THEMES,STAGES} from '../js/data.js';
import {EXTRA_DATA} from '../js/extra-data.js';
import {CONTEXTS,meetsContext} from '../js/context.js';
import {TOPICS} from '../js/story-metadata.js';
import {emptyState,rollFields,clone} from '../js/core.js';

const rngFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const all=[...Object.values(SE_BASIC).flat(),...Object.values(SE_CHARACTERS).flat()];
const isSe=item=>String(item?.candidateId??'').startsWith('se-');
const snapshot=row=>{const {id,origin,primaryPack,storyGroup,round4Group,primaryStage,stageFillBatch,modernProCategory,modernProBatch,...fields}=clone(row);return {...fields,candidateId:id,blendPairs:[]};};

test('65 rows are parsed once with valid columns, tones and shapes; IDs are unique across the whole data set',()=>{
 assert.equal(all.length,65);
 assert.deepEqual(Object.fromEntries(Object.entries(SE_BASIC).map(([k,v])=>[k,v.length])),{world:10,genre:0,relation:10,incident:11,conflict:10,gimmick:6,twist:7});
 assert.deepEqual(Object.fromEntries(Object.entries(SE_CHARACTERS).map(([k,v])=>[k,v.length])),{role:9,secret:2});
 for(const row of all){assert.equal(row.origin,'standard-ebooks');assert.equal(row.source,'generated');assert.ok(row.tones.length&&row.tones.every(t=>t>=1&&t<=5));assert.deepEqual(row.plotLinks,[]);}
 for(const row of SE_BASIC.relation)assert.ok(['pair','group'].includes(row.relationShape));
 for(const [key,rows] of Object.entries(EXTRA_DATA)){const ids=rows.map(r=>r.id);assert.equal(new Set(ids).size,ids.length,key);}
 for(const [key] of BASIC)for(const row of SE_BASIC[key])assert.ok(DATA[key].includes(row),row.id);
 for(const person of ['protagonist','counterpart'])for(const key of ['role','secret'])for(const row of SE_CHARACTERS[key])assert.ok(EXTRA_DATA[`${person}.${key}`].some(r=>r.id===`${person}-${row.id}`&&r.text===row.text),`${person}.${key} ${row.id}`);
 assert.throws(()=>parseStandardEbooks('world|x|本文|短語|234|||western||'),/12 columns/);
 assert.throws(()=>parseStandardEbooks('relation|x|本文|短語|234|||western||triad|alice|メモ'),/shape/);
 assert.throws(()=>parseStandardEbooks('world|x|本文|短語|234|||western|||nowhere|メモ'),/Unknown standard-ebooks work/);
});

test('display text stays short: 15 characters or fewer, and the short title word is shorter still',()=>{
 for(const row of all){const n=[...row.text].length;assert.ok(n>=4&&n<=15,`${row.id} ${row.text} (${n})`);assert.ok([...row.titleWord].length<=10,row.id);}
});

test('every row has a source, and every source is a public-domain work with an English original and no translator',()=>{
 assert.equal(Object.keys(SE_SOURCES).length,10);
 for(const [work,s] of Object.entries(SE_SOURCES)){
  assert.equal(s.copyrightChecked,true,work);assert.equal(s.translator,'',work);
  assert.match(s.standardEbooksUrl,/^https:\/\/standardebooks\.org\/ebooks\/[a-z-]+\/[a-z-]+(\/[a-z-]+)?$/,work);
  assert.ok(s.sourceTextUrl===''||s.sourceTextUrl===`${s.standardEbooksUrl}/text/single-page`,work);
  assert.ok(s.license.includes('パブリックドメイン'),work);assert.ok(s.jurisdictionNote.includes('戦時加算'),work);
  assert.match(s.extractedAt,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Number(/没年(\d{4})/.exec(s.copyrightBasis)[1])<=1930,`${work}: died after 1930`);
 }
 for(const row of all){const src=standardEbooksSourceOf(row.id);assert.ok(src,row.id);assert.equal(src.sourceType,'standard-ebooks-public-domain');assert.ok(src.sourceNote);}
 for(const person of ['protagonist','counterpart'])for(const row of SE_CHARACTERS.role)assert.equal(standardEbooksSourceOf(`${person}-${row.id}`).sourceWork,standardEbooksSourceOf(row.id).sourceWork);
 assert.equal(standardEbooksSourceOf('world-original-x'),null);
});

test('source information is never put on the rows themselves (saved data and screens stay unchanged)',()=>{
 const allowed=new Set(['id','text','titleWord','tones','source','origin','topicTags','contextTags','requiresContext','stageTags','themeTags','plotLinks','relationShape']);
 for(const row of all)for(const key of Object.keys(row))assert.ok(allowed.has(key),`${row.id}: ${key}`);
});

test('no title, author name or character name from the works is copied into a material',()=>{
 const names=['フランケンシュタイン','ヴィクター','アリス','ドラキュラ','ホームズ','ワトソン','ジキル','ハイド','ダーシー','ベネット','エリザベス','ピップ','エステラ','ハヴィシャム','マグウィッチ','シルバー','ホーキンズ','アーネスト','ブラックネル','ワーシング','メグ','エイミー','ローリー','宝島','若草物語','高慢と偏見','大いなる遺産','真面目が肝心','シェリー','キャロル','ストーカー','オースティン','ドイル','スティーブンソン','オルコット','ワイルド','ディケンズ'];
 const authors=Object.values(SE_SOURCES).map(s=>s.author);
 for(const row of all){for(const n of [...names,...authors])assert.ok(!row.text.includes(n)&&!row.titleWord.includes(n),`${row.id} contains ${n}`);}
});

test('every tag is in the shared dictionaries',()=>{
 for(const row of all){
  for(const tag of [...row.contextTags,...row.requiresContext])assert.ok(CONTEXTS.some(([id])=>id===tag),`${row.id} context ${tag}`);
  for(const tag of row.topicTags)assert.ok(TOPICS.some(([id])=>id===tag),`${row.id} topic ${tag}`);
  for(const tag of row.themeTags)assert.ok(THEMES.some(([id])=>id===tag),`${row.id} theme ${tag}`);
  for(const tag of row.stageTags)assert.ok(STAGES.some(([id])=>id===tag),`${row.id} stage ${tag}`);
 }
});

function drawWith(world,tone,times,seed){
 const s=emptyState();s.settings.tone=tone;s.items.world=snapshot(world);s.locks.world=true;
 const seen=[],recent={},rng=rngFor(seed);
 for(let i=0;i<times;i++){rollFields(s,BASIC.map(([k])=>k).filter(k=>k!=='world'),{data:EXTRA_DATA,recent,rng});for(const [key] of BASIC)if(key!=='world')seen.push(s.items[key]);}
 return seen;
}

test('the two materials that need magic appear only in worlds that have magic (1000 draws each way)',()=>{
 const magic=all.filter(r=>r.requiresContext.includes('magic'));
 assert.deepEqual(magic.map(r=>r.id).sort(),['se-gimmick-personality-draught','se-gimmick-size-changing-treat']);
 const world=DATA.world.find(w=>w.contextTags.includes('magic')&&w.stageTags.includes('fantasy')&&w.tones.some(t=>[3].includes(t)));assert.ok(world);
 const seen=drawWith(world,3,1000,11);
 assert.ok(seen.some(isSe),'no standard-ebooks material drawn in a magic world');
 const office=DATA.world.find(w=>w.stageTags.includes('modern')&&!(w.contextTags||[]).includes('magic')&&w.tones.includes(3));assert.ok(office);
 const none=drawWith(office,3,1000,99);
 assert.equal(none.filter(item=>isSe(item)&&item.requiresContext?.includes('magic')).length,0);
 for(const row of magic)assert.equal(meetsContext(row,office.contextTags||[]),false,row.id);
});

test('standard-ebooks materials can be drawn across tones, and no single work dominates a draw',()=>{
 const counts={};
 for(const tone of [1,2,3,4,5]){
  const world=DATA.world.find(w=>w.tones.includes(tone)&&w.stageTags.includes('wafu'))??DATA.world.find(w=>w.tones.includes(tone));
  const seen=drawWith(world,tone,600,tone*13);
  for(const item of seen)if(isSe(item)){const w=standardEbooksSourceOf(item.candidateId)?.sourceWork;counts[w]=(counts[w]||0)+1;}
 }
 assert.ok(Object.keys(counts).length>=6,JSON.stringify(counts));
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 assert.ok(Math.max(...Object.values(counts))/total<0.4,JSON.stringify(counts));
});
