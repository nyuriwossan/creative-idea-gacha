// 新規の恋愛関係と仕事の主役・当事者は成人。生徒・患者の年齢を一律に変更しない。
export const MODERN_PRO_THEMES=[['modern-love','現代の恋人・会社もの','暮らしと公私の選択'],['workplace-pro','職業もの','現場の責任・記録・仕事の継承']];
export const PROFESSIONAL_CONTEXTS=[['company','会社組織'],['police','警察・捜査組織'],['medical','医療現場'],['education','学校・教育現場']];
const KEYS=['world','genre','relation','incident','conflict','gimmick','twist'];
const split=value=>value?value.split(','):[];
export function parseModernPro(category,batch,lines){
 if(!['love','office','police','medical','education'].includes(category))throw new Error('Unknown modern-pro category');
 const result=Object.fromEntries(KEYS.map(key=>[key,[]])),ids=new Set();let group;
 for(const [index,raw] of lines.split('\n').entries()){
  const line=raw.trim();if(!line)continue;
  if(line.startsWith('#group ')){group=line.slice(7).trim();if(!MODERN_PRO_THEMES.some(([id])=>id===group)||group!==(category==='love'?'modern-love':'workplace-pro'))throw new Error('Invalid modern-pro group');continue;}
  if(line.startsWith('#'))continue;
  if(!group)throw new Error('modern-pro group must precede data');
  const cells=line.split('|').map(value=>value.trim());if(cells.length!==11)throw new Error(`modern-pro line ${index+1}: expected 11 columns`);
  const [key,slug,text,titleWord,tones,topics,context,stage,themes,links,shape]=cells;
  if(!KEYS.includes(key)||!/^[-a-z0-9]+$/.test(slug)||!text||text.length>500||!titleWord||titleWord.length>30||!/^[1-5]+$/.test(tones)||new Set(tones).size!==tones.length||stage!=='modern')throw new Error(`Invalid modern-pro row: ${line}`);
  if(key==='relation'?!['pair','group'].includes(shape):shape!=='')throw new Error('Invalid modern-pro relation shape');
  const id=`mp-${group}-${key}-${slug}`;if(ids.has(id))throw new Error('Duplicate modern-pro ID');ids.add(id);
  result[key].push({id,text,titleWord,tones:[...tones].map(Number),topicTags:split(topics),plotLinks:split(links),contextTags:split(context),requiresContext:key==='world'?[]:split(context),stageTags:['modern'],themeTags:[...new Set([group,...split(themes)])],source:'generated',origin:'modern-pro',modernProCategory:category,modernProBatch:batch,...(key==='relation'?{relationShape:shape}:{})});
 }return result;
}

const A_love=parseModernPro('love','A',`
#group modern-love
world|open-office|部署の垣根がなく、全員の予定が共有カレンダーで見える会社|共有カレンダーの会社|123|asymmetric-info,shared-home|company|modern|daily-work,romance||
world|merger-office|二つの会社が合併し、旧社員どうしの序列がまだ決まっていない職場|合併後の職場|1234|identity-role,negotiation|company|modern|daily-work||
world|night-shift-office|終電後も灯りの消えない、残業が日常になっている部署|終電後の部署|234|resource-fairness|company|modern|daily-work||
world|rule-office|交際の届出先を人事担当一人に限る独自の規定があり、公開範囲を相談できる架空の会社|届出のある会社|1234|contract,asymmetric-info|company|modern|romance||
world|remote-team|顔を合わせるのが月に一度の出社日だけの、在宅勤務中心のチーム|月一の出社日|123|asymmetric-info|company|modern|daily-work||
world|ex-same-floor|別れた二人が、同じフロアで働き続けなければならない本社ビル|同じフロアの元恋人|234|identity-role,memory|company|modern|romance,reunion||
world|company-town|婚約者の勤める会社の閉鎖が決まり、不正の記録を残すかで最後の雇用整理が揺れる企業城下町|口にしない町|345|record-conflict,loyalty|company|modern|romance,mystery||
world|share-house|交際を周囲に言わないまま、二人で部屋を借りて暮らす都市|二人の同居|123|shared-home,relationship-choice||modern|romance||
world|long-distance|仕事の都合で離れて暮らす恋人が、毎週末だけ同じ駅で会う暮らし|週末の駅|123|return-home,relationship-choice||modern|romance||
world|wedding-month|結婚式の準備をきっかけに、親族や職場に関係が知られていく街|式の準備の街|1234|identity-role,asymmetric-info||modern|romance||
world|apps-city|アプリで知り合った成人の相手が、いつも利用する店の運営にも関わっていると分かる地方都市|アプリで会った人|234|asymmetric-info,shop||modern|romance||
genre|office-love|職場で距離を縮めながら、社内の立場に縛られる職場恋愛もの|職場の恋|1234|identity-role|company|modern|romance||
genre|couple-life|同棲や遠距離など、暮らしの選択を重ねる恋人もの|暮らす二人|123|shared-home||modern|romance||
genre|secret-affair|周囲に隠した関係が、少しずつほころんでいく秘密の恋もの|隠した関係|234|asymmetric-info||modern|romance,mystery||
genre|ex-return|別れた相手と、仕事や家族を通じて再会する再会もの|再会のあと|234|return-home,memory||modern|reunion,romance||
relation|boss-subordinate|交際を始めた成人の上司と部下で、仕事を教わることと評価されることの境界を相談する二人|上司と部下|1234|identity-role|company|modern|romance,status-gap||pair
relation|rival-peers|同じ昇進枠を争う同期の二人|昇進枠の同期|234|resource-fairness,identity-role|company|modern|rivalry,romance||pair
relation|client-vendor|取引先の担当者と、納期を調整する営業|納期の担当|123|negotiation|company|modern|buddy,romance||pair
relation|ex-project|別れて異動したはずが、再び同じプロジェクトに入った元恋人|同じ案件の元恋人|234|return-home,memory|company|modern|reunion,romance||pair
relation|meeting-foes|関係を隠したまま、会議では対立する役を演じる二人|会議での対立役|234|asymmetric-info|company|modern|romance,rivalry||pair
relation|older-subordinate|部署の相談役を担う年上の部下と、交際を公表する範囲を話し合う成人の新任課長|年上の部下|1234|identity-role|company|modern|status-gap||pair
relation|office-gossips|同じ部署で、恋愛の噂を回し合う同僚たち|噂を回す同僚|123|asymmetric-info|company|modern|daily-work||group
relation|house-chores|交際を続けながら、家事の分担を何度も話し合う同居の恋人|家事を話し合う二人|123|shared-home,negotiation||modern|romance||pair
relation|weekend-lovers|転勤で離れた恋人と、週末だけ顔を合わせる相手|週末の恋人|123|return-home||modern|romance||pair
relation|app-match|アプリで知り合い、後から共通の知人の存在に気づいた成人の二人|共通の知人|234|asymmetric-info||modern|romance||pair
relation|fiance-family|成人の婚約者と、結婚に反対する相手の家族たち|婚約者の家族|234|identity-role,loyalty||modern|romance||group
incident|schedule-leak|二人だけの予定が、共有カレンダーに公開設定で表示される|公開された予定|234|asymmetric-info|company|modern|romance||
incident|reorg-notice|組織変更で、二人の部署が同じ上司の下に統合される通知が出る|組織変更の通知|234|identity-role|company|modern|daily-work||
incident|all-nighter|納期前夜の徹夜作業で、同僚が帰ったあとに二人だけが残る|徹夜の夜|123|resource-fairness|company|modern|romance||
incident|transfer-offer|海外赴任の打診が、二人のどちらか一方にだけ届く|赴任の打診|234|relationship-choice|company|modern|romance||
incident|key-return|同棲中の部屋の合鍵を、返すかどうか相手が聞いてくる|合鍵の返却|234|relationship-choice,shared-home||modern|romance||
incident|parents-visit|予告なしに、相手の親が部屋を訪ねてくる|親の訪問|123|identity-role||modern|romance||
incident|wrong-message|成人の恋人へ送る私的な便りと、店へ出す予約の連絡が入れ替わる|宛先違いの連絡|234|asymmetric-info||modern|romance||
incident|anniversary-clash|記念日と個人の仕事の締切が重なり、相談する時間もないまま優先順位を決める日が来る|重なった記念日|123|negotiation,resource-fairness||modern|romance||
conflict|report-bond|この会社で交際を届けたいが、配置面談で二人の希望が別々に扱われるのではないかと迷う|届出の代償|234|contract,identity-role|company|modern|romance|ml-report|
conflict|rating-lover|昇進を受けたいが、受ければ部下である恋人を評価する立場になる|評価する立場|234|identity-role,loyalty|company|modern|romance|ml-promo|
conflict|stay-or-go|転勤の話を受けたいが、受ければ相手と交わした約束を破ることになる|断れない転勤|234|relationship-choice||modern|romance|ml-transfer|
conflict|tell-family|関係を家族に話したいが、話せば相手の事情まで明かすことになる|話せない事情|234|asymmetric-info,loyalty||modern|romance|ml-family|
conflict|one-credit|成果を二人の名で出したいが、評価の席では片方の名前しか通らない|一人分の評価|234|resource-fairness|company|modern|romance|ml-credit|
conflict|deny-rumor|噂を否定したいが、否定すれば相手との関係まで否定したことになる|否定できない噂|123|identity-role||modern|romance|ml-rumor|
conflict|same-project|元恋人と普通に働きたいが、同じ案件の連絡だけで気持ちが揺れる|同じ案件の距離|234|memory,return-home|company|modern|reunion,romance|ml-ex|
conflict|expose-fiance|婚約者の会社の不正を知ったが、告発すれば相手の暮らしを壊す|告発の相手|345|record-conflict,loyalty|company|modern|romance,mystery|ml-whistle|
twist|interview-only|この会社の届出後の面談には配置の複数案が用意されている。異動は自動決定されず、二人が希望を伝える段階が残る|面談だけの規定|234|contract|company|modern|romance|ml-report|
twist|committee-rates|この会社では別部署の査定会議が評価を決めるが、課長の推薦は資料に残る。二人は推薦の扱いも相談し直す|査定会議の権限|234|identity-role|company|modern|romance|ml-promo|
twist|remote-slot|赴任先の枠は在宅勤務を前提にしていて、住む場所を選べた|選べた居場所|234|relationship-choice||modern|romance|ml-transfer|
twist|family-knew|家族が知っていたのは事情の一部だけで、本人が話す範囲を選んで説明する場が必要になる|待っていた家族|234|asymmetric-info||modern|romance|ml-family|
twist|joint-sheet|この会社の評価票には共同成果の別紙を添付できるが、誰の貢献をどう記すかは二人と上司の合意が必要になる|共同の別紙|234|resource-fairness|company|modern|romance|ml-credit|
twist|warm-rumor|同僚は祝うつもりで噂を広めたが、二人は公開を望んでいない。好意だけでは済まず、訂正する範囲を話し合う|祝う側の噂|123|asymmetric-info||modern|romance|ml-rumor|
twist|both-hesitated|気持ちが揺れていたのは自分だけでなく、相手も同じ連絡への返信を迷っていた|迷った返信|234|memory|company|modern|reunion,romance|ml-ex|
twist|provisional-entry|仮計上の数字に、確定した成果として説明された形跡が見つかる。数字の確認と説明した側の責任を分けて調べる|仮計上の数字|345|record-conflict|company|modern|romance,mystery|ml-whistle|
twist|key-swap|合鍵の話は返却の催促ではなく、新しい部屋の鍵を一緒に選ぶ提案の前置きだった|新しい鍵|234|relationship-choice||modern|romance||
gimmick|calendar-color|共有カレンダーで、予定の色が相手の所属を示す職場|予定の色分け|123|asymmetric-info|company|modern|daily-work||
gimmick|badge-log|入退室の記録が部署単位でしか見られない社員証|部署単位の記録|234|asymmetric-info|company|modern|daily-work||
gimmick|draft-circle|取引先への返信下書きを、同僚どうしで回し読みする習慣|回し読みの下書き|123|mutual-aid|company|modern|buddy||
gimmick|fridge-note|同棲の部屋の冷蔵庫に貼る、二人だけが読む短いメモ|冷蔵庫のメモ|123|shared-home||modern|romance||
gimmick|status-signal|ビジネスチャットのステータス表示だけで、機嫌を伝え合う暗黙の合図|ステータスの合図|123|asymmetric-info|company|modern|romance||
gimmick|last-train-mark|終電の時刻表に二人だけの印を付けて待ち合わせる習慣|終電の印|123|return-home||modern|romance||
gimmick|seat-courtesy|飲み会の席次表に、噂を避ける暗黙の配慮が書き込まれる職場|席次の気遣い|123|asymmetric-info|company|modern|daily-work||
gimmick|ring-box|返事を保留したまま預かっている、婚約指輪の小箱|保留の小箱|234|relationship-choice||modern|romance||
`);

const A_office=parseModernPro('office','A',`
#group workplace-pro
genre|salaryman|会社員の毎日と小さな決断を重ねる、会社員の物語|会社員の決断|123|identity-role|company|modern|daily-work||
world|sales-floor|主要取引を失った会社で営業部の解散が決まり、残る契約と社員の進路を朝礼で確認する部署|朝礼の営業部|2345|resource-fairness|company|modern|daily-work,rivalry||
world|back-office|経理や総務が、他部署の締切を一手に支える管理部門|管理部の締切|123|craft,mutual-aid|company|modern|daily-work||
relation|new-hire-trainer|入社したばかりの新人と、育成を任された二年目の先輩|二年目の教育係|1234|craft,identity-role|company|modern|buddy||pair
relation|accounting-sales|経費の不備を指摘する経理担当と、締切を理由に急ぐ営業|経費の確認係|234|negotiation,record-conflict|company|modern|rivalry||pair
relation|chief-and-staff|成績を求められる課長と、残業を減らしたい課員たち|課長と課員|234|resource-fairness,negotiation|company|modern|daily-work||group
incident|off-forecast|月末に、予算の見込みが一桁違っていたと分かる|一桁違う見込み|234|record-conflict|company|modern|daily-work||
incident|renewal-terms|大口の取引先が、契約更新の直前に条件の再提示を求めてくる|更新前の再提示|234|negotiation|company|modern|daily-work||
incident|name-rewritten|会議資料の担当者名が、別の同僚の名前に書き換えられている|書き換えの担当名|234|record-conflict|company|modern|daily-work||
conflict|correct-number|数字の誤りを正したいが、正せば同僚の評価が下がる|正す数字|234|record-conflict,loyalty|company|modern|daily-work|co-number|
twist|premise-restated|見込みの前提が変わった日付が確認でき、数字の誤りと前提変更を分けて説明し直すことになる|前提の修正|234|record-conflict|company|modern|daily-work|co-number|
conflict|cut-overtime|残業を減らしたいが、減らすと成績の低い課が人員整理の対象になる|減らせない残業|234|resource-fairness|company|modern|daily-work|co-overtime|
twist|completion-rate|この会社の人員配置案は完了率を参照していたが、他部署を支える未完了の仕事が集計から漏れている|完了率の基準|234|resource-fairness|company|modern|daily-work|co-overtime|
conflict|own-result|成果を認めさせたいが、声を上げれば上司に使いにくい部下と見られる|認められたい成果|234|identity-role|company|modern|daily-work|co-result|
twist|edit-history|成果の記録は、共有フォルダの更新履歴に日付つきで残っていた|更新履歴の記録|234|record-conflict|company|modern|daily-work|co-result|
gimmick|three-stamps|承認印が三種類あり、押す順番で案件の重さが伝わる回覧|三つの承認印|234|record-conflict|company|modern|daily-work||
gimmick|cafeteria-seats|昼休みの食堂で、誰が誰と食べたかが噂の起点になる座席|食堂の席|123|asymmetric-info|company|modern|daily-work||
`);

const A_police=parseModernPro('police','A',`
#group workplace-pro
genre|police-work|現場の手順と人間関係から事件に向き合う警察もの|現場の警察|234|craft|police|modern|mystery||
world|koban-town|交番勤務の警察官が、地域の相談を雑談として受ける町|交番の相談所|123|mutual-aid,shop|police|modern|daily-work||
world|joint-station|合同捜査の体制が解散すると決まり、未解決の記録と担当の説明を引き継ぐ最後の捜査本部|合同捜査の署|2345|negotiation,identity-role|police|modern|mystery,rivalry||
relation|veteran-rookie|定年を控えた巡査長と、配属されたばかりの新人警察官|巡査長と新人|1234|craft,identity-role|police|modern|buddy||pair
relation|prosecutor-detective|起訴の判断を迫る検察官と、証拠の不足を訴える刑事|検察官と刑事|234|asymmetric-info,record-conflict|police|modern|rivalry,mystery||pair
relation|hesitant-witness|証言をためらう目撃者と、聞き取りを続ける警察官|ためらう目撃者|234|asymmetric-info|police|modern|mystery||pair
incident|lost-property|交番に届けられた落とし物が、未解決事件の遺留品と同じ型だった|同じ型の落とし物|234|record-conflict|police|modern|mystery||
incident|duty-reassign|捜査の山場で、担当刑事に異動の辞令が出る|山場の異動|234|identity-role|police|modern|mystery||
incident|three-addresses|匿名の通報が、三日続けて別の住所を告げてくる|三つの住所|234|asymmetric-info|police|modern|mystery||
conflict|report-colleague-rule|同僚の小さな規則違反を報告したいが、報告すれば彼が追っていた事件が止まる|報告と捜査|234|loyalty,record-conflict|police|modern|mystery|pl-report|
twist|unrecorded-approval|架空の署の内規では事前承認の記録も必要なのに、口頭の承認しか見つからない。行動と承認の責任を別々に確認する|記録のない承認|234|record-conflict|police|modern|mystery|pl-report|
conflict|protect-witness|目撃者を守りたいが、守るには事件の核心を伏せたまま捜査を進めるしかない|守る証人|345|loyalty,asymmetric-info|police|modern|rescue,mystery|pl-witness|
twist|witness-stand|目撃者は守られる側にとどまらず、自分から証言台に立つ機会を探していた|証言台を探す人|345|loyalty|police|modern|rescue,mystery|pl-witness|
conflict|hasty-arrest|事件の区切りを急ぎたいが、裏付けの足りない説明では被害を受けた人の疑問に答えられない|急ぐ逮捕|234|negotiation,record-conflict|police|modern|mystery|pl-arrest|
twist|second-vault|署内の別保管庫に証拠の写しが見つかるが、記録との照合が終わるまで事件の区切りを延期する必要がある|別保管庫の証拠|234|record-conflict|police|modern|mystery|pl-arrest|
gimmick|duty-log-margin|当直日誌の余白に、署員が一言ずつ書き足す慣例|当直日誌の余白|123|memory,mutual-aid|police|modern|daily-work||
gimmick|faint-guess|捜査会議の白板で、消した推測もうっすら残しておく運用|薄い推測|234|record-conflict|police|modern|mystery||
`);

const A_medical=parseModernPro('medical','A',`
#group workplace-pro
genre|medical-work|診断と生活のあいだで揺れる、医療現場の群像劇|医療現場の物語|234|craft|medical|modern|daily-work||
world|night-ward|病院の閉鎖が決まり、最後の夜勤チームが患者の次の受け入れ先と記録を確認する病棟|夜間の病棟|2345|mutual-aid|medical|modern|daily-work||
world|home-visit-clinic|医師が一人だけの診療所が、往診と在宅の相談を担う山あいの町|往診の診療所|1234|craft,mutual-aid|medical|modern|daily-work||
relation|head-nurse-resident|現場を知る看護師長と、方針を押し通す若い医師|看護師長と若手医師|234|identity-role,craft|medical|modern|rivalry,buddy||pair
relation|doctor-family|本人の希望を確認したい医師と、方針について意見が分かれる成人の家族たち|迷う家族|234|asymmetric-info|medical|modern|daily-work||group
relation|pharmacist-doctor|処方の疑問を伝える薬剤師と、確認の連絡を煩わしく思う医師|処方の確認係|234|asymmetric-info,negotiation|medical|modern|rivalry||pair
incident|swapped-chart|カルテの一部が、入院中に別の患者のものと入れ替わっている|入れ替わったカルテ|234|record-conflict|medical|modern|mystery||
incident|discharged-call|夜間当直に、退院したはずの患者から電話が入る|退院した患者の電話|234|asymmetric-info|medical|modern|mystery||
incident|one-bed|病棟の空き床が一つだけになり、二人の入院希望者が同時に来る|一つだけの空き床|234|resource-fairness|medical|modern|daily-work||
conflict|tell-diagnosis|診断を伝えたいが、家族が本人には言わないでほしいと頼んでいる|伝える診断|234|asymmetric-info,loyalty|medical|modern|daily-work|md-diagnosis|
twist|patient-ready|本人は病状を調べているが、望む生活について家族と意見が違う。聞く準備ができたことと、合意できることは別の課題になる|聞く機会を待つ人|234|asymmetric-info|medical|modern|daily-work|md-diagnosis|
conflict|cannot-rest|休みたいが、代わる医師がおらず診療所を閉めれば往診先が困る|代われない休み|234|resource-fairness,loyalty|medical|modern|daily-work|md-shift|
twist|substitute-ring|隣町との代診案が届くが、往診の引き継ぎ時間と休める日を当事者どうしで調整する必要が残る|代診の輪|1234|mutual-aid|medical|modern|daily-work|md-shift|
conflict|report-slip|ミスを報告したいが、報告すれば信頼してくれた患者の治療方針が揺らぐ|ミスの報告|234|record-conflict,loyalty|medical|modern|daily-work|md-error|
twist|device-drift|機器の誤差が見つかり、記録の数値だけでなく、その数値を使った判断への影響を確認し直すことになる|機器の誤差|234|record-conflict|medical|modern|daily-work|md-error|
gimmick|handover-tag|引き継ぎ札の裏に、患者の好きだった話題を一言だけ書く病棟の慣習|引き継ぎ札の一言|123|mutual-aid,memory|medical|modern|daily-work||
gimmick|bed-color|空き床の状況を、診療科ではなく受け入れ条件で色分けする掲示板|床の色分け|234|resource-fairness|medical|modern|daily-work||
`);

const A_education=parseModernPro('education','A',`
#group workplace-pro
genre|teacher-work|授業と校務のあいだで働き方を選び直す、教員の群像劇|教員の毎日|1234|identity-role|education|modern|daily-work||
world|staffroom|学年ごとに机が並び、授業の合間に職員室が相談所のようになる中学校|職員室の中学校|123|mutual-aid,identity-role|education|modern|daily-work||
world|transfer-cycle|学校の閉鎖が決まり、教員が異動までに生徒の支援と地域への連絡を次の学校へ渡す校舎|異動のある学校|2345|return-home,identity-role|education|modern|daily-work||
relation|vice-principal-young|現場の事情を知る教頭と、変化を急ぐ若手教員|教頭と若手|234|identity-role,negotiation|education|modern|rivalry||pair
relation|parent-liaison|保護者の不安を聞く担任と、要望を整理する学年主任|保護者対応の二人|234|negotiation|education|modern|buddy||pair
relation|trainee-mentor|成人の教育実習生と、指導を任されたベテラン教員|実習生と指導教員|123|craft,identity-role|education|modern|buddy||pair
incident|busy-week|行事の準備と定期考査の作成が、同じ週に重なる|重なった週|123|resource-fairness|education|modern|daily-work||
incident|spread-complaint|保護者からの苦情の連絡が、学年全体の連絡網で広まる|広まった苦情|234|asymmetric-info|education|modern|daily-work||
incident|colleague-leave|同僚が急に休職し、残った教員で学年の分担を組み直すことになる|休職の分担|234|resource-fairness,mutual-aid|education|modern|daily-work||
conflict|fair-grade|評価を公平につけたいが、保護者対応の負担を考えると曖昧に済ませたくなる|公平な評価|234|resource-fairness|education|modern|daily-work|ed-grade|
twist|open-rubric|この学校では基準の公開で疑問が具体的になる一方、個別の評価を説明する時間が新たに必要になる|公開する基準|1234|resource-fairness|education|modern|daily-work|ed-grade|
conflict|new-lesson|新しい授業を試したいが、試せば学年の足並みを乱す|足並みと授業|234|identity-role,negotiation|education|modern|daily-work|ed-lesson|
twist|team-waiting|学年の教員は変更点の共有を望んでいるが、実施時期には意見が分かれる。試す学級と検討する期間を決め直す|共有を待つ学年|1234|negotiation|education|modern|daily-work|ed-lesson|
conflict|question-method|同僚の指導法に疑問を持つが、伝えれば頼ってくれた関係が壊れる|伝える疑問|234|loyalty|education|modern|daily-work|ed-colleague|
twist|peer-review-wish|同僚も、自分の指導法を第三者に見てもらう機会を探していた|見てほしい同僚|234|loyalty|education|modern|daily-work|ed-colleague|
gimmick|strength-notebook|担任が替わるときに、生徒の得意なことと本人が望む支援を分けて記す、この学校独自の引き継ぎ帳|得意の引き継ぎ|123|memory,mutual-aid|education|modern|daily-work||
gimmick|thanks-whiteboard|職員室の白板に、その日の「助かったこと」を書き足す習慣|助かったこと|123|mutual-aid|education|modern|daily-work||
`);

const B_love=parseModernPro('love','B',`
#group modern-love
incident|missing-overlap|夜勤と日中の仕事がずれ、恋人どうしが相談できる時間が一週間なくなる|合わない一週間|1234|resource-fairness,relationship-choice||modern|romance||
incident|rent-decision|二人の部屋の更新日を前に、片方へ別の町で暮らす仕事の誘いが届く|更新前の誘い|234|shared-home,return-home||modern|romance||
conflict|support-tired|相手の仕事を支えたいが、支える役に回り続けて自分の休息がなくなる|支える側の休息|1234|mutual-aid,resource-fairness||modern|romance||
conflict|home-responsibility|同じ家に帰りたいが、それぞれの町で引き受けた役目をすぐには手放せない|帰る場所の役目|1234|return-home,loyalty||modern|romance||
`);

const B_office=parseModernPro('office','B',`
#group workplace-pro
relation|rebuild-leaver|傾いた会社を継いだ経営者と、退職を決めた古参社員|再建と退職|2345|identity-role,loyalty|company|modern|daily-work,limited-cooperation||pair
relation|rival-cooperation|競合会社の担当者と、共同案件の調整を任された開発者|競合との共同案件|234|negotiation,contract|company|modern|buddy,rivalry,limited-cooperation||pair
relation|new-leader-team|新任上司と、前任者の方針を守りたいチーム|引き継ぐ信頼|1234|identity-role,memory|company|modern|buddy,daily-work||group
relation|anonymous-source|社内広報の担当者と、名前を出されたくない情報提供者|広報と匿名の声|2345|asymmetric-info,record-conflict|company|modern|mystery,daily-work||pair
relation|handover-reluctant|後任として仕事を受け取る社員と、役割を失うことを恐れる前任者|渡す仕事の相談先|1234|identity-role,craft|company|modern|practical-skill,daily-work||pair
incident|unexplained-data|新商品の資料に、誰も提供元を説明できないデータが混ざる|提供元の空白|2345|record-conflict,asymmetric-info|company|modern|mystery,archive-mystery||
incident|orphan-project|部署の統合直前に、引き継ぎ先のない案件が一つ残る|引き取り先のない案件|234|identity-role,resource-fairness|company|modern|daily-work,limited-cooperation||
incident|handover-sentence|退職者の引き継ぎ資料に、会社の方針を変える一文が見つかる|方針を変える一文|1234|craft,negotiation|company|modern|practical-skill,daily-work|mp-handover-options|
incident|support-withdrawn|新しい評価制度で支援枠を失った社員が、以前は集計されなかった引き継ぎ作業の記録を提出する|支援枠の打ち切り|2345|resource-fairness,record-conflict|company|modern|archive-mystery,daily-work||
incident|closing-letters|閉鎖予定の支店へ、地域の人々から大量の手紙が届く|閉鎖支店への便り|1234|memory,return-home|company|modern|reunion,daily-work||
conflict|company-or-workers|会社の信用を守りたいが、事実を伏せるほど社員への負担が増える|信用と社員の負担|2345|record-conflict,loyalty|company|modern|daily-work,limited-cooperation||
conflict|client-capacity|顧客との約束を守りたいが、今の人数で受ければ社員の休みがなくなる|約束と現場の人数|1234|contract,resource-fairness|company|modern|daily-work,limited-cooperation||
conflict|tradition-excludes|古い成功基準を守りたいが、新入社員が支えた仕事はその基準に載らず、評価の場で発言できない|発言を閉ざす慣習|1234|resource-fairness,identity-role|company|modern|daily-work,status-gap|mp-success-index|
conflict|win-closes-other|自分の部署を残したいが、成果が認められるほど別の部署が閉鎖に近づく|残る部署の代償|2345|resource-fairness,loyalty|company|modern|daily-work,rivalry||
conflict|cannot-refuse|好きな仕事を続けたいが、別部署からの応援依頼が直接届き、担当業務の締切を相談する前に引き受けてしまう|応援依頼と担当の締切|1234|resource-fairness,negotiation|company|modern|daily-work,limited-cooperation|mp-handover-options|
twist|old-success-index|この会社の成功基準は部署単独の成果だけを数えている。基準を更新すると、古参の順位も変わるため合意を取り直す必要がある|成功基準の外側|2345|resource-fairness,negotiation|company|modern|daily-work,status-gap|mp-success-index|
twist|hidden-thanks|支店への手紙を開くと、抗議に交じって過去に助けられた人々の感謝が現れる|抗議に交じる感謝|1234|memory,mutual-aid|company|modern|reunion,daily-work||
twist|handover-options|引き継ぎ資料には、追加依頼を断る場合の代替案も残っている。後任はすべてを受ける前提から、仕事の範囲を選ぶ交渉へ進める|後任へ残す選択肢|1234|craft,negotiation|company|modern|practical-skill,limited-cooperation|mp-handover-options|
`);

const B_police=parseModernPro('police','B',`
#group workplace-pro
relation|field-forensics|現場の聞き取りを重視する刑事と、証拠の記録を守る鑑識担当|聞き取りと証拠の記録|234|craft,record-conflict|police|modern|practical-skill,archive-mystery||pair
relation|press-spokesperson|元刑事の記者と、情報の公開範囲を調整する警察の広報担当|公開範囲の境界|2345|asymmetric-info,negotiation|police|modern|mystery,limited-cooperation||pair
relation|missing-family|失踪者を探す成人の家族と、捜査を終えられない刑事|家族と終わらない捜査|2345|return-home,loyalty|police|modern|rescue,mystery||pair
incident|return-time-gap|証拠品の返却記録だけが、事件当日の時刻と合わない|返却時刻のずれ|2345|record-conflict|police|modern|archive-mystery,mystery||
incident|old-consultations|事件として受理されなかった相談を集めたノートが、一冊だけ残っている|相談の残るノート|2345|memory,record-conflict|police|modern|archive-mystery,mystery||
incident|apology-before-close|捜査を区切る前日に、差出人の分からない謝罪文が届く|区切り前の謝罪文|2345|record-conflict,asymmetric-info|police|modern|archive-mystery,mystery||
conflict|organization-error|組織の信頼を守りたいが、過ちを伏せれば被害を受けた人へ説明できない|組織の過ちへの説明|2345|record-conflict,loyalty|police|modern|archive-mystery,mystery|mp-organization-explanation|
conflict|family-recusal|家族の事件を追いたいが、自分が担当すれば判断の公正さを疑われる|家族の事件への距離|2345|loyalty,identity-role|police|modern|mystery,status-gap||
conflict|repeat-investigation|過去の誤捜査を認めたいが、認めれば現在の証拠も確かめ直す必要がある|確かめ直す事件|2345|record-conflict,memory|police|modern|mystery,archive-mystery|mp-reopened|
twist|apology-officer|謝罪文の差出人は犯人ではなく、当時の対応を見直したい担当者だと分かる|対応を見直す差出人|2345|identity-role,loyalty|police|modern|mystery,archive-mystery|mp-organization-explanation|
twist|reopened-questions|過去の捜査をやり直すと、解決したと思われた被害が今も続いている記録に行き着く|続いている被害|345|memory,record-conflict|police|modern|mystery,rescue|mp-reopened|
`);

const B_education=parseModernPro('education','B',`
#group workplace-pro
relation|teacher-custodian|新人教員と、校舎の古い慣習を知る用務員|新人と校舎の慣習|1234|craft,memory|education|modern|practical-skill,daily-work||pair
relation|graduate-colleague|成人して同じ学校の同僚になった元教え子と、以前の教え方を変えたい教員|同僚になった元教え子|1234|memory,identity-role|education|modern|reunion,daily-work||pair
relation|waiting-management|生徒の相談を急がせたくない教員と、期限内の対応を求める管理職|相談の時間と期限|2345|resource-fairness,negotiation|education|modern|daily-work,status-gap||pair
incident|changed-path-letter|卒業後に進路を変えた成人の卒業生から、職員室へ手紙が届く|進路を変えた卒業生|1234|return-home,identity-role|education|modern|reunion,daily-work||
incident|lost-support-history|学校の記録から、一人分の相談履歴だけが見つからなくなる|見つからない相談履歴|2345|record-conflict,asymmetric-info|education|modern|archive-mystery,mystery||
incident|graduate-statistics|卒業生の進路データが、学校評価のため書き換えられていると分かる|評価のための進路表|2345|record-conflict,resource-fairness|education|modern|archive-mystery,mystery||
conflict|share-burden|相談した生徒を守りたいが、教員一人で抱えれば必要な支援へつなげられない|一人で抱える相談|2345|mutual-aid,resource-fairness|education|modern|daily-work,buddy|mp-later-consultation|
conflict|family-time|教師を続けたいが、校務を引き受け続けるほど家族との時間を失う|校務と家族の時間|1234|shared-home,resource-fairness|education|modern|daily-work||
conflict|equal-support|同じ対応をしたいが、同じ対応では目の前の生徒に必要な助けが届かない|同じ対応の限界|1234|mutual-aid,resource-fairness|education|modern|daily-work,rescue||
twist|later-consultation|欠けた履歴の手がかりは卒業後の新しい相談へつながる。成人した本人が共有する範囲を選び、次の相談担当へ渡す入口になる|卒業後へ続く相談|2345|memory,mutual-aid,record-conflict|education|modern|archive-mystery,rescue|mp-later-consultation|
`);

const B_medical=parseModernPro('medical','B',`
#group workplace-pro
relation|emergency-leaving|救急医と、働き方を変えるため病院を辞めたい看護師|夜勤後の働き方|234|resource-fairness,identity-role|medical|modern|buddy,daily-work||pair
relation|record-patient|医療記録を管理する事務員と、記録の食い違いを訴える成人患者|本人と記録の食い違い|2345|record-conflict,asymmetric-info|medical|modern|mystery,archive-mystery||pair
relation|ex-socialworker|交際を終えた成人の医師とソーシャルワーカーで、同じ患者への支援を仕事の関係として組み直す二人|元恋人との支援連携|234|memory,mutual-aid|medical|modern|reunion,buddy,daily-work||pair
incident|closure-list|病院の閉鎖日が迫るなか、次の受け入れ先が決まらない患者の一覧が残る|閉鎖前の受け入れ先|2345|mutual-aid,resource-fairness|medical|modern|rescue,daily-work||
incident|unassigned-shift|夜勤の引き継ぎ記録に、誰が担当したか分からない時間が見つかる|担当者のない時間|2345|record-conflict,identity-role|medical|modern|archive-mystery,mystery||
incident|unnamed-donations|診療所を支える寄付の帳簿に、名乗らない支援者の記録が続く|名乗らない寄付|1234|mutual-aid,resource-fairness|medical|modern|found-family,daily-work||
conflict|patient-family-choice|本人の希望を尊重したいが、家族の願う生活の形と一致しない|本人が選ぶ生活|234|relationship-choice,shared-home|medical|modern|daily-work,rescue||
conflict|nightshift-limit|医療の仕事を続けたいが、今の夜勤を続ければ自分の生活が立ち行かなくなる|夜勤を続ける限界|1234|shared-home,resource-fairness|medical|modern|daily-work||
conflict|support-consent|支援を拒む人を助けたいが、助けるために本人の選択を奪いたくない|支援と選択の境界|1234|relationship-choice,mutual-aid|medical|modern|rescue,daily-work||
twist|shared-donation-name|匿名の寄付名義をたどると、診療所に助けられた人々の共同名義に行き着く|支え返す共同名義|1234|mutual-aid,asymmetric-info|medical|modern|found-family,daily-work||
`);

export const MODERN_PRO_A=Object.fromEntries(KEYS.map(key=>[key,[...A_love[key],...A_office[key],...A_police[key],...A_medical[key],...A_education[key]]]));
export const MODERN_PRO_B=Object.fromEntries(KEYS.map(key=>[key,[...B_love[key],...B_office[key],...B_police[key],...B_education[key],...B_medical[key]]]));
export const MODERN_PRO_BASIC=Object.fromEntries(KEYS.map(key=>[key,[...MODERN_PRO_A[key],...MODERN_PRO_B[key]]]));
