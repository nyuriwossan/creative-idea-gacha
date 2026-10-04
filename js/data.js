import {ROUND4_BASIC} from './round4-data.js';
import { BASE_DATA, BASELINE_COUNTS } from './base-data.js';
import { PACKS,supplementDefinition } from './context.js';
import { THEME_PACK_DATA } from './theme-pack-data.js';
import {supplementStory} from './story-metadata.js';
import {STORY_BASIC} from './story-data.js';
export { BASELINE_COUNTS };
export const BASIC = [ ['world','世界観'], ['genre','ジャンル'], ['relation','関係性'], ['incident','中心事件'], ['conflict','葛藤'], ['gimmick','ギミック'], ['twist','ひねり'] ];
export const STAGES = [['all','すべて'],['modern','現代'],['western','西洋風'],['wafu','和風'],['fantasy','ファンタジー'],['isekai','異世界転生'],['scifi','SF'],['research','研究施設'],['underworld','裏社会'],['school','学園']];
export const TONES = ['ほのぼの','ほんのり不穏','シリアス','ダーク','破滅寄り'];
export const PURPOSES = ['一言ネタ','ショートストーリー向け','漫画1話向け','連載プロット向け','AIキャラプロットの種','世界観メモ','三題噺向け'];
export const THEMES = [['master-servant','主従'],['buddy','バディ・協力'],['reunion','幼なじみ・再会'],['rivalry','敵対・因縁'],['status-gap','契約・身分差'],['found-family','疑似家族'],['romance','恋愛・愛憎'],['myth','人外・神話'],['rescue','逃亡・救済'],['mystery','秘密・謎解き'],['daily-work','日常・仕事'],['journey','旅・冒険'],...PACKS.map(([id,label])=>[id,label])];
// text | titleWord | 舞台ID（空=汎用） | テーマID | 対応トーン | 関係の形
function rows(key, lines) {
  return lines.trim().split('\n').map(line => {
    const [text,titleWord,stage='',theme='',tones='1234',relationShape='pair'] = line.trim().split('|');
    let hash=2166136261; for(const c of text){hash^=c.codePointAt(0);hash=Math.imul(hash,16777619);}
    const item={id:`${key}-new-${(hash>>>0).toString(36)}`,text,titleWord,stageTags:stage?stage.split(','):[],themeTags:theme?theme.split(','):[],tones:[...tones].map(Number),source:'generated',origin:'new'};
    if(key==='relation') item.relationShape=relationShape;
    return item;
  });
}
const ADDITIONS = {
world: rows('world', `
小さな修理店が並ぶ商店街|修理屋通り|modern|daily-work|123
季節の市で賑わう宿場町|宿場の市|wafu|daily-work,journey|123
水路でつながる職人の都|水路の都|western|daily-work|1234
郵便船が巡る群島|郵便船|western,modern|journey|1234
移動図書館が訪れる山村|山の図書館|modern|daily-work,journey|123
精霊が店番をする市場|精霊市場|fantasy|myth,daily-work|123
渡り鳥を追って移住する村|渡り鳥の村|fantasy|journey|123
宇宙港の共同住宅|星港の家|scifi|found-family,daily-work|1234
植物を育てる軌道農園|軌道農園|scifi,research|daily-work|123
ロボットと人が働く配送所|星の配送所|scifi|buddy,daily-work|123
異世界の道具を直す工房|二世界の工房|isekai,fantasy|daily-work|123
旅人を迎える温泉郷|湯けむりの里|wafu,modern|journey,daily-work|123
学生が運営する放送室|放送室|school,modern|buddy,daily-work|123
発明品を自由に試せる公開ラボ|ひらめきの庭|research,scifi|buddy,daily-work|123
妖たちが夜市を開く参道|妖の夜市|wafu,fantasy|myth,daily-work|1234
灯台守の家族が暮らす岬|灯台の岬|western,modern|found-family|1234
消えた航路だけが残る星域|消えた航路|scifi|mystery,journey|2345
条約で魔法を禁じた国境都市|魔法の国境|fantasy,western|status-gap|2345
身元を問わない地下の診療所|地下診療所|underworld,modern|rescue|345
毎年同じ日に地図が変わる島|書き替わる島|fantasy|mystery,journey|2345
`),
genre: rows('genre', `
旅日記|旅日記||journey|123
料理もの|食卓||daily-work|123
職人もの|手仕事||daily-work|1234
日常の小さな謎|小さな謎||daily-work,mystery|123
ドタバタ喜劇|大騒ぎ||buddy,daily-work|12
スポーツもの|挑戦||buddy|123
ロードストーリー|道の途中||journey|1234
共同生活もの|ひとつ屋根||found-family|1234
民話風の物語|語り草|wafu,fantasy|myth|1234
法廷劇|証言|modern,western|mystery|2345
災害からの再建劇|再建||rescue,buddy|234
宇宙探査もの|未知の星|scifi|journey|1234
`),
relation: rows('relation', `
新人と世話好きな先輩|最初の仕事||buddy,daily-work|1234
商店街で助け合う店主たち|商店街の輪|modern|buddy,daily-work|123|group
旅先で合流した同行者たち|道連れ||journey,buddy|1234|group
互いの店を競い合う職人|隣の工房||rivalry,daily-work|1234
同じ夢を追う文通相手|便りの先||buddy,reunion|123
喧嘩のあとに再会した幼なじみ|再会の朝||reunion|1234
引退した師匠と不器用な弟子|師匠の手||buddy,daily-work|1234
共同住宅で暮らす住人たち|ひとつ屋根||found-family,daily-work|1234|group
同じ研究を別の方法で進める同僚|ふたつの仮説|research,scifi|buddy,rivalry|1234
配達員と道案内ロボット|配達の相棒|scifi|buddy,daily-work|123
祭りの準備を任された村人たち|祭りの仲間|wafu,western|buddy,daily-work|123|group
一日だけ入れ替わった店員と客|一日の交換||daily-work|123
人間の郵便係と精霊の受取人|森への便り|fantasy|myth,daily-work|1234
口下手な依頼人と聞き上手な案内人|ふたりの道||buddy,journey|123
肩書きを隠して通う主君と店主|名もない客|western,wafu,fantasy|master-servant,status-gap|1234
互いの弱みを知る交渉相手|交渉の席||rivalry,mystery|2345
かつて別陣営にいた協力者たち|昨日の敵||rivalry,buddy|2345|group
追放された者を匿う船員たち|匿う船||found-family,rescue|2345|group
期限付きの契約を結んだ護衛と依頼人|契約の旅||status-gap,master-servant|1234
違う時代から手紙を交わす友人|時を越す便り|scifi,fantasy|buddy,mystery|1234
`),
incident: rows('incident', `
街の祭りで出店を任される|最初の出店||daily-work,buddy|123
間違って届いた荷物を返しに行く|迷子の荷物||journey,mystery|123
空き店舗を一緒に使うことになる|空き店舗|modern|buddy,daily-work|123
いつもの通学路に小さな店が開く|帰り道の店|school,modern|daily-work|123
大切なレシピの一部が読めなくなる|読めないレシピ||mystery,daily-work|123
旅の途中で予定外の寄り道を頼まれる|寄り道||journey,buddy|123
町の合唱団に助っ人として招かれる|町の歌||buddy,daily-work|123
古い道具の持ち主を探すことになる|道具の持ち主||mystery,daily-work|123
観測装置が珍しい星の便りを拾う|星の便り|scifi,research|mystery,journey|123
小さな精霊が引っ越しを手伝ってほしいと言う|精霊の引越し|fantasy|myth,daily-work|123
宿場の看板を掛け直す仕事を引き受ける|宿場の看板|wafu,western|daily-work|123
初めての共同研究で予想外の発見をする|共同研究|research,scifi|buddy,mystery|123
閉店予定の店に一日だけ客が集まる|最後の営業日|modern|daily-work|1234
祭りの直前に供物が姿を消す|消えた供物|wafu,fantasy|myth,mystery|2345
停戦の使者が身元を偽っていたと分かる|偽りの使者|western,fantasy|rivalry,mystery|2345
隔離区域から救助の信号が届く|救助信号|research,scifi|rescue|2345
海図にない島へ漂着する|海図の外||journey,mystery|2345
組織の帳簿に存在しない取引が見つかる|空白の取引|underworld,modern|mystery|345
故郷へ帰るための唯一の道が閉ざされる|閉ざされた道||journey,rescue|2345
消えたはずの記録が公開される|戻った記録||mystery|2345
`),
conflict: rows('conflict', `
頼りたいのに遠慮してしまう|頼る勇気||buddy|123
相手の夢を応援したいが離れるのは寂しい|送り出す日||buddy,reunion|1234
自分のやり方と仲間のやり方が違う|ふたつのやり方||buddy,daily-work|123
新しい挑戦をしたいが慣れた日常も好きだ|変わる日々||daily-work|123
勝ちたいけれど相手にも楽しんでほしい|勝負の笑顔||rivalry,buddy|123
伝統を残したいが使いやすく変えたい|継ぐかたち||daily-work|1234
一人で完成させたいが助けを借りれば良くなる|共同作業||buddy|123
贈り物を用意したいが好みを聞くと驚かせられない|内緒の贈り物||buddy,romance|12
寄り道したいが仲間を待たせたくない|道草||journey,buddy|123
苦手を隠したいが正直に言えば手伝ってもらえる|苦手の告白||buddy,daily-work|123
褒められるのは嬉しいが期待が少し重い|期待の重さ||daily-work|123
好きな仕事を続けたいが休む時間も必要だ|ひと休み||daily-work|1234
故郷が好きだが知らない場所にも行きたい|ふたつの居場所||journey|1234
相手に譲りたいが自分の希望も伝えたい|小さな希望||buddy,romance|123
昔の約束を大事にしたいが今の気持ちも変わった|約束の今||reunion|1234
みんなの意見を聞きたいが決める時間が足りない|相談の時間||buddy|123
便利な道具を使いたいが手作業の良さも残したい|手仕事の明日||daily-work|123
秘密の善意を続けたいが感謝を直接受け取りたい|名もない親切||daily-work|123
役目を果たしたいが命令の根拠を疑っている|命令の理由||master-servant|2345
真相を伝えたいが相手の安全を守るには黙る必要がある|沈黙の理由||mystery,rescue|2345
帰還を目指すほど新しい居場所を失いそうになる|帰還と居場所|isekai,scifi|journey,found-family|2345
仲間を守るための決定が別の集団を追い詰める|守る範囲||buddy,rescue|345
約束を守れば制度の不正を認めることになる|約束と制度||status-gap,mystery|2345
記録を残したいが名前を出すと誰かを危険にさらす|名を伏せる記録||mystery|2345
失われたものを取り戻せるが他人の記憶を奪うことになる|取り戻す代価|fantasy,scifi|myth,rescue|345
`),
gimmick: rows('gimmick', `
交換日記の余白だけで交わす返事|余白の返事||buddy,reunion|123
持ち主が毎週変わる共用の鍵|巡る鍵||found-family,daily-work|123
香りで道順を教える地図|香りの地図|fantasy|journey,myth|123
一度だけ願いを聞く小さな道具|一度の願い|fantasy|myth|123
昔のレシピに残された家族の書き込み|食卓の記録||found-family,daily-work|123
季節ごとに持ち寄る交換箱|季節の箱||daily-work|123
同じ曲を聞くと点灯する通信機|同じ旋律|scifi|buddy|123
店の看板裏に書かれた伝言|看板の伝言||mystery,daily-work|123
失敗だけを記録する研究ノート|失敗のノート|research|daily-work,buddy|123
声の代わりに色で返事をする精霊|色の返事|fantasy|myth,buddy|123
星空を共有できる遠隔窓|星空の窓|scifi|buddy,reunion|123
寄り道の数だけ増える旅のしおり|旅のしおり||journey|123
誰もが一日だけ店主になれる規則|一日の店主||daily-work,status-gap|123
名前を呼ばれると緩む封印|呼び名の封印|fantasy,wafu|myth|2345
記憶の出所を隠す翻訳装置|記憶の翻訳|scifi,research|mystery|2345
署名した順番で効力が変わる契約|署名の順序||status-gap,mystery|2345
地図から消せる道と消せない足跡|消せない足跡||journey,mystery|2345
夜明けにだけ開く避難経路|夜明けの道||rescue|2345
偽の身分を保証する古い証書|借りた名||status-gap,mystery|2345
所有者の変化を記録する神宝|神宝の記録|wafu,fantasy|myth,mystery|2345
`),
twist: rows('twist', `
なくした贈り物は相手が修理していた|直された贈り物||buddy,romance|123
競争相手も同じ師匠から学んでいた|同じ教え||rivalry,buddy|123
無口な客が町の合唱団の指揮者だった|静かな指揮者||daily-work|123
匿名の親切をしていたのは新人だった|新人の親切||daily-work,buddy|123
間違いだと思った道順が一番景色のよい道だった|遠回りの景色||journey|123
守りたい伝統も昔は新しい挑戦だった|伝統の始まり||daily-work|1234
失敗作の道具に別の便利な使い道があった|失敗の先||daily-work|123
遠くの文通相手が毎日すれ違う隣人だった|隣の便り||reunion,mystery|123
精霊は願いを叶えるより話を聞いてほしかった|聞いてほしい願い|fantasy|myth,buddy|123
厳しいと思っていた規則は初心者を守る工夫だった|規則のやさしさ||daily-work|123
別々の贈り物を用意したつもりが同じ品を選んでいた|重なる贈り物||romance,buddy|123
古い研究メモの疑問が今の発見につながっていた|昔のひらめき|research,scifi|mystery|123
会ったことがない恩人もこちらに救われていた|巡る親切||buddy,reunion|1234
守護者自身が封印の対象だった|守護者の封印|fantasy,wafu|myth,mystery|2345
失踪は仲間を逃がすための計画だった|消えた理由||rescue,mystery|2345
敵の命令書と味方の命令書が同じ筆跡だった|同じ筆跡||rivalry,mystery|345
避難先だと思った場所が監視網の中心だった|避難先の影|scifi,underworld|rescue,mystery|345
契約の期限を決めていたのは依頼人ではなかった|期限の主||status-gap,mystery|2345
帰還路は閉じたのではなく別の時代につながっていた|帰還の時差|scifi,isekai|journey,mystery|2345
消された記録の空白こそが助けを求める合図だった|空白の合図||mystery,rescue|2345
`)
};
const ORIGINAL_TITLE_WORDS={
 '神託が下る':'神託',
 '嘘の方が優しい':'優しい嘘','家のために生きるか、自分の心に従うか':'家と心',
 '正しさと愛情が衝突する':'正しさと愛','守るほど相手を傷つける':'守る痛み',
 '真実を知ると居場所を失う':'真実の居場所','救うには裏切る必要がある':'裏切りの救済',
 '家族を選ぶか、正義を選ぶか':'家族と正義','復讐を果たすほど空っぽになる':'復讐の空白',
 '自由になるには大切な関係を捨てる必要がある':'自由の代価',
 '組織への忠誠と個人の感情がぶつかる':'忠誠と心','愛情が支配に変わりかけている':'愛の境界',
 '過去を暴けば、現在の幸せが壊れる':'過去の扉','助けたい相手が危険な力を持っている':'危うい手',
 '救済の手段そのものが支配でもある':'救済の檻',
 '教師として守るべき線と、人として助けたい気持ちが衝突する':'守る線',
 '守るための研究が、対象を傷つけている':'研究の影',
 '被験者を救いたいが、組織を裏切ることになる':'救う決意',
 '観察対象に情が移ったことで判断が揺らぐ':'観察の距離',
 '研究成果は人類を救うが、個人を犠牲にする':'成果の代価',
 '祓うべき相手に情が移る':'祓いと心','神託が正しいとは限らない':'神託の疑い',
 '血筋が力の源であるほど自由がない':'血筋の鎖','人の理と神の理が食い違う':'ふたつの理',
 '前世の知識で救えるが、世界の流れを壊してしまう':'知識の波紋',
 '破滅を避けるほど、別の誰かが破滅する':'破滅の行方',
 '元の世界に帰りたい気持ちと、今世の絆が衝突する':'帰還と絆',
 '自分だけが物語の結末を知っている':'知る者の孤独',
 '悪役になった理由を知ってしまう':'悪役の理由',
 '今世の家族を愛するほど、前世の家族を裏切る気がする':'ふたつの家族',
 '未来を変えた結果、一番守りたかった相手が敵になる':'未来の敵',
 '守られていた側が、実は守っていた':'守る手',
 '敵だと思っていた相手が唯一の味方だった':'最後の味方',
 '被害者が事件を仕組んでいた':'事件の仕掛け',
 '救済の方法が破滅の原因だった':'救済の裏側',
 '主人公の記憶だけが本物ではない':'借りた記憶',
 '失われた人物は最初から存在していない':'いない人',
 '約束を守ることが裏切りになる':'約束の裏側',
 '犯人を探すほど自分に近づいていく':'追う影',
 '助けたい相手こそが災厄の鍵だった':'災厄の鍵',
 '一番信じていた制度が最初から歪んでいた':'制度の影',
 '最後に選ばれるのは、愛ではなく役目だった':'最後の役目',
 '研究対象だと思っていた相手が、本当の管理者だった':'管理者の正体',
 '消された記録に自分の名前があった':'記録の名前',
 '祓うべき怪異が、都を守っていた存在だった':'都の守り手',
 '神託そのものが偽られていた':'偽りの神託',
 '世界を壊す存在だと思われていた者こそ、世界を支えていた':'世界の支え',
 '前世で救えなかった相手と今世で再会する':'もう一度の再会',
 '破滅フラグを避けた結果、別の破滅ルートに入っていた':'破滅の岐路',
 '断罪イベントの本当の黒幕が別にいる':'断罪の黒幕',
 '帰りたかった元の世界の方が既に失われていた':'失われた帰路'
};
export const DATA = Object.fromEntries(BASIC.map(([key]) => [key, [...BASE_DATA[key].map(item=>({...item,titleWord:ORIGINAL_TITLE_WORDS[item.text]??item.titleWord})), ...ADDITIONS[key]].map(item=>supplementDefinition(item,key)).concat(THEME_PACK_DATA[key]).map(supplementStory).concat(STORY_BASIC[key],ROUND4_BASIC[key])]));
export const ADDITION_COUNTS = Object.fromEntries(BASIC.map(([key])=>[key,ADDITIONS[key].length]));
export { rows };
