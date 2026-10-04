// 第5回：各行の舞台・背景・テーマを明示。抽選倍率や保存形式は変更しない。
const KEYS=['world','genre','relation','incident','conflict','gimmick','twist'];
const split=value=>value?value.split(','):[];
export function parseStageFill(primaryStage,batch,lines){
 const result=Object.fromEntries(KEYS.map(key=>[key,[]]));
 const ids=new Set();
 for(const [index,raw] of lines.split('\n').entries()){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const cells=line.split('|').map(value=>value.trim());
  if(cells.length!==11)throw new Error(`stage-fill ${primaryStage}/${batch} line ${index+1}: expected 11 columns, got ${cells.length}`);
  const [key,slug,text,titleWord,tones,topics,context,stage,themes,links,shape]=cells;
  if(!KEYS.includes(key)||!slug||!text||!titleWord||!/^[1-5]+$/.test(tones))throw new Error(`Invalid stage-fill row: ${line}`);
  if(key==='relation'?!['pair','group'].includes(shape):shape!=='')throw new Error(`Invalid relation shape: ${line}`);
  const id=`sf-${primaryStage}-${key}-${slug}`;if(ids.has(id))throw new Error(`Duplicate ID: ${id}`);ids.add(id);
  result[key].push({id,text,titleWord,tones:[...tones].map(Number),topicTags:split(topics),plotLinks:split(links),contextTags:split(context),requiresContext:key==='world'?[]:split(context),stageTags:split(stage),themeTags:split(themes),source:'generated',origin:'stage-fill',primaryStage,stageFillBatch:batch,...(key==='relation'?{relationShape:shape}:{})});
 }
 return result;
}

const A_school=parseStageFill('school','A',`
world|club-lend|部室の使用日を、部活どうしが月ごとの話し合いで貸し借りする学校|貸し借りの部室|123|negotiation,resource-fairness||modern,school|daily-work,limited-cooperation||
world|night-class|昼に通えなかった生徒が夕方から集まる、定時制の校舎|夕方の校舎|1234|identity-role||modern,school|daily-work||
world|dorm-kitchen|留学生と地元の生徒が、寮の台所を当番で共用する高校|共用の台所|123|shared-home,mutual-aid||modern,school|found-family,daily-work||
world|school-merge|二つの学校が統合され、校歌と制服をどちらに合わせるか決める移行期の校舎|統合の一年|1234|negotiation,identity-role||modern,school|daily-work,limited-cooperation||
world|class-archive|卒業生の文集と行事の記録が、整理されないまま資料室に積まれた学校|資料室の文集|234|record-conflict,memory||modern,school|archive-mystery,mystery||
world|library-evening|放課後に先生も生徒も同じ机で宿題を広げる、図書室のある小さな学校|放課後の図書室|1|mutual-aid||modern,school|found-family,daily-work||
world|island-last|生徒が数人になり、卒業式の翌日に廃校が決まった離島の学校|最後の卒業式|345|return-home,memory||modern,school|reunion,archive-mystery||
world|score-rewrite|進学実績のための成績改ざんが判明し、卒業生の推薦枠が回復されないと決まった学校|失われた推薦枠|345|record-conflict,asymmetric-info||modern,school|archive-mystery,mystery||
world|shelter-school|災害で元の校舎を失い、避難所の仮設教室で最後の学年を送り出す学校|最後の仮設教室|345|mutual-aid,resource-fairness||modern,school|rescue,buddy||
genre|festival|行事の準備を通じて人間関係が動く、文化祭・体育祭もの|行事の準備|123|negotiation||school|daily-work||
genre|club|少人数の部が居場所を守ろうとする部活もの|部活の居場所|1234|mutual-aid||school|buddy,daily-work||
genre|path|進路を選ぶ時期の迷いと周囲の期待を描く進路もの|選ぶ進路|1234|identity-role||school|daily-work||
genre|campus-mystery|校内の小さな食い違いから始まる学園ミステリー|校内の食い違い|234|record-conflict||school|archive-mystery,mystery||
relation|club-handover|引退を控えた部長と、次の部長を決めきれない後輩|引き継ぎの部長|1234|identity-role,loyalty||school|buddy,daily-work||pair
relation|former-teacher|赴任したばかりの教師と、前任者を慕って距離を置く生徒たち|前任者の教室|123|identity-role||school|status-gap,daily-work||group
relation|rival-reps|同じ学級委員に立候補して負けた二人|立候補の二人|1234|negotiation||school|rivalry,buddy||pair
relation|transfer-guide|転入生と、案内役を頼まれた生徒|校内の案内役|123|mutual-aid||school|buddy,daily-work||pair
relation|night-day|定時制の生徒と、昼の授業の記録を預かる教師|昼と夜の連絡帳|123|record-conflict||school|archive-mystery,mystery||pair
relation|remedial|同じ補習に呼ばれ、互いの得意科目を教え合う数人|補習の仲間|123|mutual-aid||school|buddy,daily-work||group
incident|missing-ledger|文化祭の会計帳簿が一冊だけ見つからない|消えた帳簿|234|record-conflict||school|archive-mystery,mystery||
incident|club-merge|部員不足で、二つの部に統合の提案が出る|部の統合|123|negotiation||school|limited-cooperation||
incident|answer-sheet|前日の小テストの答案が、別の組に回っていたと分かる|回った答案|234|asymmetric-info||school|archive-mystery,mystery||
incident|trip-change|修学旅行の前日に、行き先が変更になる|行き先変更|123|negotiation||school|limited-cooperation||
incident|returned-key|放送室の鍵が、持ち主の分からないまま返ってくる|戻った鍵|123|asymmetric-info||school|archive-mystery,mystery||
conflict|trust-successor|後輩に任せたいが、任せたら自分の居場所がなくなる気がする|任せる怖さ|1234|identity-role,loyalty||school|buddy|sch-handover|
conflict|expected-path|親の望む進学先と、自分が学びたい分野が一致しない|望まれる進路|1234|identity-role||school|daily-work|sch-path|
conflict|silent-friend|友人の失敗を黙っていたいが、黙れば別の生徒が責められる|黙る代償|234|loyalty||school|buddy||
conflict|correct-record|記録を訂正したいが、訂正すれば世話になった先生の立場が危うくなる|訂正の代償|234|record-conflict,loyalty||school|archive-mystery,mystery|sch-record|
conflict|keep-club|部を続けたいが、人数を揃えるには活動の方針を変えるしかない|部の存続|123|negotiation||school|daily-work,limited-cooperation|sch-merge|
conflict|few-decide|文化祭の出店配置を全員で決めたいが、組ごとに返答が揃わず委員だけで仮決定するしかない|出店配置の仮決定|1234|resource-fairness||school|limited-cooperation|sch-fair|
conflict|archive-secret|廃校の前に記録を残したいが、残せば卒業生が隠したかった事情も明らかになる|残す記録の重み|34|record-conflict,memory||school|reunion,archive-mystery|sch-archive|
twist|record-form|この学校の訂正手続きは、指導者と記録担当の責任を分けて検討するものだった|責任を分ける訂正|234|record-conflict||school|archive-mystery,mystery|sch-record|
twist|blank-page|引き継ぎ書には次の部長が任せたい役を記す欄があり、前の部長も支える担当として活動に残れる|前部長の新しい担当|1234|identity-role||school|buddy|sch-handover|
twist|split-days|統合案は廃部ではなく、二つの部が活動日を分け合う提案だった|活動日の分け合い|123|negotiation||school|daily-work,limited-cooperation|sch-merge|
twist|tuition-talk|親が反対していたのは進路ではなく、学費の見通しをまだ話せていないことだった|話せていない学費|1234|identity-role,asymmetric-info||school|daily-work|sch-path|
twist|deadline-gap|決められなかったのは意見の違いではなく、締切が組ごとに別の日で伝わっていたからだった|別々の締切|1234|resource-fairness,asymmetric-info||school|limited-cooperation|sch-fair|
twist|alumni-wish|隠したかった事情は、卒業生自身が公開を望んでいた記録だった|公開を望む記録|34|memory,record-conflict||school|reunion,archive-mystery|sch-archive|
gimmick|thanks-broadcast|校内放送の最後に、その日の「ありがとう」を一件だけ読み上げる決まり|ありがとう放送|123|mutual-aid||school|found-family,daily-work||
gimmick|loan-slip|貸出票の裏に、借りた人の短い感想が積み重なる図書室の本|貸出票の感想|1234|memory||school|reunion,archive-mystery||
gimmick|blackboard-left|部室の黒板に、前の代の「やり残し」を書き残す欄|やり残しの黒板|123|memory,identity-role||school|daily-work,limited-cooperation||
gimmick|read-mark|既読の印が先生側にだけ見える連絡アプリ|先生側の既読|234|asymmetric-info||modern,school|archive-mystery,mystery||
gimmick|sealed-capsule|卒業まで開けないと決められた、学年全員分のタイムカプセル|開けない箱|234|memory,return-home||school|reunion,archive-mystery||
`);

const A_underworld=parseStageFill('underworld','A',`
world|neutral-diner|抗争の合間だけ、どの組も手を出さない定食屋が中立地帯になる街|中立の定食屋|234|negotiation,shop||modern,underworld|limited-cooperation,daily-work||
world|exit-aid|足を洗いたい構成員の再就職を、互助会が世話する港町|足を洗う互助会|123|escape,mutual-aid||modern,underworld|rescue,daily-work||
world|price-tag-info|情報屋が値段だけを貼り出し、買い手の名は伏せる路地|値札のある情報|234|asymmetric-info,shop||modern,underworld|mystery,archive-mystery||
world|new-boss|組の代替わりで、先代の結んだ約束が一斉に見直される街|代替わりの街|34|loyalty,contract||modern,underworld|master-servant,status-gap||
world|refusing-craftsman|客の事情を聞き、断る条件を決めている職人が集まる地下街|断る職人|234|craft,identity-role||modern,underworld|practical-skill,daily-work||
world|night-warehouse|三つの組が当番制で見回る、物資の倉庫街|当番の倉庫街|1234|resource-fairness,negotiation||modern,underworld|limited-cooperation,daily-work||
world|ledger-town|帳簿を預かる会計士が、組よりも強い立場になる金貸しの街|帳簿の街|34|record-conflict,contract||modern,underworld|mystery,archive-mystery||
world|shop-guard|商店街の用心棒が、店主たちの相談役も兼ねている下町|用心棒の相談所|123|mutual-aid,shop||modern,underworld|rescue,daily-work||
genre|exit-story|組織の内側から出口を探す脱出譚|出口の物語|34|escape||underworld|rescue||
genre|info-crime|情報の売買と駆け引きを描くクライムサスペンス|駆け引きの値段|234|asymmetric-info||underworld|mystery,archive-mystery||
genre|downtown-human|裏社会と隣り合う下町の人情もの|下町の人情|123|mutual-aid||underworld|rescue,daily-work||
relation|old-guard-heir|先代に仕えた古参と、方針を変えたい若い跡取り|古参と跡取り|234|loyalty,identity-role||underworld|master-servant,status-gap||pair
relation|deposit-client|情報屋と、買った情報を使わずに預けに来る客|預ける客|234|asymmetric-info||underworld|mystery,archive-mystery||pair
relation|exit-owner|足を洗った元構成員と、雇った店の店主|元構成員と店主|123|escape,mutual-aid||underworld|rescue,daily-work||pair
relation|handover-couriers|対立する組の連絡役で、毎週同じ店で受け渡しをする二人|受け渡しの二人|234|negotiation||underworld|limited-cooperation,daily-work||pair
relation|ledger-keeper|帳簿を預かる会計士と、帳簿を見たがらない組長|帳簿の番人|34|record-conflict||underworld|mystery,archive-mystery||pair
relation|other-families|同じ街で育ち、別々の組に入った幼なじみ|別の組の幼なじみ|234|loyalty,return-home||underworld|reunion,rivalry||pair
incident|ledger-copy|組の取り分を記した帳簿の写しが、依頼人の知らない人物に届く|届いた写し|34|record-conflict||underworld|mystery,archive-mystery||
incident|extra-seat|休戦の話し合いの席に、呼ばれていない人物が座っている|増えた席|234|asymmetric-info,negotiation||underworld|limited-cooperation,daily-work||
incident|hide-night|抗争の最中、巻き込まれた一般人を店が一晩匿う|匿う夜|234|mutual-aid||underworld|rescue||
incident|blank-order|先代の名で出された最後の指示書が、日付だけ空欄で見つかる|日付のない指示書|34|record-conflict,loyalty||underworld|mystery,archive-mystery||
incident|last-favor|足を洗うはずの日に、最後の頼み事が舞い込む|最後の頼み|234|escape||underworld|rescue||
conflict|leave-share|組を抜けたいが、抜けると残る仲間の取り分が減る|抜ける代償|34|escape,loyalty||underworld|rescue|ug-exit|
conflict|two-promises|約束は守りたいが、守ると先代の遺した別の約束を破ることになる|二つの約束|34|loyalty,contract||underworld|status-gap,limited-cooperation|ug-promise|
conflict|unsellable|情報を売りたくないが、売らなければ店が立ち行かない|売れない情報|234|asymmetric-info,resource-fairness||underworld|mystery,status-gap|ug-info|
conflict|benefactor|恩人を守りたいが、守れば相手の組の面子を潰す|恩人の面子|34|loyalty,negotiation||underworld|limited-cooperation,daily-work|ug-face|
conflict|visitor|平穏に暮らしたいが、過去を知る客が毎週店に来る|過去を知る客|234|escape,identity-role||underworld|rescue,daily-work|ug-past|
conflict|obey|組の決定には従いたいが、従えば無関係の人が巻き込まれる|従う責任|34|loyalty||underworld|master-servant,status-gap|ug-obey|
twist|private-fund|抜ける者の取り分は、組ではなく先代が個人で積み立てていた|先代の積立|34|escape,contract||underworld|rescue|ug-exit|
twist|one-pact|二つの約束は、同じ日に同じ相手と結ばれた一つの取り決めだった|一つの取り決め|34|contract,record-conflict||underworld|status-gap,limited-cooperation|ug-promise|
twist|buy-to-hide|買い手は使うためではなく、公開させないために情報を買っていた|隠すための購入|234|asymmetric-info||underworld|mystery,status-gap|ug-info|
twist|rival-waiting|相手の組も、恩人を守る側に回れる機会を待っていた|待っていた相手|234|negotiation,loyalty||underworld|limited-cooperation,daily-work|ug-face|
twist|repay-debt|客は脅しに来たのではなく、過去の借りを返す方法を探していた|返したい借り|234|identity-role,mutual-aid||underworld|rescue,daily-work|ug-past|
twist|named-owner|決定書の宛名は、実行役ではなく責任を取る側の名で書かれていた|責任者の宛名|34|record-conflict,loyalty||underworld|mystery,archive-mystery|ug-obey|
gimmick|deadline-sign|値段の代わりに「預かり期限」だけを掲げる情報屋の看板|預かり期限の看板|234|asymmetric-info||underworld|mystery,archive-mystery||
gimmick|same-hand|組どうしの貸し借りを、同じ筆跡の帳面に交互に書き込む習慣|同じ筆跡の帳面|234|record-conflict,contract||underworld|limited-cooperation,daily-work||
gimmick|two-keys|休戦の合図として、卓に同じ向きで置かれる二本の鍵|二本の鍵|34|negotiation||underworld|limited-cooperation,daily-work||
gimmick|no-names|食堂の壁に貼られた「ここでは名乗らない」の札|名乗らない札|123|mutual-aid||underworld|rescue,daily-work||
gimmick|tenth-repair|店の売上の一割を、地域の修繕に回す取り決め|一割の修繕費|1234|mutual-aid,resource-fairness||underworld|rescue,daily-work||
`);

const A_western=parseStageFill('western','A',`
world|seating-court|夜会の座席表ひとつで外交が動く、小さな公国の宮廷|座席表の宮廷|1234|court,negotiation|royal|western|status-gap,limited-cooperation||
world|signal-port|灯台の信号と伝書鳩で港の通信を管理するギルドの港町|信号の港|1234|craft,shop||western|practical-skill,daily-work||
world|abbey-valley|修道院が薬草園と写本室を運営する谷の領地|修道院の谷|123|craft,faith||western|practical-skill,daily-work||
genre|etiquette|宮廷の礼儀作法の乱れから事件を解く礼法ミステリー|礼法の謎|234|court,record-conflict|royal|western|archive-mystery,mystery||
genre|estate|傾いた領地を立て直す領主もの|領地再建|123|resource-fairness||western|daily-work,limited-cooperation||
genre|treaty-match|婚約の裏で交わされる条約を描く政略もの|政略の婚約|234|court,contract||western|status-gap,limited-cooperation||
relation|heir-steward|領地を継いだ若い当主と、先代に仕えた執事|当主と執事|1234|loyalty,identity-role||western|master-servant,status-gap||pair
relation|envoy-interpreter|異国から来た使節と、通訳を任された書記官|使節と通訳|1234|negotiation,asymmetric-info||western|status-gap,limited-cooperation||pair
relation|scribe-client|修道院の写字生と、写本を依頼した商人|写字生と依頼人|123|craft,shop||western|practical-skill,daily-work||pair
relation|customs-merchant|港町の税関吏と、税の抜け道を知る商人|税関吏と商人|234|asymmetric-info,contract||western|status-gap,limited-cooperation||pair
incident|seat-rewrite|夜会の席次が、当日の朝に書き換えられている|書き換えの席次|234|record-conflict,court||western|archive-mystery,mystery||
incident|seal-mismatch|公爵家から届いた招待状の宛名と封蝋の家名が合わない|合わない封蝋|234|record-conflict||western|archive-mystery,mystery||
incident|storm-inn|嵐で港が閉まり、荷を待つ商人たちが宿場に足止めされる|足止めの宿場|123|resource-fairness||western|daily-work,limited-cooperation||
incident|moved-stone|領地の古い境界石が、一夜で動いている|動いた境界石|234|record-conflict||western|archive-mystery,mystery||
conflict|house-people|家名を守りたいが、守るには領民への約束を後回しにするしかない|家名と領民|234|loyalty||western|master-servant,status-gap|wst-house|
conflict|secret-terms|条約を結びたいが、使節に出された条件を誰にも話せない|話せない条件|234|asymmetric-info,negotiation||western|status-gap,limited-cooperation|wst-terms|
conflict|rival-benefactor|恩を返したいが、返す相手は自分の家と対立する側にいる|対立する恩人|234|loyalty||western|rivalry,buddy|wst-debt|
conflict|forced-debt|婚約を断りたいが、断れば家が負う借財を返せなくなる|断れない借財|234|contract,resource-fairness||western|status-gap,limited-cooperation|wst-loan|
conflict|unwritable|真実を記録したいが、正式な記録に残せば証言した者が罰される|残せない証言|34|record-conflict||western|archive-mystery,rescue|wst-testimony|
twist|oath-clause|領民への約束は、家名の一部として最初の誓約書に書かれていた|誓約書の一行|234|loyalty,record-conflict||western|master-servant,status-gap|wst-house|
twist|same-paper|相手国の条件は、双方の使節が同時に受け取っていた同じ文書だった|同じ文書|234|asymmetric-info||western|status-gap,limited-cooperation|wst-terms|
twist|peace-agent|恩人は敵の側ではなく、争いを終わらせる側の代理人として動いていた|終わらせる代理人|234|loyalty,negotiation||western|rivalry,buddy|wst-debt|
twist|waiver|借財の証文は、婚約の成立ではなく解消を条件に免除されていた|解消の免除|234|contract||western|status-gap,limited-cooperation|wst-loan|
twist|old-statute|証言を罰する条文は、記録係の写しに載っていない旧版だった|旧版の条文|34|record-conflict||western|archive-mystery,mystery|wst-testimony|
twist|rename-process|招待状の家名の食い違いは、家が養子を迎えて改名する手続きの途中だった|改名の途中|234|record-conflict,identity-role||western|archive-mystery,mystery||
twist|flood-neighbor|境界石を動かしたのは、洪水で崩れた道を直した隣人だった|道を直した隣人|123|mutual-aid||western|daily-work,limited-cooperation||
gimmick|topic-cards|座席表の裏に、席ごとの「話してはいけない話題」を記した小札|話題の小札|234|court,asymmetric-info||western|status-gap,limited-cooperation||
gimmick|gold-seal|封蝋に混ぜる金粉の量で、差出人の格を示す書簡|金粉の封蝋|1234|court,record-conflict||western|archive-mystery,mystery||
gimmick|two-bells|領地の鐘が、収穫の日と葬儀の日で別の鳴らし方をされる決まり|二種類の鐘|1234|faith,shared-home||western|daily-work,limited-cooperation||
gimmick|candle-audience|蝋燭の長さで面会時間を決める執務室の習慣|蝋燭の面会|123|negotiation||western|status-gap,limited-cooperation||
gimmick|tally-tag|三つの港でだけ通じる割り符を荷札に押す取り決め|割り符の荷札|234|shop,contract||western|practical-skill,daily-work||
gimmick|margin-notes|写本の余白に、書き手だけが読める略号で残す覚え書き|余白の略号|234|craft,memory||western|practical-skill,daily-work||
gimmick|fan-reply|扇の向きで返事を伝える宮廷の作法|扇の返事|123|court|royal|western|status-gap,limited-cooperation||
`);

const A_research=parseStageFill('research','A',`
world|long-table|昼休みに研究者と事務員が同じ長机で弁当を広げる、小さな市立研究所|長机の研究所|123|mutual-aid||research,modern|daily-work,buddy||
world|failure-gallery|うまくいかなかった実験だけを展示する公開ラボ|失敗の展示室|123|record-conflict,craft||research,modern|practical-skill,daily-work||
world|night-observatory|観測の合間に、夜勤者が近所の子どもへ星の見方を教える山の観測所|夜勤の観測所|123|mutual-aid,craft||research,modern|daily-work,buddy||
world|greenhouse-key|温室の管理者と研究員が鍵を共有し、互いの作業日を調整する研究棟|温室の共有鍵|123|shared-home,negotiation||research,modern|daily-work,buddy||
genre|failure-lab|実験の失敗から始まる研究室もの|失敗の研究室|1234|craft||research|practical-skill,daily-work||
genre|verify|論文と実験記録の食い違いを調べる検証ミステリー|検証の記録|234|record-conflict||research|archive-mystery,mystery||
genre|funding|研究費と成果のあいだで揺れる研究者もの|研究費の天秤|234|resource-fairness||research|limited-cooperation,daily-work||
relation|procedure-master|研究室の主任と、主任の古い手順を引き継ぐ新人技師|手順の師弟|1234|craft,identity-role||research|practical-skill,daily-work||pair
relation|two-replicators|同じ実験を別々の場所で再現した二人の研究者|再現した二人|234|record-conflict||research|archive-mystery,mystery||pair
relation|data-admin|共同研究のデータの共有範囲を決めたい事務担当と研究者|共有の担当者|123|negotiation,asymmetric-info||research|daily-work,buddy||pair
conflict|credit-split|成果を発表したいが、共同研究者の貢献の扱いが決まっていない|貢献の扱い|234|negotiation,identity-role||research|daily-work,buddy|rs-credit|
twist|usage-log|貢献の記録は、実験ノートの共有ではなく装置の使用ログに残っていた|使用ログの貢献|234|record-conflict,craft||research|practical-skill,archive-mystery|rs-credit|
conflict|report-failure|再現できなかった結果を報告したいが、報告すれば最初に信じてくれた人の信用に傷がつく|報告の代償|234|record-conflict,loyalty||research|archive-mystery,mystery|rs-replicate|
twist|calibration|再現できなかった理由は、装置の校正日が一日ずれていただけだった|一日ずれた校正|234|record-conflict,craft||research|practical-skill,archive-mystery|rs-replicate|
`);

export const STAGE_FILL_A=Object.fromEntries(KEYS.map(key=>[key,[...A_school[key],...A_underworld[key],...A_western[key],...A_research[key]]]));


const B_school=parseStageFill('school','B',`
world|student-services|売店・菜園・放送を生徒が運営し、卒業学年が後継班への権限移譲を終えてから旅立つ学校|旅立つ運営班|1234|identity-role,craft||school|daily-work,practical-skill||
genre|student-charter|校則を誰が改められるか、生徒会と教員が手続きから話し合う学校自治劇|自治の手続き|1234|negotiation,identity-role||school|limited-cooperation,daily-work||
genre|last-restart|卒業間近の生徒たちが、途中でやめた共同制作を一週間だけ再開する再出発の物語|卒業前の再開|1234|memory,mutual-aid||school|buddy,reunion||
`);

const B_underworld=parseStageFill('underworld','B',`
genre|ceasefire-mediators|休戦の仲介を担う者たちが、組ごとに異なる合意の意味をすり合わせる調停劇|休戦の仲介|234|negotiation,contract||underworld|limited-cooperation,status-gap||
genre|past-settlement|昔の仕事で残した損失を引き受けながら、新しい生業の信用を築く精算と再出発の物語|精算からの生業|234|identity-role,contract||underworld|daily-work,rescue||
`);

const B_research=parseStageFill('research','B',`
genre|team-succession|実験を止めずに担当を交代する研究チームの、技術と仕事の継承劇|止めない継承|1234|craft,identity-role||research|daily-work,practical-skill||
genre|joint-observation|研究員・整備員・地域の観測者が、別々の持ち場から一つの現象を追う共同観測の群像劇|持ち場の観測|1234|mutual-aid,craft||research|buddy,practical-skill||
genre|assets-before-close|閉鎖までに標本と装置の受け入れ先を決め、長期研究を次の施設へつなぐ引き継ぎ劇|研究の受け入れ先|234|resource-fairness,return-home||research|limited-cooperation,daily-work||
`);

const B_modern=parseStageFill('modern','B',`
genre|local-revival|空き店舗を使う人と住み続ける人が、違う生活時間から町の再生を考える群像劇|町の生活時間|1234|shared-home,negotiation||modern|daily-work,found-family||
genre|work-life-choice|勤務時間と家族の暮らしを見直し、働き方の条件を自分たちで選び直す仕事の物語|暮らしの働き方|1234|identity-role,negotiation||modern|daily-work,limited-cooperation||
relation|shop-designer|再開発前の図面を預かる店主と、帰郷して設計を担当する人|帰郷の設計担当|1234|return-home,record-conflict||modern|reunion,daily-work||pair
relation|review-correction|店の誤った口コミを訂正したい依頼人と、投稿名を明かしたくない書き手|口コミの訂正相手|234|asymmetric-info,identity-role||modern|mystery,limited-cooperation||pair
relation|parcel-counter|地域の配達員と、仕事帰りの住民を待つ共同受取所の管理人|夕方の受取所|1234|shop,mutual-aid||modern|buddy,daily-work||pair
incident|shop-renewal|商店街の共同倉庫の契約が今月で切れ、更新案に維持費の分担が追加される|倉庫の更新案|1234|contract,resource-fairness||modern|limited-cooperation,daily-work||
incident|unlisted-address|災害後に設けた仮設住宅の一棟だけ、配達先の登録が抜けていると分かる|抜けた配達先|234|record-conflict,mutual-aid||modern|rescue,practical-skill||
incident|facility-transfer|閉鎖した集会所の引き継ぎ箱から、備品とは別名義の使用約束が見つかる|備品とは別の約束|1234|contract,memory||modern|archive-mystery,daily-work||
incident|news-correction|町の店を閉店と伝えた記事に訂正が出るが、転載先には古い見出しが残る|残った見出し|234|record-conflict,asymmetric-info||modern|archive-mystery,mystery||
incident|minutes-gap|住民会で決めた空き地の用途について、議事録と参加者のメモが食い違う|空き地の議事録|1234|negotiation,record-conflict||modern|limited-cooperation,mystery||
conflict|volunteer-hours|地域活動を引き受けたいが、配達の仕事を減らすと自分の生活費が足りない|活動と生活費|1234|mutual-aid,resource-fairness||modern|daily-work,buddy|md-alias-hours|
conflict|anonymous-account|誤った口コミを訂正したいが、名乗ることで職場に投稿を知られるのは避けたい|訂正と匿名|234|identity-role,record-conflict||modern|archive-mystery,limited-cooperation|md-correction-cost|
conflict|promise-keeper|引き継ぎの約束を記録どおり守りたいが、利用者は今の暮らしに合わせた変更を望む|記録と利用者|1234|contract,negotiation||modern|daily-work,limited-cooperation|md-promise-object|
conflict|warehouse-fee|共同倉庫を残したいが、更新契約の最低利用年数では近く閉店する店にも数年分の費用を約束させてしまう|倉庫の最低利用年数|1234|resource-fairness,contract||modern|limited-cooperation,daily-work|md-renewal-window|
conflict|family-access|家族の移住の経緯を知りたいが、家族が公開したくない手紙まで読むべきか迷う|家族の閲覧範囲|234|memory,relationship-choice||modern|reunion,archive-mystery||
conflict|address-proof|仮設住宅へ荷物を届けたいが、管理側は存在が確認できない住所への配達を認めない|住所を示す証拠|234|record-conflict,identity-role||modern|rescue,practical-skill|md-address-boundary|
gimmick|revision-board|訂正前の文と訂正理由を並べ、転載した人が差し替え済みの印を付けられる地域の掲示板|差し替えの印|1234|record-conflict,asymmetric-info||modern|archive-mystery,practical-skill||
gimmick|shared-pickup-book|受取所に届いた荷物と引き取れる時間だけを記し、事情を書かせない共同台帳|時間だけの台帳|1234|mutual-aid,shop||modern|daily-work,buddy||
gimmick|contract-calendar|共同施設の契約を終える日と、次の利用条件を提案できる期間を別々に示す町の暦|契約の二つの期限|1234|contract,negotiation||modern|limited-cooperation,daily-work||
twist|address-boundary|登録が抜けた棟は二つの自治体の境にあり、双方が相手の登録を待っていたため、共同の確認担当が必要になる|境の確認担当|234|record-conflict,negotiation||modern|practical-skill,rescue|md-address-boundary|
twist|alias-shifts|別々の活動名で頼まれた手伝いは同じ配達員に集中していた。名前をまとめると、住民たちは当番を分担し直せる|重なった活動名|1234|identity-role,resource-fairness||modern|buddy,daily-work|md-alias-hours|
twist|termination-window|倉庫の契約終了日は退去の締切ではなく、店ごとの利用枠を白紙に戻して再交渉できる日になる|白紙に戻る利用枠|1234|contract,negotiation||modern|limited-cooperation,daily-work|md-renewal-window|
twist|promise-users|引き継いだ約束が守る対象は集会所の備品ではなく、そこで集まる人の利用時間だと分かり、別の会場を探す道が開く|守るのは集まる時間|1234|contract,shared-home||modern|daily-work,found-family|md-promise-object|
twist|correction-aftercare|口コミの訂正で店の疑いは晴れるが、取り消された予約は戻らない。投稿者は名を伏せたまま補償の交渉を始める|訂正の後に残る損失|234|record-conflict,resource-fairness||modern|limited-cooperation,archive-mystery|md-correction-cost|
`);

const B_scifi=parseStageFill('scifi','B',`
genre|port-shifts|宇宙港の交代勤務と船の入港時刻がずれる中、働く人々が食事と住まいを融通する生活劇|入港と交代勤務|1234|shop,mutual-aid||scifi|daily-work,found-family||
genre|copy-authorship|別々に暮らし始めた人格複製が、同じ名義の作品の利用権を分け直す権利交渉の物語|複製の作品権|234|memory,contract|memory-tech|scifi|status-gap,limited-cooperation||
genre|fleet-return|長旅を終えた船団と残った住民が、ずれた暦と生活の変化を持ち寄る帰還の群像劇|帰還の二つの暦|1234|return-home,shared-home||scifi|journey,reunion||
genre|system-appeals|宇宙港の設備割当てについて、決定から修正までの責任を人々が追う異議申立て劇|割当ての修正責任|1234|resource-fairness,negotiation||scifi|limited-cooperation,practical-skill||
relation|ai-parcel-signature|廃棄予定の郵便仕分けAIと、受取人の不在が続く荷物の到着証明を求める配達員|最後の到着証明|234|record-conflict,contract|artificial-intelligence|scifi|archive-mystery,daily-work|sf-postage-liability|pair
relation|copies-royalties|別々の航路で新作を書いた人格複製たちと、旧名義の印税を一括管理する契約担当|航路別の印税|234|memory,contract|memory-tech|scifi|limited-cooperation,status-gap|sf-copy-allocation|group
relation|prediction-editor|避難後の観測で学習内容を更新する災害予測AIと、避難の記録を訂正する係員|避難後の学習|234|record-conflict,resource-fairness|artificial-intelligence|scifi|practical-skill,archive-mystery|sf-intervention-learning|pair
relation|port-arrivals|宇宙港の居住区画を割り当てる係員と、抽選締切の後に帰港した住民たち|締切後の帰港者|1234|return-home,resource-fairness||scifi|daily-work,limited-cooperation|sf-return-allocation|group
conflict|postal-liability|郵便AIを存続させたいが、管理を引き継ぐ条件に過去の未配達便の賠償まで含まれている|未配達便の引受け|234|contract,resource-fairness|artificial-intelligence|scifi|limited-cooperation,archive-mystery|sf-postage-liability|
conflict|copy-pooling|複製たちの新作の収入を分けたいが、一人は船団へ寄付し、別の一人は家族へ送る約束を選んでいる|別々の送金先|234|memory,contract|memory-tech|scifi|limited-cooperation,status-gap|sf-copy-allocation|
conflict|prediction-feedback|避難に役立った予測を改良したいが、災害が起きなかった結果だけを教えると、次の避難勧告が弱まってしまう|避難で変わる学習|234|record-conflict,resource-fairness|artificial-intelligence|scifi|practical-skill,archive-mystery|sf-intervention-learning|
conflict|late-residents|帰港した住民へ居住枠を渡したいが、割当て済みの人もその枠を前提に仕事と生活を決めている|帰港者の居住枠|1234|return-home,resource-fairness||scifi|limited-cooperation,daily-work|sf-return-allocation|
twist|postal-stop-clock|未配達扱いの期間には港の通信停止日まで含まれている。停止期間を切り分ければ、引継ぎ側だけに賠償を負わせる契約を見直せる|停止期間の切り分け|234|record-conflict,contract|artificial-intelligence|scifi|archive-mystery,limited-cooperation|sf-postage-liability|
twist|copy-signature|旧作の収入は同じ名義でも、新作の送金先は複製ごとの署名で変更できる。合意すべき対象が全財産から旧作だけへ狭まる|分けられる署名|234|memory,contract|memory-tech|scifi|limited-cooperation,status-gap|sf-copy-allocation|
twist|intervention-label|避難で防いだ被害を「予測外れ」から分ける欄が加わり、AIの評価は的中率から防げた損失の検討へ変わる|防げた損失の欄|234|record-conflict,resource-fairness|artificial-intelligence|scifi|practical-skill,archive-mystery|sf-intervention-learning|
twist|residence-rotation|帰港者に住居を用意するには、抽選のやり直しより先に、出航して無人になる区画の交代利用を合意する必要がある|出航後の空室|1234|return-home,negotiation||scifi|limited-cooperation,daily-work|sf-return-allocation|
`);

const B_wafu=parseStageFill('wafu','B',`
genre|post-town-work|宿場の泊まり客と働く人の都合を、帳場・馬屋・炊事場から描く仕事の群像劇|宿場の持ち場|1234|shop,craft||wafu|daily-work,practical-skill||
genre|festival-preparation|祭りの表に出ない準備と片付けを担う町の人々が、役目の分担を決め直す物語|祭りの裏方|1234|mutual-aid,negotiation||wafu|buddy,daily-work||
genre|performance-inheritance|演目を受け継ぐ人と初めて見る人のあいだで、伝える技を探す芸能継承劇|演目を伝える技|1234|craft,memory||wafu|practical-skill,reunion||
genre|town-promise|用水路と共同の道具を巡る古い約束を、今の暮らしから問い直す町の物語|暮らしと古い約束|1234|contract,shared-home||wafu|limited-cooperation,daily-work||
conflict|festival-office|祭りの役目を継ぎたいが、毎年同じ時期に戻る約束では遠方の仕事を続けられない|役目と遠方の仕事|1234|identity-role,return-home||wafu|reunion,limited-cooperation|wf-office-rotation|
conflict|performance-audience|受け継いだ演目を守りたいが、昔の言葉をそのまま語ると初めての観客には筋が伝わらない|演目と初めての観客|1234|craft,memory||wafu|practical-skill,daily-work|wf-double-performance|
twist|office-calendar|祭りの役目は一人の年番ではなく、季節ごとの作業を引き受ける約束へ分けられる。帰郷する時期を選ぶ余地が生まれる|季節で分ける役目|1234|negotiation,return-home||wafu|limited-cooperation,reunion|wf-office-rotation|
twist|double-performance|古い台本には短い前口上も残っている。演目を削らず、観客へ入口を渡す役を後継者が担える|台本の前口上|1234|craft,memory||wafu|practical-skill,buddy|wf-double-performance|
`);

const B_isekai=parseStageFill('isekai','B',`
relation|craft-materials|前世の製法を覚えている転生者と、土地の材料では同じ手順が使えないと知る職人|土地の材料と製法|1234|craft,asymmetric-info||isekai|practical-skill,buddy||pair
relation|immigrant-uses|同じ前世の知識を持ち、一人は販売品に、もう一人は共同の修理場に使いたい移住者同士|知識の二つの用途|1234|craft,resource-fairness||isekai|rivalry,limited-cooperation||pair
relation|return-departure|元の世界へ戻る準備を進める転生者と、この土地に残って共同工房を続ける同行者|帰還と工房の同行者|1234|return-home,relationship-choice||isekai|journey,buddy||pair
relation|knowledge-verifier|前世の暦を伝える転生者と、季節のずれを村の観測帳で確かめる記録係|前世の暦の照合|1234|record-conflict,craft||isekai|archive-mystery,practical-skill||pair
twist|departure-work|帰還者が残すはずだった工房の手順書は、すでに同行者が現地の材料で書き直している。教え残しを心配していた帰還者が、今度は見送られる準備を進める側になる|見送られる準備|1234|return-home,craft||isekai|buddy,practical-skill||
`);

export const STAGE_FILL_B=Object.fromEntries(KEYS.map(key=>[key,[...B_school[key],...B_underworld[key],...B_research[key],...B_modern[key],...B_scifi[key],...B_wafu[key],...B_isekai[key]]]));
export const STAGE_FILL_BASIC=Object.fromEntries(KEYS.map(key=>[key,[...STAGE_FILL_A[key],...STAGE_FILL_B[key]]]));
