// 青空文庫（著作権切れ）の作品から一般化した素材（54件）。本文は写さず、構造・立場・葛藤の型だけを15字前後にした。
// 12列：key|slug|本文|タイトル短語|トーン|topics|context|stage|追加テーマ|shape|作品|一般化した内容
// context は世界観では「その世界が持つ背景」、他の項目では「必要な背景」。出典は素材の行に混ぜず、AOZORA_SOURCE_* に分けて持つ（保存データ・画面には出さない）。
const KEYS=['world','genre','relation','incident','conflict','gimmick','twist'];
const CHARACTER_KEYS=['role','secret'];
const split=value=>value?value.split(','):[];

// 作品ごとの出典。根拠は2026-10-09に青空文庫公式CSVで照合したもの。
export const AOZORA_SOURCES={
 "bocchan": {
  "sourceWork": "坊っちゃん",
  "author": "夏目漱石",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000148/card752.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000148/files/752_ruby_2438.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1916-12-09",
  "extractedAt": "2026-10-09"
 },
 "rashomon": {
  "sourceWork": "羅生門",
  "author": "芥川竜之介",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000879/card127.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000879/files/127_ruby_150.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1927-07-24",
  "extractedAt": "2026-10-09"
 },
 "ginga": {
  "sourceWork": "銀河鉄道の夜",
  "author": "宮沢賢治",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000081/card456.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000081/files/456_ruby_145.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1933-09-21",
  "extractedAt": "2026-10-09"
 },
 "melos": {
  "sourceWork": "走れメロス",
  "author": "太宰治",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000035/card1567.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000035/files/1567_ruby_4948.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1948-06-13",
  "extractedAt": "2026-10-09"
 },
 "takase": {
  "sourceWork": "高瀬舟",
  "author": "森鴎外",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000129/card691.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000129/files/691_ruby_15351.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1922-07-09",
  "extractedAt": "2026-10-09"
 },
 "sangetsu": {
  "sourceWork": "山月記",
  "author": "中島敦",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000119/card624.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000119/files/624_ruby_5668.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1942-12-04",
  "extractedAt": "2026-10-09"
 },
 "takekurabe": {
  "sourceWork": "たけくらべ",
  "author": "樋口一葉",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000064/card389.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000064/files/389_ruby_15296.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1896-11-23",
  "extractedAt": "2026-10-09"
 },
 "gon": {
  "sourceWork": "ごん狐",
  "author": "新美南吉",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000121/card628.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000121/files/628_ruby_649.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1943-03-22",
  "extractedAt": "2026-10-09"
 },
 "nisen": {
  "sourceWork": "二銭銅貨",
  "author": "江戸川乱歩",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/001779/card56647.html",
  "textUrl": "https://www.aozora.gr.jp/cards/001779/files/56647_ruby_58166.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1965-07-28",
  "extractedAt": "2026-10-09"
 },
 "koya": {
  "sourceWork": "高野聖",
  "author": "泉鏡花",
  "translator": "",
  "aozoraUrl": "https://www.aozora.gr.jp/cards/000050/card521.html",
  "textUrl": "https://www.aozora.gr.jp/cards/000050/files/521_ruby_20582.zip",
  "copyrightChecked": true,
  "copyrightBasis": "青空文庫公式CSV（作家別作品一覧拡充版）で作品著作権フラグ・人物著作権フラグが「なし」、役割が著者のみ。没年1939-09-07",
  "extractedAt": "2026-10-09"
 }
};

export function parseAozora(text){
 const rows=text.split('\n').map(r=>r.trim()).filter(r=>r&&!r.startsWith('#')).map(line=>{
  const cells=line.split('|').map(c=>c.trim());
  if(cells.length!==12)throw Error('Expected 12 columns: '+line);
  const [key,slug,body,titleWord,tones,topics,context,stage,themes,shape,work,note]=cells;
  if(![...KEYS,...CHARACTER_KEYS].includes(key)||(key==='relation'?!['pair','group'].includes(shape):shape!==''))throw Error('Invalid aozora field/shape: '+line);
  if(!slug||!body||!titleWord||!note||!/^[1-5]+$/.test(tones)||new Set(tones).size!==tones.length)throw Error('Invalid aozora row: '+line);
  if(!AOZORA_SOURCES[work])throw Error('Unknown aozora work: '+line);
  return {key,work,note,row:{id:`az-${key}-${slug}`,text:body,titleWord,tones:[...tones].map(Number),source:'generated',origin:'aozora',topicTags:split(topics),contextTags:split(context),requiresContext:key==='world'?[]:split(context),stageTags:split(stage),themeTags:split(themes),plotLinks:[],...(key==='relation'?{relationShape:shape}:{})}};
 });
 if(new Set(rows.map(r=>r.row.id)).size!==rows.length)throw Error('Duplicate aozora ID');
 const pick=keys=>Object.fromEntries(keys.map(key=>[key,rows.filter(r=>r.key===key).map(r=>r.row)]));
 return {basic:pick(KEYS),characters:pick(CHARACTER_KEYS),sourceById:Object.fromEntries(rows.map(r=>[r.row.id,{work:r.work,sourceNote:r.note}]))};
}

const PARSED=parseAozora(`
relation|newcomer-veteran|新任と古参の反目|新任と古参|234|identity-role||school,modern|rivalry,daily-work|pair|bocchan|職場内の新旧対立を一般化
world|split-workplace|派閥が割れる狭い職場|割れる職場|234|identity-role||school,modern|daily-work||bocchan|閉じた職場の派閥構造
conflict|honest-vs-org|正直さと組織の都合|正直と都合|234|identity-role||school,modern|daily-work||bocchan|誠実さと所属の板挟み
role|posted-newcomer|地方へ赴任した新任|赴任した新任|123|identity-role||school,modern,wafu|daily-work||bocchan|外部から来た新参の立場
relation|selfless-servant|見返りなく庇う使用人|無償の庇護者|123|loyalty||wafu,western|found-family,master-servant|pair|bocchan|無条件の庇護関係
twist|kind-calculation|親切の裏にある打算|親切の裏|234|asymmetric-info||school,modern|mystery||bocchan|好意に見える行為の裏
world|ruined-capital|荒廃した都|荒れた都|345|escape||wafu,fantasy|journey||rashomon|荒廃した社会の前提
incident|rain-guest|雨宿りの先客|雨宿りの先客|234|asymmetric-info||wafu,fantasy,western|mystery||rashomon|見知らぬ先客との出会い
conflict|survive-conscience|生き延びる術と良心|生存と良心|345|loyalty||wafu,fantasy,underworld|rescue||rashomon|生存と倫理の衝突
role|dismissed-servant|暇を出された奉公人|職を失った奉公人|234|loyalty||wafu,western|master-servant||rashomon|職を失った下働き
twist|seek-excuse|許される理由を探す|許しの理由|345|asymmetric-info||wafu,underworld|rivalry||rashomon|行為を理由づけで支える心の動きを一般化
world|star-festival|星祭りの夜の町|星祭りの町|123|faith||wafu,western,fantasy|daily-work||ginga|祭りの夜の暮らし
incident|strange-train|見知らぬ列車に乗る|謎の列車|234|caravan||fantasy,scifi,modern|journey,mystery||ginga|日常から離れる旅の開始
conflict|common-vs-own|皆の幸せと自分の幸せ|皆の幸せ|234|resource-fairness||fantasy,wafu,modern|found-family||ginga|全体の幸福と個人の願い
gimmick|blank-ticket|行き先の書かれない切符|行き先なき切符|234|return-home|magic|fantasy,scifi|journey||ginga|行き先が定まらない通行証
relation|quarrel-trip|仲違い中の友との旅|仲違いの旅|234|relationship-choice||modern,school,fantasy|reunion,buddy|pair|ginga|気まずい同行の関係を一般化
role|family-carer|病身の家族を支える子|家族を支える子|234|mutual-aid||modern,wafu,school|daily-work||ginga|家庭の事情を抱える立場
incident|substitute-hostage|身代わりの人質|身代わり人質|345|loyalty||western,fantasy,wafu|rescue||melos|誰かが代わりに残る状況
conflict|promise-life|約束と命の重さ|約束と命|345|loyalty||western,fantasy,wafu|rescue||melos|約束と自己保存の板挟み
relation|suspicious-king|疑い深い王と民|疑う王と民|345|court||western,fantasy,wafu|rivalry|group|melos|不信から始まる統治
twist|doubter-tested|疑う側が試される|試される不信|345|asymmetric-info||western,fantasy|rivalry||melos|前提を反転させる
world|prisoner-boat|罪人を運ぶ川舟|罪人の川舟|234|escape||wafu,western|rescue||takase|移送という制度と暮らし
relation|escort-prisoner|護送役と罪人の道中|護送の道中|234|loyalty||wafu,western,modern|rescue|pair|takase|監視する側とされる側
incident|boat-confession|舟の上の打ち明け話|舟上の告白|234|asymmetric-info||wafu,western|mystery||takase|閉じた場所での告白
conflict|mercy-vs-rule|情けと掟の線引き|情けと掟|234|loyalty||wafu,western,modern|rescue||takase|思いやりと規則の衝突
twist|help-or-sin|救いのつもりが罪|救いと罪|345|asymmetric-info||wafu,western,research|rescue||takase|善意の行為の評価が揺らぐ
secret|unjudged-doubt|裁けない迷いを抱えている|裁けない迷い|234|asymmetric-info||wafu,western,modern|mystery||takase|判断を抱えた立場を一般化
world|fame-society|名声を競う文人社会|名を競う世界|234|identity-role||wafu,fantasy|rivalry||sangetsu|才を競い合う閉じた社会
incident|vanished-talent|消息を絶った才人|消えた才人|234|escape||wafu,fantasy,modern|reunion,mystery||sangetsu|失踪した人物の手がかり
relation|hidden-old-friend|姿を隠した旧友|隠れた旧友|234|relationship-choice||wafu,fantasy,modern|reunion|pair|sangetsu|再会に壁がある旧友
conflict|pride-vs-effort|才への自負と努力不足|自負と怠り|234|identity-role||wafu,modern,school|rivalry||sangetsu|自己評価と現実の差
gimmick|unfinished-poems|託された未完の詩稿|未完の詩稿|234|memory||wafu,fantasy,modern|reunion||sangetsu|未完の作品を託す
role|retired-official|職を辞した官吏|辞した官吏|234|identity-role||wafu,fantasy|daily-work||sangetsu|組織を離れた元役人
world|pleasure-quarter-town|花街のそばの町|花街の町|234|identity-role||wafu|daily-work||takekurabe|特殊な生業が隣り合う町
relation|diverging-friends|進路が分かれる幼なじみ|分かれる幼なじみ|234|relationship-choice||wafu,modern,school|reunion|pair|takekurabe|同じ町で別の道を行く二人
conflict|pride-vs-honest|意地と素直な気持ち|意地と本心|234|relationship-choice||wafu,modern,school|romance||takekurabe|素直になれない相手への思い
incident|festival-quarrel|祭りの日の子供の喧嘩|祭りの喧嘩|234|faith||wafu|rivalry||takekurabe|子供集団の対立
role|heir-child|家業を継ぐ定めの子|継ぐ定めの子|234|craft||wafu|daily-work||takekurabe|家業と進路の縛りを一般化
relation|atoning-prankster|償いをするいたずら者|償う者|123|relationship-choice||wafu,western,fantasy|found-family|pair|gon|過去の悪事を償う関係
conflict|atone-unnamed|償いと名乗れない事情|名乗れない償い|234|asymmetric-info||wafu,western,fantasy|mystery||gon|伝えたいが伝えられない
gimmick|doorstep-gift|戸口に置かれる贈り物|戸口の贈り物|123|mutual-aid||wafu,western,modern|mystery||gon|誰からか分からない贈り物
incident|village-funeral|村の葬いを見かける|村の葬い|234|faith||wafu,western|daily-work||gon|他人の不幸に気づく
twist|unnoticed-kindness|気づかれない親切|気づかれぬ親切|234|asymmetric-info||wafu,western,fantasy|mystery||gon|行き違う好意の構造を一般化
world|mountain-village|山あいの小さな村|山あいの村|123|||wafu,western|daily-work||gon|小さな共同体の暮らし
gimmick|coded-coin|中に暗号がある硬貨|暗号入りの硬貨|234|asymmetric-info||modern,wafu|mystery||nisen|小物に隠された暗号
relation|wit-poor-friends|知恵を競う貧しい友|知恵比べの友|123|||modern,wafu,school|buddy,rivalry|pair|nisen|貧しい友同士の競い合い
incident|big-theft|大金の盗難事件|大金の盗難|234|record-conflict||modern,wafu|mystery||nisen|資金が消える事件
world|student-lodging|貧乏書生が集う下宿|書生の下宿|123|shared-home||modern,wafu|daily-work||nisen|若者が暮らす集合住居
role|jobless-student|定職のない書生|無職の書生|123|identity-role||modern,wafu|daily-work||nisen|定まらない生活の立場
world|mountain-pass|人里離れた峠道|峠道|234|caravan||wafu,fantasy|journey||koya|人里から遠い旅路
role|wandering-monk|諸国を巡る修行僧|巡る修行僧|234|faith||wafu,fantasy|journey||koya|旅で生きる宗教者
incident|lone-house|山中の一軒家に泊まる|山中の一軒家|234|caravan||wafu,fantasy,western|journey,mystery||koya|人里離れた宿り
conflict|precepts-vs-heart|戒律と心の揺れ|戒律と揺れ|234|faith||wafu,fantasy|myth||koya|守るべき規範と気持ち
twist|host-true-form|親切な主の本当の姿|主の本当の姿|345|asymmetric-info|magic|wafu,fantasy|myth||koya|親切な人物の正体が異質
`);

export const AOZORA_BASIC=PARSED.basic;
export const AOZORA_CHARACTERS=PARSED.characters;
// 素材ID（人物欄は protagonist-/counterpart- を付けたもの）から、出典を引く。見つからなければ null。
export function aozoraSourceOf(id){
 const base=String(id).replace(/^(protagonist|counterpart)-/,''),hit=PARSED.sourceById[base];
 return hit?{...AOZORA_SOURCES[hit.work],sourceType:'aozora-public-domain',sourceNote:hit.sourceNote}:null;
}
