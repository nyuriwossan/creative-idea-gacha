// 第7弾：師弟・エルフ等の種族・複数婚・異能・部活と放課後の素材（118件）。
// 11列：key|slug|本文|タイトル短語|トーン|topics|context|stage|追加テーマ|plotLink|shape
// context は世界観では「その世界が持つ背景」（contextTags）、他の項目では「必要な背景」（requiresContext）。
// 舞台・背景・テーマの空欄を許す専用パーサー。抽選の係数は持たない。既存素材は変えず、配列の後ろに足す。
const KEYS=['world','genre','relation','incident','conflict','gimmick','twist'];
const split=value=>value?value.split(','):[];

// 新しい背景条件。context.js の CONTEXTS に足す（登録しないと、必要な背景を持つ素材が抽選に出ない）。
export const WORLD_EXPAND_CONTEXTS=[['elf','エルフ'],['fairy','妖精'],['dwarf','ドワーフ'],['merfolk','人魚・水の民'],['vampire','吸血鬼'],['plural-marriage','複数婚（一夫多妻・一妻多夫・多重婚）が制度の社会'],['ability','生まれつきの特別な力（異能）']];

export function parseWorldExpand(text){
 const rows=text.split('\n').map(r=>r.trim()).filter(r=>r&&!r.startsWith('#')).map(line=>{
  const cells=line.split('|').map(c=>c.trim());
  if(cells.length!==11)throw Error('Expected 11 columns: '+line);
  const [key,slug,body,titleWord,tones,topics,context,stage,themes,links,shape]=cells;
  if(![...KEYS,'role'].includes(key)||(key==='relation'?!['pair','group'].includes(shape):shape!==''))throw Error('Invalid world-expand field/shape: '+line);
  if(!slug||!body||!titleWord||!/^[1-5]+$/.test(tones)||new Set(tones).size!==tones.length)throw Error('Invalid world-expand row: '+line);
  return {key,id:`we-${key}-${slug}`,text:body,titleWord,tones:[...tones].map(Number),source:'generated',origin:'world-expand',topicTags:split(topics),contextTags:split(context),requiresContext:key==='world'?[]:split(context),stageTags:split(stage),themeTags:split(themes),plotLinks:split(links),...(key==='relation'?{relationShape:shape}:{})};
 });
 if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate world-expand ID');
 const pick=key=>rows.filter(r=>r.key===key).map(({key,...row})=>row);
 return {basic:Object.fromEntries(KEYS.map(key=>[key,pick(key)])),role:pick('role')};
}

const PARSED=parseWorldExpand(`
# ---- 世界観：エルフ・妖精・ドワーフ・人魚・吸血鬼 ----
world|elf-long-life|長命のエルフと短命の人間が、記憶の長さの違いを前提に暮らす森の国|長命と短命|1234|memory,interspecies|elf|fantasy|beastfolk,reunion||
world|elf-forest-permit|エルフが森を管理し、人間が期限つきの入林許可で恵みを分け合う世界|入林の許可|1234|resource-fairness,interspecies|elf|fantasy|beastfolk,daily-work||
world|elf-season-market|エルフの里と人間の町が、季節ごとの市で品物と知識を交換する世界|季節の市|123|shop,interspecies|elf|fantasy|beastfolk,cozy-fantasy||
world|fairy-small-promise|妖精が小さな約束を数えながら、人間の暮らしに混ざっている村|数えられる約束|123|contract,interspecies|fairy|fantasy|beastfolk,cozy-fantasy||
world|fairy-whim-rules|妖精の気まぐれな決まりが、町の祭りの日取りまで左右する世界|気まぐれな決まり|1234|negotiation,interspecies|fairy|fantasy|beastfolk,daily-work||
world|fairy-border-shift|妖精の国と人間の町の境が、季節ごとに少しずつ動く世界|動く境|1234|return-home,interspecies|fairy|fantasy|beastfolk,journey||
world|dwarf-guild-road|ドワーフの鍛冶組合が、橋と街道の規格を決めている山あいの国|規格を決める組合|123|craft,negotiation|dwarf|fantasy|beastfolk,daily-work||
world|dwarf-underground|地下の都に暮らすドワーフと、地上の人間が荷を交換する世界|地下と地上|1234|shop,interspecies|dwarf|fantasy|beastfolk,journey||
world|merfolk-tide-day|人魚と人間が、潮の満ち引きに合わせて取引の日を決める港町|潮の取引日|123|shop,interspecies|merfolk|fantasy|beastfolk,cozy-fantasy||
world|merfolk-sea-road|水の民が海の道を管理し、船は通行の約束を更新しながら使う世界|更新する海の道|1234|contract,interspecies|merfolk|fantasy|beastfolk,journey||
world|vampire-night-city|吸血鬼が夜の街の治安と登録を担い、昼の街と協定を結んでいる都市|夜の街の協定|234|negotiation,interspecies|vampire|fantasy,modern|beastfolk,mystery||
world|vampire-blood-contract|血の提供が、本人の同意と契約を条件に制度として認められた社会|血の契約制度|234|contract,interspecies|vampire|fantasy,modern|beastfolk,romance||
world|vampire-family-archive|長く生きる吸血鬼が、人間の家族の記録を代々預かる館のある町|預かる家の記録|1234|memory,interspecies|vampire|fantasy|beastfolk,archive-mystery||
# ---- 世界観：複数婚の社会 ----
world|poly-wives-order|一夫多妻が当たり前で、妻たちの役割と序列が家の運営を決める国|家の序列|1234|identity-role,shared-home|plural-marriage|fantasy|status-gap,romance||
world|poly-husbands-village|一妻多夫が認められ、夫たちが家業を分担して暮らす山あいの村|夫たちの分担|123|shared-home,mutual-aid|plural-marriage|fantasy|daily-work,found-family||
world|poly-notify-family|多重婚が当たり前で、誰とどう家族になるかを届け出て決める社会|届け出る家族|1234|contract,relationship-choice|plural-marriage|fantasy,modern|romance,daily-work||
world|poly-merchant-union|複数の妻と夫が婚姻契約を結び、家と家をつなぐ商家の連合|婚姻でつながる商家|1234|contract,negotiation|plural-marriage|fantasy|romance,status-gap||
world|poly-harem-court|多くの妃が暮らし、それぞれの出身が政治の均衡を支える後宮のある宮廷|後宮の均衡|234|identity-role,negotiation|plural-marriage,royal|fantasy,wafu|status-gap,desert-court||
world|poly-yearly-review|配偶者の人数に上限がなく、家族の形を毎年見直す慣習のある共同体|毎年の見直し|123|relationship-choice,shared-home|plural-marriage|fantasy,modern|found-family,daily-work||
# ---- 世界観：異能のある社会 ----
world|ability-registry|生まれつき特別な力を持つ人が一定数おり、届け出と訓練の仕組みがある社会|力の届け出|1234|identity-role,negotiation|ability|fantasy,modern|mystery,daily-work||
world|ability-districts|能力の種類によって、職業や居住区が分けられている都市|力で分かれる街|234|identity-role,resource-fairness|ability|fantasy,modern|status-gap,mystery||
world|ability-school|力には代価があるとされ、使い方を学ぶ学校がどの町にもある世界|力の学び舎|1234|identity-role,craft|ability|fantasy,modern,school|daily-work,buddy||
world|ability-mutual|力を持つ人と持たない人が、互いの役割を認め合って暮らす国|認め合う役割|123|identity-role,mutual-aid|ability|fantasy,modern|found-family,daily-work||
# ---- 立場・役割（師弟）：protagonist.role と counterpart.role の両方に同じ行を追加 ----
role|swordsman-disciple|剣士の弟子|剣の弟子|1234|identity-role||fantasy,wafu,western|buddy||
role|swordsman-master|弟子を取った剣士の師匠|剣の師匠|1234|identity-role||fantasy,wafu,western|buddy||
role|mage-disciple|魔法使いの弟子|魔法の弟子|1234|identity-role|magic|fantasy|buddy,cozy-fantasy||
role|mage-master|弟子に魔法を教える魔法使い|魔法の師匠|1234|identity-role|magic|fantasy|buddy||
role|hunter-disciple|狩人の弟子|狩りの弟子|1234|identity-role||fantasy,wafu|journey,buddy||
role|hunter-master|山を知り尽くした狩人の師匠|山の師匠|1234|identity-role||fantasy,wafu|journey||
role|herbalist-disciple|薬師の弟子|薬師の弟子|1234|identity-role,craft||fantasy,wafu,western|daily-work||
role|herbalist-master|弟子を迎えた薬師|薬師の師匠|1234|identity-role,craft||fantasy,wafu,western|daily-work||
role|smith-disciple|鍛冶屋の弟子|鍛冶の弟子|1234|craft||fantasy,western,wafu|daily-work||
role|smith-master|跡継ぎを探す鍛冶屋|鍛冶の師匠|1234|craft||fantasy,western,wafu|daily-work||
role|shrine-disciple|巫女の弟子|巫女の弟子|123|identity-role||wafu,fantasy|myth||
role|shrine-master|務めを教える年長の巫女|巫女の師|123|identity-role||wafu,fantasy|myth||
role|knight-squire|騎士の従者になった見習い|騎士見習い|1234|identity-role,loyalty||western,fantasy|master-servant||
role|knight-master|従者を育てる騎士|騎士の師範|1234|identity-role,loyalty||western,fantasy|master-servant||
role|artist-disciple|師の画風を学ぶ絵師の弟子|絵師の弟子|1234|craft,identity-role||wafu,fantasy|daily-work||
role|alchemist-disciple|錬金術師の弟子|錬金の弟子|1234|craft|magic|fantasy,western|mystery,daily-work||
role|lone-master|弟子を取らないと決めていた師匠|弟子を取らない師|1234|identity-role|||buddy||
role|older-disciple|師匠より年上の弟子|年上の弟子|1234|identity-role|||buddy||
# ---- 関係性：師弟 ----
relation|sword-break-form|剣の師匠と、型を破りたい弟子|型を破る|1234|identity-role,loyalty||fantasy,wafu,western|buddy||pair
relation|mage-no-magic|魔法使いの師匠と、魔法を使わないと決めた弟子|使わない魔法|1234|identity-role|magic|fantasy|buddy||pair
relation|hunter-cannot|狩人の師匠と、狩れなくなった弟子|狩れない弟子|234|identity-role||fantasy,wafu|journey||pair
relation|herbalist-doubt|薬師の師匠と、師匠の薬を疑い始めた弟子|薬を疑う|234|asymmetric-info,identity-role||fantasy,wafu,western|mystery||pair
relation|shrine-duty-doubt|巫女の師と、務めを継ぐか迷う弟子|継ぐ迷い|123|identity-role||wafu,fantasy|myth||pair
relation|knight-lord-doubt|騎士の師範と、主君に疑問を持ち始めた従者|主君への疑問|234|loyalty,identity-role||western,fantasy|master-servant||pair
relation|beyond-master|師匠を超えてしまった弟子と、教えることがなくなった師匠|超えた弟子|1234|identity-role|||buddy||pair
relation|brother-disciples|同じ師匠のもとで学んだ兄弟弟子と姉弟子|兄弟弟子|1234|identity-role,loyalty|||buddy,rivalry||pair
relation|expelled-disciple|破門された元弟子と、その師匠|破門のあと|234|loyalty,identity-role|||reunion||pair
relation|lost-masters|師匠を亡くした弟子と、弟子を亡くした別の師匠|二つの喪失|34|memory,loyalty|||reunion||pair
relation|many-disciples|一人の師匠のもとに集まった、年も志も違う数人の弟子たち|師匠と弟子たち|123|identity-role,mutual-aid|||found-family||group
relation|three-generations|かつての弟子が迎えた最初の弟子と、その師匠の師匠|三代の師弟|1234|identity-role,memory|||buddy||pair
relation|lone-master-pushy|弟子を取らないと決めていた師匠と、押しかけてきた弟子|押しかけ弟子|123|identity-role|||buddy||pair
relation|older-disciple-pair|年上の弟子と、年下の師匠|年の逆転|123|identity-role|||buddy||pair
# ---- ギミック：異能 ----
gimmick|memory-take|触れた相手の記憶を一つだけ奪えるが、奪った記憶は自分のものになる力|奪う記憶|234|memory|ability|fantasy,modern|mystery||
gimmick|lie-sense|嘘を聞くと必ず分かるが、本当のことは分からない力|嘘だけ分かる力|1234|asymmetric-info|ability|fantasy,modern|mystery||
gimmick|heart-once|同じ相手には一度だけ、本心を聞き出せる力|一度きりの本心|234|asymmetric-info,relationship-choice|ability|fantasy,modern|romance||
gimmick|future-silent|未来が一瞬だけ見えるが、見た内容は誰にも話せない力|話せない未来|234|asymmetric-info|ability|fantasy,modern|mystery||
gimmick|take-wound|人の怪我を引き受けて、自分の身体に移せる力|引き受ける傷|1234|mutual-aid|ability|fantasy,modern|rescue||
gimmick|read-owner|触れた物の持ち主の記憶を読み取れる力|物の記憶|1234|memory|ability|fantasy,modern|mystery||
gimmick|see-feeling|相手の感情が色で見える力|感情の色|1234|asymmetric-info|ability|fantasy,modern|daily-work||
gimmick|erase-self|会った人の記憶から、自分の存在を消せる力|消える存在|234|memory,identity-role|ability|fantasy,modern|mystery||
gimmick|stop-time|数秒だけ時間を止められるが、止めている間は自分も動けない力|止まる数秒|1234|resource-fairness|ability|fantasy,modern|rescue||
gimmick|borrow-power|他人の力を一日だけ借りられるが、借りた相手に借りが残る力|借りる力|1234|mutual-aid,contract|ability|fantasy,modern|buddy||
gimmick|lose-memory-use|使うたびに、自分の記憶が一つ失われる力|失う記憶|234|memory,resource-fairness|ability|fantasy,modern|mystery||
gimmick|powers-cancel|力を持つ人どうしが触れ合うと、互いの力が弱まる性質|打ち消す力|1234|relationship-choice|ability|fantasy,modern|romance||
gimmick|seal-consent|力を封じる印は、本人が同意したときにしか施せない決まり|同意の封印|234|contract,identity-role|ability|fantasy,modern|status-gap||
gimmick|cost-shown|力を使うと、代価が数字として本人にだけ見える仕組み|見える代価|1234|resource-fairness|ability|fantasy,modern|mystery||
# ---- 種族・異能の世界で使う素材（各世界の背景を要求する）----
relation|elf-human-friend|長命のエルフと、年を重ねていく人間の友|長命の友|1234|memory,interspecies|elf|fantasy|beastfolk,reunion||pair
incident|elf-old-letter|エルフの里から、人間宛ての古い手紙が今になって届く|古い手紙|1234|memory,interspecies|elf|fantasy|beastfolk,reunion||
conflict|elf-see-off|長く生きる側として、短命の友を見送る準備をしたいが、友は今を楽しみたい|見送る準備|234|memory,relationship-choice|elf|fantasy|beastfolk,reunion||
twist|elf-time-sense|長命のエルフの「少し待って」は、人間にとっての数年だった|少しの数年|1234|memory,interspecies|elf|fantasy|beastfolk||
relation|fairy-child|妖精と小さな約束を交わした子と、その約束を数えている妖精|数える約束|123|contract,interspecies|fairy|fantasy|beastfolk,cozy-fantasy||pair
incident|fairy-deadline|妖精との約束の期日が、一日だけ早まっていた|早まった期日|123|contract,interspecies|fairy|fantasy|beastfolk||
conflict|fairy-keep-word|約束を守りたいが、妖精にとっての約束は人間の想像より細かい|細かい約束|1234|contract,interspecies|fairy|fantasy|beastfolk||
twist|fairy-count-gift|妖精が数えていたのは貸しではなく、贈り合った回数だった|数えた回数|123|mutual-aid,interspecies|fairy|fantasy|beastfolk||
relation|vampire-donor|契約を結んだ吸血鬼と、血の提供者|血の契約|234|contract,interspecies|vampire|fantasy,modern|beastfolk,romance||pair
incident|vampire-no-appear|契約の更新日に、吸血鬼が約束の場所へ現れない|来ない契約相手|234|contract,interspecies|vampire|fantasy,modern|beastfolk,mystery||
conflict|vampire-consent|契約を続けたいが、毎回の同意を本当に自分の意思と言い切れない|同意の重さ|234|contract,relationship-choice|vampire|fantasy,modern|beastfolk,romance||
twist|vampire-records|長命の吸血鬼が預かっていたのは、人間たちの秘密ではなく生きた証だった|預かった生きた証|1234|memory,interspecies|vampire|fantasy|beastfolk||
relation|dwarf-bridge|地下から橋を架けるドワーフの親方と、地上の測量士|橋の二人|123|craft,interspecies|dwarf|fantasy|beastfolk,daily-work||pair
conflict|dwarf-standard|規格を守りたいが、規格が地上の人間の暮らしに合わなくなっている|合わない規格|1234|craft,negotiation|dwarf|fantasy|beastfolk||
relation|merfolk-trader|潮の日だけ取引に来る人魚と、港の商人|潮の日の取引|123|shop,interspecies|merfolk|fantasy|beastfolk,cozy-fantasy||pair
incident|merfolk-low-tide|取引の日の潮が、いつもより早く引いていく|早く引く潮|1234|shop,interspecies|merfolk|fantasy|beastfolk||
relation|poly-first-second|先に迎えられた妻と、後から迎えられた妻|先と後の妻|1234|identity-role,shared-home|plural-marriage|fantasy|status-gap,romance||pair
relation|poly-husband-heir|家業を継ぐ役を任された夫と、ほかの夫たち|継ぐ夫と夫たち|123|identity-role,shared-home|plural-marriage|fantasy|daily-work||group
relation|poly-own-time|自分だけの時間を求める配偶者と、家全体をまとめようとする配偶者|自分の時間|1234|identity-role,relationship-choice|plural-marriage|fantasy|romance||pair
relation|poly-newcomer-family|新しく迎えられる人と、迎える側の家族たち|迎える家族|1234|identity-role,shared-home|plural-marriage|fantasy|found-family,romance||group
conflict|poly-choose-self|家のために迎える相手を、自分の気持ちで選びたい|迎える相手|1234|relationship-choice,identity-role|plural-marriage|fantasy|romance,status-gap||
conflict|poly-order-value|序列を守りたいが、序列が人の価値のように扱われてしまう|序列と価値|234|identity-role,resource-fairness|plural-marriage|fantasy|status-gap||
conflict|poly-equal-heart|全員を平等に大切にしたいが、時間にも心にも限りがある|限りある時間|1234|resource-fairness,relationship-choice|plural-marriage|fantasy|romance||
twist|poly-order-work|序列は愛情の順ではなく、仕事の分担の順だった|分担の順|1234|identity-role|plural-marriage|fantasy|status-gap||
relation|ability-registrar|力を届け出る人と、届け出を受け付ける役人|力の届け出|123|identity-role,negotiation|ability|fantasy,modern|daily-work||pair
relation|ability-powerless-parent|力を持つ子と、力を持たない親|力のある子|1234|identity-role|ability|fantasy,modern|found-family||pair
incident|ability-wake|隠していた力が、人前で突然現れてしまう|現れた力|234|identity-role|ability|fantasy,modern|mystery||
conflict|ability-hide|力を隠して普通に暮らしたいが、隠すほど誰かを助けられなくなる|隠す力|234|identity-role,mutual-aid|ability|fantasy,modern|mystery||
# ---- 学園：部活・放課後 ----
world|club-after-block|放課後だけ使える部室棟が、部活ごとの当番で運営されている学校|放課後の部室棟|123|mutual-aid,resource-fairness||modern,school|daily-work,found-family||
world|club-mandatory|部活動への所属が必須で、帰宅部が認められない学校|必須の部活|1234|identity-role,negotiation||modern,school|daily-work||
world|after-school-open|放課後の校舎が地域に開かれ、夕方になると子どもたちも集まる学校|開かれた放課後|123|shared-home,mutual-aid||modern,school|found-family,daily-work||
world|recruit-festival|廃部寸前の部が多く、新入部員の勧誘が学校最大の行事になっている学校|勧誘の季節|123|negotiation,identity-role||modern,school|daily-work,buddy||
relation|club-save-newbie|廃部を防ぎたい部長と、入部を迷う新入生|廃部の前の部長|1234|identity-role,negotiation||school|daily-work||pair
relation|club-rivals|同じ部で競い合う二人の部員|部内の好敵手|1234|identity-role,loyalty||school|rivalry||pair
relation|club-retire|引退を迎える三年生と、部を継ぐ二年生|引退と継承|1234|identity-role,loyalty||school|buddy||pair
relation|homework-pair|放課後の教室で、毎日一緒に宿題をしている二人|放課後の二人|123|mutual-aid||school|buddy||pair
relation|double-club|二つの部を行き来する生徒と、その両方の部長|兼部の生徒|1234|loyalty,identity-role||school|buddy||group
relation|advisor-silent|顧問を頼れない部員たちと、顧問になったばかりの教師|頼れない顧問|123|identity-role||school|buddy||group
incident|club-key-short|部室の鍵が、一つ足りなくなる|足りない鍵|123|asymmetric-info||school|daily-work||
incident|stays-after|放課後の校舎に、いつもはいないはずの生徒が残っている|残る生徒|1234|asymmetric-info||school|mystery||
incident|club-notice|廃部の通知が、部員に直接届かず掲示だけで知らされる|掲示だけの通知|234|negotiation,asymmetric-info||school|daily-work||
incident|day-before-match|大会の前日に、部員が一人来なくなる|来ない部員|1234|loyalty||school|buddy||
conflict|club-take-room|部を守りたいが、守るために別の部の居場所を奪うことになる|奪う部室|1234|resource-fairness,negotiation||school|daily-work||
conflict|all-play|全員で出場したいが、実力の差を認めたくない|全員で出る|1234|resource-fairness,identity-role||school|buddy||
conflict|stay-late|放課後も部活を続けたいが、家の事情で早く帰らなければならない|早く帰る事情|1234|identity-role,mutual-aid||school|daily-work||
twist|club-advisor-move|廃部の理由は人数ではなく、顧問の異動だった|廃部の本当の理由|1234|asymmetric-info||school|mystery||
twist|absent-preparing|来なくなった部員は、別の場所で部を支える準備をしていた|来ない理由|1234|loyalty,mutual-aid||school|buddy||
gimmick|club-blackboard|部室の黒板に、部員が毎日一言ずつ書き継ぐ決まり|黒板の一言|123|memory,mutual-aid||modern,school|daily-work,found-family||
gimmick|after-bell-talk|放課後のチャイムのあいだだけ、先輩と後輩の立場を外して話す決まり|立場を外す時間|123|identity-role||modern,school|daily-work,buddy||
`);
export const WORLD_EXPAND_BASIC=PARSED.basic;
// 立場・役割は主人公と相手役の両方に入る（extra-data.js が人物ごとにIDの前に protagonist- / counterpart- を付ける）。
export const WORLD_EXPAND_CHARACTERS={role:PARSED.role};
