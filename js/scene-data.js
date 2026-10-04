// 各行は共有する場面構造・本文・短語・題材・トーン。台詞や担当を確定しない。
const rows=(key,source)=>source.trim().split('\n').map(line=>{const [slug,text,titleWord,topic,tones]=line.split('|');return {id:`entry-${key}-${slug}`,text,titleWord,topicTags:topic.split(','),plotLinks:[`entry-${slug}`],tones:[...tones].map(Number),stageTags:[],themeTags:['buddy','daily-work'],contextTags:[],requiresContext:[],source:'generated',origin:'entry-round4'};});
export const SCENE_DATA={
 'scene.goal':rows('goal',`
two-records|閉館までに二つの記録が食い違う箇所を一つ見つける|記録の照合|memory|1234
shared-meal|互いに食べられる材料だけで今夜の食事を用意する|今夜の食卓|shared-home|123
temporary-sign|案内係が戻るまで、初めて来た人にも通じる仮の道しるべを作る|仮の道標|shop|1234
repair-test|持ち主が迎えに来る前に修理品を一度だけ安全に試す|試運転|shop|1234
last-seat|出発する便の最後の席を誰に渡すか、一行で決める|最後の席|caravan|234
borrowed-room|借りた部屋を返す前に、持ち主不明の荷物を仕分ける|部屋を返す|shared-home|1234
honest-receipt|不足した品物について、受取人と送り主の両方が読める受領書を作る|正直な受領書|contract|234
unfinished-task|退職する人と残る人で、未完了の仕事を一つだけ引き継ぐ|一件の引継ぎ|shop|234
small-witness|騒ぎを広げず、目撃者が安心して話せる場所を用意する|証言の席|memory|234
return-key|約束の時刻までに、借りた鍵を使わずに持ち主へ返す|使わない鍵|contract|1234
quiet-route|眠っている人を起こさずに、必要な荷物を別室へ運ぶ|静かな運搬|shared-home|123
shared-budget|残った予算で誰の道具を先に直すか決める|修理の順番|shop|234
leave-message|離れる相手へ、返事を強制しない伝言を残す|返事を待たない|relationship-choice|234
lost-label|名前の落ちた箱の中身を開けず、届け先を確かめる|開けない荷物|memory|1234
last-proof|破棄される前に、一人の存在を示す証拠を写し取る|最後の写し|memory|345
safe-withdrawal|追跡されている仲間が自分で選べる退路を一つ確保する|選べる退路|escape|345
`),
 'scene.opening':rows('opening',`
two-records|同じ机に置いた二冊の帳簿で、同じ品の到着日だけが違っている|二冊の机|memory|1234
shared-meal|調理台へ持ち寄った材料を並べたところで、使える鍋が一つしかないと分かる|一つの鍋|shared-home|123
temporary-sign|入口の看板が外れ、道を尋ねる最初の客が近づいてくる|看板のない朝|shop|1234
repair-test|直した道具の前で、片方は説明書を、もう片方は交換前の部品を持っている|試す直前|shop|1234
last-seat|乗り場の係が一行へ残り一席を告げ、出発の合図を待っている|乗り場の一席|caravan|234
borrowed-room|部屋の明け渡しに立ち会う人々が、押入れの奥に知らない包みを見つける|明け渡しの日|shared-home|1234
honest-receipt|受領の印を押す直前に、箱の数と届け状の数が合わないと分かる|押印の直前|contract|234
unfinished-task|最後の勤務を終える人が、名前のない依頼書を机に残している|無記名の仕事|shop|234
small-witness|証言を頼みに来た相手が、扉を開けたまま話したいと申し出る|開けた扉|memory|234
return-key|借りた鍵を返しに来たところ、返却先の窓口が予定より早く閉まっている|閉じた窓口|contract|1234
quiet-route|休憩室の前で荷車がきしみ始め、奥では誰かがようやく眠ったところだった|きしむ荷車|shared-home|123
shared-budget|修理の見積もりを持ち寄ると、合計が残金を少しだけ超えている|少し足りない|shop|234
leave-message|出発直前の相手に届ける便箋があり、書き出しだけが空いている|空いた書き出し|relationship-choice|234
lost-label|配送台に名前のない箱と、文字がにじんだ送り状が残っている|にじんだ宛名|memory|1234
last-proof|廃棄担当が保管庫の封を切ろうとする瞬間、消された人の筆跡を見つける|封を切る前|memory|345
safe-withdrawal|別々の道を歩いてきた協力者が合流し、片方の道に追手がいると分かる|合流点|escape|345
`),
 'scene.problem':rows('problem',`
two-records|どちらの記録にも訂正印があり、訂正した順序だけが分からない|訂正の順序|memory|1234
shared-meal|同じ材料を別の呼び名で覚えていて、使い方の相談がかみ合わない|材料の呼び名|shared-home|123
temporary-sign|道を知る人は目印を建物で説明するが、訪問者はその名前を知らない|目印の翻訳|shop|1234
repair-test|作動はするが、小さな異音を許してよいか判断が分かれる|残った異音|shop|234
last-seat|急ぐ理由をまだ話せない人がおり、理由だけで席を配れない|話せない事情|caravan|234
borrowed-room|荷物の持ち主を確かめるには、誰かが避けてきた相手へ連絡する必要がある|一通の連絡|shared-home|234
honest-receipt|正しい不足数を書くと、運んだ人だけが責任を問われる形式になっている|書式の偏り|contract|234
unfinished-task|引継ぎの相手は手順を知っているが、途中で止める判断基準を知らない|止める基準|shop|234
small-witness|話を聞く側の肩書きを知って、目撃者が言いかけたことを飲み込む|肩書きの壁|memory|234
return-key|鍵の受領を証明できる人がおらず、返したことが伝わらないかもしれない|返却の証明|contract|1234
quiet-route|静かな道は遠回りになり、運ぶ物の受取時刻に間に合わない|静けさと時間|shared-home|1234
shared-budget|安い修理を選ぶと、一人だけ使い慣れた持ち方を変える必要がある|持ち方の変更|shop|234
leave-message|励ましたい言葉が、戻る義務を負わせる言葉にも読める|励ましの重さ|relationship-choice|234
lost-label|宛名の似た二人が同じ宿に泊まり、どちらも箱を待っている|似た宛名|memory|1234
last-proof|証拠の一部を残すには、協力者が保管規則を破った記録も残る|証明の代償|memory|345
safe-withdrawal|安全な道を知らせると、隠れて暮らす人々の場所も相手に伝わる|退路の秘密|escape|345
`),
 'scene.question':rows('question',`
two-records|この一件以外にも、同じ訂正の癖が残る記録はあるだろうか|訂正の癖|memory|1234
shared-meal|次に同じ食卓へ招きたい人はいるだろうか|次の食卓|shared-home|123
temporary-sign|この町で、ほかにも初めて来た人だけが困る場所はあるだろうか|初めての町|shop|1234
repair-test|古い部品を残しておくことには、持ち主だけが知る意味があるだろうか|残す部品|shop|1234
last-seat|残った人々は、次の便までどんな時間を一緒に過ごせるだろうか|次の便まで|caravan|1234
borrowed-room|この部屋を出たあとも、続けたい習慣は何だろうか|持ち出す習慣|shared-home|1234
honest-receipt|受領書の形式を変えたいと思う人は、ほかにもいるだろうか|書式の先|contract|234
unfinished-task|教わらなかった判断を、次に誰と考えたいだろうか|次の相談相手|shop|1234
small-witness|話してもらうために、自分たちも伝えるべきことがあるだろうか|聞く側の告白|memory|234
return-key|預けた人は、この鍵で何を守っていたのだろうか|鍵の役目|contract|1234
quiet-route|静かに休める時間を、誰にまだ渡せていないだろうか|休息の順番|shared-home|1234
shared-budget|次の修理代を集めるなら、どんな負担の分け方を選ぶだろうか|次の修理代|shop|234
leave-message|返事が来なくても、この出会いから残したいものは何だろうか|返事のない余韻|relationship-choice|234
lost-label|宛名を書かなかった人は、誰に見つけてほしかったのだろうか|書かなかった名|memory|1234
last-proof|残した証拠を公開するかどうか、誰の意思を確かめるべきだろうか|公開の決断|memory|345
safe-withdrawal|逃げ切ったあと、協力関係を続けるかは誰がどう選べるだろうか|逃げた先の自由|escape|345
`)
};

// 場面構造IDごとの明示的なテーマ対応。本文の単語では分類しない。
const themesByStructure={
 'two-records':['archive-mystery','practical-skill'], 'shared-meal':['practical-skill','care-gothic'], 'temporary-sign':['practical-skill'], 'repair-test':['practical-skill'],
 'last-seat':['limited-cooperation','journey'], 'borrowed-room':['limited-cooperation','care-gothic'], 'honest-receipt':['archive-mystery','limited-cooperation'], 'unfinished-task':['practical-skill','limited-cooperation'],
 'small-witness':['archive-mystery'], 'return-key':['limited-cooperation'], 'quiet-route':['care-gothic'], 'shared-budget':['practical-skill','limited-cooperation'],
 'leave-message':['limited-cooperation'], 'lost-label':['archive-mystery'], 'last-proof':['archive-mystery'], 'safe-withdrawal':['limited-cooperation']
};
for(const row of Object.values(SCENE_DATA).flat())row.themeTags=[...new Set([...row.themeTags,...themesByStructure[row.plotLinks[0].slice(6)]])];
