// 海外の古典（Standard Ebooks 収録・パブリックドメイン）から一般化した素材（65件）。本文は写さず、構造・立場・葛藤の型だけを15字前後にした。
// 12列：key|slug|本文|タイトル短語|トーン|topics|context|stage|追加テーマ|shape|作品|一般化した内容
// context は世界観では「その世界が持つ背景」、他の項目では「必要な背景」。出典は素材の行に混ぜず、SE_SOURCES に分けて持つ（保存データ・画面には出さない）。
const KEYS=['world','genre','relation','incident','conflict','gimmick','twist'];
const CHARACTER_KEYS=['role','secret'];
const split=value=>value?value.split(','):[];

// 作品ごとの出典。権利の根拠は各エントリの copyrightBasis / jurisdictionNote。
export const SE_SOURCES={
 "frankenstein": {
  "sourceWork": "Frankenstein",
  "author": "Mary Shelley",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/mary-shelley/frankenstein",
  "standardEbooksRepo": "",
  "sourceTextUrl": "https://standardebooks.org/ebooks/mary-shelley/frankenstein/text/single-page",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1851年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1851年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "alice": {
  "sourceWork": "Alice's Adventures in Wonderland (illustrated by John Tenniel)",
  "author": "Lewis Carroll",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel",
  "standardEbooksRepo": "",
  "sourceTextUrl": "https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel/text/single-page",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1898年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1898年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "dracula": {
  "sourceWork": "Dracula",
  "author": "Bram Stoker",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/bram-stoker/dracula",
  "standardEbooksRepo": "",
  "sourceTextUrl": "",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1912年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1912年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "pride": {
  "sourceWork": "Pride and Prejudice",
  "author": "Jane Austen",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice",
  "standardEbooksRepo": "",
  "sourceTextUrl": "",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1817年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1817年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "holmes": {
  "sourceWork": "The Adventures of Sherlock Holmes",
  "author": "Arthur Conan Doyle",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/arthur-conan-doyle/the-adventures-of-sherlock-holmes",
  "standardEbooksRepo": "",
  "sourceTextUrl": "https://standardebooks.org/ebooks/arthur-conan-doyle/the-adventures-of-sherlock-holmes/text/single-page",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1930年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1930年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "treasure": {
  "sourceWork": "Treasure Island",
  "author": "Robert Louis Stevenson",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/robert-louis-stevenson/treasure-island",
  "standardEbooksRepo": "",
  "sourceTextUrl": "",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1894年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1894年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "women": {
  "sourceWork": "Little Women",
  "author": "Louisa May Alcott",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/louisa-may-alcott/little-women",
  "standardEbooksRepo": "",
  "sourceTextUrl": "",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1888年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1888年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "earnest": {
  "sourceWork": "The Importance of Being Earnest",
  "author": "Oscar Wilde",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/oscar-wilde/the-importance-of-being-earnest",
  "standardEbooksRepo": "",
  "sourceTextUrl": "https://standardebooks.org/ebooks/oscar-wilde/the-importance-of-being-earnest/text/single-page",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1900年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1900年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "expectations": {
  "sourceWork": "Great Expectations",
  "author": "Charles Dickens",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/charles-dickens/great-expectations",
  "standardEbooksRepo": "",
  "sourceTextUrl": "",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1870年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1870年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 },
 "jekyll": {
  "sourceWork": "The Strange Case of Dr. Jekyll and Mr. Hyde",
  "author": "Robert Louis Stevenson",
  "translator": "",
  "standardEbooksUrl": "https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde",
  "standardEbooksRepo": "",
  "sourceTextUrl": "https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde/text/single-page",
  "license": "CC0 1.0（Standard Ebooks版の成果物）／原作はパブリックドメイン",
  "jurisdictionNote": "原著者の没年は1894年で、日本の保護期間（死後70年）は戦時加算を含めても満了。英語の原作で翻訳者なし",
  "copyrightChecked": true,
  "copyrightBasis": "原著者の没年1894年（1930年以前）、翻訳者なし。作品ページの実在は検索で確認（2026-10-09）。没年はStandard Ebooksの作品ページで照合可能",
  "extractedAt": "2026-10-09"
 }
};

export function parseStandardEbooks(text){
 const rows=text.split('\n').map(r=>r.trim()).filter(r=>r&&!r.startsWith('#')).map(line=>{
  const cells=line.split('|').map(c=>c.trim());
  if(cells.length!==12)throw Error('Expected 12 columns: '+line);
  const [key,slug,body,titleWord,tones,topics,context,stage,themes,shape,work,note]=cells;
  if(![...KEYS,...CHARACTER_KEYS].includes(key)||(key==='relation'?!['pair','group'].includes(shape):shape!==''))throw Error('Invalid standard-ebooks field/shape: '+line);
  if(!slug||!body||!titleWord||!note||!/^[1-5]+$/.test(tones)||new Set(tones).size!==tones.length)throw Error('Invalid standard-ebooks row: '+line);
  if(!SE_SOURCES[work])throw Error('Unknown standard-ebooks work: '+line);
  return {key,work,note,row:{id:`se-${key}-${slug}`,text:body,titleWord,tones:[...tones].map(Number),source:'generated',origin:'standard-ebooks',topicTags:split(topics),contextTags:split(context),requiresContext:key==='world'?[]:split(context),stageTags:split(stage),themeTags:split(themes),plotLinks:[],...(key==='relation'?{relationShape:shape}:{})}};
 });
 if(new Set(rows.map(r=>r.row.id)).size!==rows.length)throw Error('Duplicate standard-ebooks ID');
 const pick=keys=>Object.fromEntries(keys.map(key=>[key,rows.filter(r=>r.key===key).map(r=>r.row)]));
 return {basic:pick(KEYS),characters:pick(CHARACTER_KEYS),sourceById:Object.fromEntries(rows.map(r=>[r.row.id,{work:r.work,sourceNote:r.note}]))};
}

const PARSED=parseStandardEbooks(`
relation|creator-creature|作り手と生まれた命|作った命|345|identity-role||scifi,research,western,fantasy|mystery,found-family|pair|frankenstein|創造者と被造物の関係の型
conflict|curiosity-vs-duty|探究心と作った責任|探究と責任|345|||scifi,research,western|mystery||frankenstein|知的欲求と結果への責任の衝突
incident|born-in-lab|研究室で生まれた存在|生まれた存在|345|||scifi,research,western|mystery||frankenstein|研究の成果が予想を超える状況
world|science-outpaces-ethics|科学が倫理を追い越す時代|科学と倫理|345|||scifi,research,western|mystery||frankenstein|技術の速度が規範を上回る社会
twist|feared-one-isolated|恐れられる側が孤立していた|孤立した異形|345|||scifi,research,fantasy,western|myth||frankenstein|加害者に見える側の事情が反転する
role|absorbed-scholar|研究に没頭する学徒|没頭する学徒|234|||research,western,scifi|mystery||frankenstein|探究に偏った立場
incident|fall-through-hole|穴に落ちて迷い込む|穴の向こう|123|||fantasy,isekai|journey||alice|日常から別世界への入り口
world|illogical-realm|理屈が通じない国|理屈の通じない国|123||magic|fantasy,isekai|journey||alice|常識が逆転した世界の前提
conflict|curiosity-vs-home|好奇心と帰りたい気持ち|好奇心と帰郷|123|return-home||fantasy,isekai|journey||alice|探索の欲と帰還の願い
role|stray-visitor|迷い込んだ来訪者|迷い込んだ客|123|||fantasy,isekai|journey||alice|世界の常識を知らない外部者
relation|odd-guide-and-lost|案内役の変人と迷子|案内役と迷子|123|||fantasy,isekai|buddy,journey|pair|alice|かみ合わない案内関係
gimmick|size-changing-treat|体の大きさを変える菓子|大きさを変える菓子|123||magic|fantasy|journey||alice|身体の尺度を変える小道具
incident|absurd-trial|理不尽な裁判に呼ばれる|理不尽な裁判|234|||fantasy,isekai,western|rivalry||alice|筋の通らない裁きの場
world|creature-in-old-house|古い館に潜む異形|館に潜む異形|345|||western,fantasy|myth,mystery||dracula|古い住まいに隠れる人ならざるもの
incident|visit-castle-on-deal|契約のため古城を訪ねる|古城への訪問|234|contract||western,fantasy|journey,mystery||dracula|仕事で訪ねた先の不穏さ
relation|pooled-records|記録を持ち寄る仲間|記録を持ち寄る|234|record-conflict||western,modern,fantasy|buddy,mystery|group|dracula|断片情報を共有する仲間
conflict|superstition-vs-reason|迷信と近代の知恵|迷信と知恵|234|||western,fantasy|myth,mystery||dracula|伝承と合理の対立
twist|fragments-reveal-truth|断片の記録が真相を結ぶ|記録がつなぐ真相|234|record-conflict||western,modern,fantasy|mystery||dracula|個々の記録が組み合わさって意味を持つ
role|dispatched-agent|遠方に派遣された代理人|派遣された代理人|234|negotiation||western,fantasy|journey||dracula|依頼で遠方へ行く立場
relation|bad-first-impression|第一印象が悪い二人|最悪の第一印象|123|relationship-choice||western,modern,school|romance,rivalry|pair|pride|誤解から始まる関係
world|marriage-decides-fate|結婚が家の命運を握る社会|縁組の社会|234|||western,wafu|status-gap||pride|縁組が家の将来を左右する社会
conflict|status-pride-vs-heart|身分の誇りと本心|誇りと本心|234|relationship-choice||western,wafu,modern|status-gap,romance||pride|立場の意識と本音のずれ
incident|wealthy-newcomer|近所に越してきた資産家|越してきた資産家|123|||western,wafu,modern|status-gap||pride|話題の人物の転入
twist|one-sided-rumor|悪評は片側の話だった|偏った悪評|234|asymmetric-info||western,wafu,modern|mystery||pride|噂の出どころが偏っていた
role|pressed-to-marry|縁談を急かされる人|縁談を急かされる|234|||western,wafu|status-gap||pride|周囲の期待に押される立場
relation|sleuth-and-flatmate|推理役と同居人|推理役と同居人|234|asymmetric-info||western,modern|buddy,mystery|pair|holmes|推理する者と同居人の組
incident|odd-client-visit|奇妙な依頼人の訪問|奇妙な依頼人|234|asymmetric-info||western,modern|mystery||holmes|不可解な依頼から始まる
world|fog-city-lodging|霧の都の下宿|霧の都の下宿|234|shared-home||western|mystery,daily-work||holmes|共同の住まいが拠点になる街
gimmick|trace-reading|小さな痕跡から読む手口|小さな痕跡|234|asymmetric-info||western,modern|mystery||holmes|些細な手がかりから推し量る
twist|false-client-story|依頼人の話が偽りだった|偽りの依頼|234|asymmetric-info||western,modern|mystery||holmes|依頼の前提が覆る
conflict|disclose-vs-keep|公表と守秘の間|公表と守秘|234|asymmetric-info||western,modern|mystery||holmes|真相を明かす責任と守る約束
role|case-consultant|事件を解く相談屋|相談屋|234|||western,modern|mystery,daily-work||holmes|持ち込まれた謎を扱う立場
gimmick|old-treasure-map|宝の場所を示す古地図|古い宝の地図|234|caravan||western,fantasy|journey||treasure|場所を示す手がかりの品
incident|late-guests-chest|亡き客が残した荷|残された荷|234|||western,fantasy|mystery,journey||treasure|預かった遺品から始まる
relation|child-and-double-dealer|子どもと裏のある同行者|裏のある同行者|234|loyalty||western,fantasy|journey,buddy|pair|treasure|信じたい相手と疑い
conflict|trust-judgment|仲間を信じる判断|信じる判断|234|loyalty||western,fantasy,underworld|journey,rivalry||treasure|信頼を置く相手の見極め
world|voyage-from-port|港から出る船旅|港の船旅|234|caravan||western,fantasy|journey||treasure|航海が暮らしの前提
twist|ally-is-risky|頼れる味方が危うい|危うい味方|345|loyalty||western,fantasy,underworld|rivalry,mystery||treasure|助け手の立場が反転する
role|inn-helper|宿の手伝いをする子|宿の手伝い|123|||western,fantasy|daily-work,journey||treasure|拠点を知る年少の立場
relation|sisters-unalike|性格の違う姉妹|性格の違う姉妹|123|mutual-aid||western,modern,wafu|found-family|group|women|価値観の異なるきょうだい
world|home-awaiting-return|家族の帰りを待つ家|帰りを待つ家|123|return-home||western,modern,wafu|found-family,daily-work||women|不在の家族を待つ暮らし
conflict|dream-vs-family|夢と家の事情|夢と家の事情|123|mutual-aid||western,modern,wafu|found-family||women|個人の望みと家計
incident|letter-from-far|遠い家族からの便り|遠くからの便り|123|return-home||western,wafu,modern|found-family||women|不在の人からの知らせ
role|eldest-breadwinner|家計を助ける年長の子|家計を助ける子|123|mutual-aid||western,modern,wafu|daily-work,found-family||women|家を支える立場
gimmick|family-newspaper|家族の手作り新聞|手作り新聞|123|record-conflict||western,modern,school|found-family,daily-work||women|家庭内の記録の習慣
gimmick|invented-alias|別人を名乗る作り話|別人を名乗る|123|asymmetric-info||western,modern|mystery||earnest|二つの顔を使い分ける口実
relation|friend-with-two-lives|二つの顔を持つ友|二つの顔の友|123|asymmetric-info||western,modern|buddy,mystery|pair|earnest|秘密を共有する友人
conflict|appearance-vs-heart|体裁と本心|体裁と本心|123|||western,modern,school|status-gap,romance||earnest|外面と気持ちの不一致
incident|namesake-visitor|同じ名前の来訪者|同じ名の来客|123|||western,modern|mystery||earnest|名前の重なりが混乱を呼ぶ
world|society-of-appearances|体面を重んじる社交界|体面の社交界|123|||western,modern|status-gap||earnest|評判が行動を縛る場
role|stern-guardian|厳しい後見役|厳しい後見役|123|||western,modern|status-gap||earnest|若者の進路を握る立場
incident|unknown-benefactor|正体不明の支援者が現れる|匿名の支援者|234|asymmetric-info||western,modern|mystery,status-gap||expectations|出所の分からない後ろ盾
conflict|rise-vs-old-debt|出世と昔の恩|出世と恩|234|loyalty||western,modern|status-gap||expectations|成功と過去への義理
relation|anonymous-patron|匿名の後援者と若者|匿名の後援者|234|asymmetric-info||western,modern|mystery,status-gap|pair|expectations|見えない庇護関係
world|rank-decides-path|身分が道を決める社会|身分が道を決める|234|||western,modern|status-gap||expectations|出自による選択肢の差
twist|unexpected-benefactor|恩人は望んだ相手ではない|意外な恩人|234|asymmetric-info||western,modern|mystery||expectations|期待した相手と実際が異なる
role|suddenly-sponsored|突然援助を受けた若者|援助を受けた若者|234|||western,modern|status-gap||expectations|境遇が急に変わる立場
secret|hidden-childhood-debt|幼い頃の恩を隠している|隠した恩|234|||western,modern|mystery||expectations|過去の借りを誰にも言っていない
conflict|separate-good-and-evil|善悪を切り離す願い|善悪の切り離し|345|||western,scifi,research|mystery||jekyll|一面を捨てたい欲求
gimmick|personality-draught|人格を入れ替える薬|人格を変える薬|345||magic|fantasy,scifi|mystery||jekyll|別の面を引き出す手段
twist|respectable-hidden-side|立派な人の裏の顔|立派な人の裏|345|asymmetric-info||western,modern,research|mystery||jekyll|評判と実態の反転
relation|changing-friend|変わっていく友人|変わりゆく友人|345|||western,modern|buddy,mystery|pair|jekyll|様子が変わる旧友
incident|stranger-at-friends-door|友の家に出入りする不審者|出入りする不審者|345|||western,modern|mystery||jekyll|見知らぬ人物が親しい人に近づく
world|town-of-reputation|体面を重んじる街|体面を重んじる街|234|||western,modern|mystery,status-gap||jekyll|評判を守る暮らし
secret|living-two-faces|二つの顔を使い分けている|二つの顔|234|||western,modern,school|mystery||jekyll|表と裏の自分を持つ
`);

export const SE_BASIC=PARSED.basic;
export const SE_CHARACTERS=PARSED.characters;
// 素材ID（人物欄は protagonist-/counterpart- を付けたもの）から、出典を引く。見つからなければ null。
export function standardEbooksSourceOf(id){
 const base=String(id).replace(/^(protagonist|counterpart)-/,''),hit=PARSED.sourceById[base];
 return hit?{...SE_SOURCES[hit.work],sourceType:'standard-ebooks-public-domain',sourceNote:hit.sourceNote}:null;
}
