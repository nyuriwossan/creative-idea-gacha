# 世界観の本文整理：レビュー記録

確認日：2026-10-06（日本時間）。基準・最新main：`ddea24618df1ef0d7450d94ac8a2c29849eada2e`。fetchしたmainと一致し、作業開始時に変更なし、適用対象AGENTS.mdなし。指示書の32件の変更前本文がすべて最終DATAと一致しました。

世界観は今回の人物・事件・期限・結末を固定しない前提へ整理しました。小さな拠点、住民の種類、反復する暮らし、過去の歴史は残します。32件の本文とタイトル短語だけを編集し、249世界観・基本1,457素材・22テーマ・15背景・各29質問を維持。候補追加／削除／統合／非推奨化／重み変更は0です。

## 実装と保存

js/world-revision-data.jsをIDと変更前本文を持つ唯一の編集定義とし、data.jsで背景・テーマ・話題の補完を終えた最終worldへ適用します。新オブジェクトで本文と短語だけを差し替え、未対象217件は同じオブジェクト、入力配列は変更しません。別の本文になっている候補は上書きせず、適用済みの候補にも再適用しません。循環importは追加していません。EXTRA_DATAとstorageの定義参照は新しい最終DATAを使います。

保存stateへ当て直す処理はありません。generatedのテーマ併合、キー欠損時の背景／話題補完は従来どおりです。旧版で読み込んだ5fixtureの期待値と比較し、旧本文・短語・明示空背景・回答・固定・手入力・名前・メモ・作成済み出力が今回由来で変わらないことを確認しました。schemaVersion2、保存キー、履歴、プリセット、出力の実装は変更していません。

変更ファイル：js/world-revision-data.js、js/data.js、js/app.js（世界観カードの説明1文のみ）、tests/world-restructure*とfixture、既存の原文固定・ハッシュ・画面テスト4ファイルとbrowser-check、README、VALIDATION、本レビュー。過去のハッシュテストは32件の本文・短語だけを逆正規化し、メタデータや他候補の検査を残しました。

## IDごとの変更前後と採用理由

| ID | 変更前 | 変更後 | 短語 | 理由 |
| --- | --- | --- | --- | --- |
| `world-original-17jnmz1` | 廃校寸前の学校 | 生徒数の減少が続き、地域に一つだけの学校が学びと交流を支えている地域 | 地域に一つの学校 | 廃校寸前という開始時点を外し、学校と地域の状態を残す。 |
| `world-original-1j1khx1` | 戦乱前夜の王国 | 諸侯が私兵を抱え、王家の統制と国境の安定が揺らいでいる王国 | 揺らぐ王国 | 開戦前夜を固定せず、戦争にも平時の物語にも使える緊張を残す。 |
| `world-original-1jdjray` | 王位継承争いの渦中にある国 | 血統と有力家の支持で王位が決まり、継承規則の解釈が分かれる王国 | 王位の規則 | 進行中の継承争いを外す。王族の背景は明示する。 |
| `world-original-e6zzeq` | 異世界転生後の世界 | 転生者が現地の人々と暮らし、異なる世界の経験が混じり合う異世界 | 転生者のいる世界 | 主人公自身の転生後という読みを避け、転生という世界の性質を残す。 |
| `world-original-1eprmze` | 悪役令嬢ものの世界 | 家柄と社交上の評判が、婚姻と将来の立場を大きく左右する貴族社会 | 評判の貴族社会 | 悪役令嬢という人物・ジャンルを指定せず、その物語を置ける社会を残す。 |
| `desert-court-world-shared-treaty` | 婚約者の合意で二国の魔法水路を維持する砂漠連邦 | 王家どうしの婚姻同盟が、オアシス間の交易を支える魔法水路の維持条件になっている砂漠連邦 | 婚姻同盟の水路 | 特定の婚約者を外す。既存の砂漠・オアシス・王族・交易・魔法の根拠を本文に残す。 |
| `romantasy-world-beast-water` | 獣人の婚約者が水路魔法の解除権を持つ砂漠王国 | オアシスをつなぐ水路魔法の解除権を、獣人の王家が持つ砂漠王国 | 獣人王家の水路 | 特定の婚約者を外し、権利と魔法の前提にする。 |
| `story3-cozy-fantasy-world-last-arcade` | 取り壊しの日まで魔法の品を返し続ける商店街 | 古い建物の維持が難しくなり、魔法の品を貸し借りする店が支え合う商店街 | 魔法の貸し借り | 取り壊し日と返却行動を外す。維持の難しさを残し、トーンを希釈しない。 |
| `story3-cozy-fantasy-world-house-seasons` | 住人が別々の道へ進む季節を迎えた共同住宅 | 住人の入れ替わりが多く、共同の持ち物や思い出を引き継ぐ習慣がある共同住宅 | 引き継ぐ住まい | 特定の巣立ちの季節を外す。生活時間を相談する既存住宅とは異なる引き継ぎの軸を残す。 |
| `story3-cozy-fantasy-world-repair-winter` | 修理の技術を次世代へ渡す最後の冬を迎えた魔法工房の町 | 職人の高齢化が進み、魔法道具の修理技術が口伝で受け継がれる工房の町 | 口伝の魔法工房 | 最後の冬と継承の達成を外す。技術の継承が難しい状態は残す。 |
| `story3-cozy-fantasy-world-return-week` | 閉店までの一週間に常連の預かり物を返す店のある町 | 旅人の預かり物を長年保管する店が多く、保管料と信用で成り立つ宿場町 | 預かり物の宿場 | 閉店まで一週間と返却の目的を外す。魔法や秘密を新たに必須にしない。 |
| `story3-cozy-fantasy-world-old-tools` | 老いた店主の魔法道具が次の使い手を探す町 | 魔法道具が持ち主を選び替えながら受け継がれる町 | 持ち主を選ぶ道具 | 老いた店主という当事者を外し、反復可能な魔法の性質にする。 |
| `story3-cozy-fantasy-world-season-inn` | 精霊の季節移動に合わせて最後の営業をする宿場 | 精霊の季節移動に合わせて営業時期が決まる宿場 | 精霊の季節宿 | 最後の営業を外し、季節ごとの慣習として残す。 |
| `r4-limited-cooperation-world-evacuation-pact` | 沈む街からの退去日まで、敵対地区が輸送路を共有する都市 | 浸水が進む街で、敵対する地区が輸送路だけは共同利用する都市 | 浸水する街の輸送路 | 退去日と避難完了を外す。浸水という環境の危機と敵対構造は残す。 |
| `r4-practical-skill-world-closing-workshop` | 戦後の道具を兵器へ戻す命令に抗い、最後の工房が閉鎖を待つ街 | 戦後の工房と民生技術が軍の管理下に置かれ、用途を自由に決められない街 | 軍の管理下の工房 | 抵抗行動と最後の工房の閉鎖を外し、軍の制約を残す。 |
| `sf-school-world-school-merge` | 二つの学校が統合され、校歌と制服をどちらに合わせるか決める移行期の校舎 | 異なる校歌や制服の伝統が併存し、校内のルールが出身校によって異なる統合校 | 伝統の重なる学校 | 現在進行の統合と二択を外す。統合後の状態は世界観として許容する。 |
| `sf-school-world-island-last` | 生徒が数人になり、卒業式の翌日に廃校が決まった離島の学校 | 生徒数が減り続け、島外への通学手段も限られる離島の学校 | 通学の限られる島 | 卒業式翌日の廃校を外し、人口と交通の制約を残す。 |
| `sf-school-world-score-rewrite` | 進学実績のための成績改ざんが判明し、卒業生の推薦枠が回復されないと決まった学校 | 進学実績が学校の資金と推薦枠を左右し、成績記録の訂正が難しい学校 | 訂正の難しい記録 | 改ざんの発覚と推薦枠が回復されない結末を外す。不透明な構造は残す。 |
| `sf-school-world-shelter-school` | 災害で元の校舎を失い、避難所の仮設教室で最後の学年を送り出す学校 | 災害で校舎を失った地域で、仮設の教室と乏しい物資で学びを続ける学校 | 仮設教室の学校 | 最後の学年を外す。災害後の状態まで取り除かない。 |
| `sf-underworld-world-neutral-diner` | 抗争の合間だけ、どの組も手を出さない定食屋が中立地帯になる街 | 敵対する組織どうしも、定食屋の中では手を出さない中立の慣習がある街 | 中立の定食屋 | 抗争の合間という開始状況を外し、中立の慣習と裏社会らしさを残す。 |
| `sf-underworld-world-new-boss` | 組の代替わりで、先代の結んだ約束が一斉に見直される街 | 組の代替わりのたびに、先代の約束を見直す慣習がある街 | 代替わりの慣習 | 今回の代替わりの事件から、繰り返される組織の慣習へ変える。 |
| `sf-school-world-student-services` | 売店・菜園・放送を生徒が運営し、卒業学年が後継班への権限移譲を終えてから旅立つ学校 | 売店・菜園・放送を生徒が運営し、権限と仕事を学年ごとに引き継ぐ学校 | 生徒の運営する学校 | 卒業学年が移譲を完了して旅立つという進行を外す。 |
| `mp-modern-love-world-ex-same-floor` | 別れた二人が、同じフロアで働き続けなければならない本社ビル | 部署ごとに働く場所が固定され、仕事と私生活の人間関係が重なりやすい企業社会 | 重なり合う職場 | 別れた二人を外し、本社フロアに限らず会社内外の関係を置けるようにする。 |
| `mp-modern-love-world-company-town` | 婚約者の勤める会社の閉鎖が決まり、不正の記録を残すかで最後の雇用整理が揺れる企業城下町 | 一つの企業が町の雇用と暮らしを支え、不利な記録が表に出にくい企業城下町 | 企業に依存する町 | 婚約者・閉鎖決定・最後の雇用整理を外し、依存と不透明さを残す。 |
| `mp-modern-love-world-share-house` | 交際を周囲に言わないまま、二人で部屋を借りて暮らす都市 | 共同生活向けの住まいが普及し、暮らし方を自分たちで選べる現代社会 | 選べる共同生活 | 交際を隠す二人を外し、恋人・友人・家族などを後から選べるようにする。 |
| `mp-modern-love-world-long-distance` | 仕事の都合で離れて暮らす恋人が、毎週末だけ同じ駅で会う暮らし | 転勤や遠隔勤務が一般的で、離れて暮らす人々を交通と通信がつなぐ現代社会 | 離れた暮らし | 恋人と毎週末の待ち合わせを外し、距離と仕事を生活の前提にする。 |
| `mp-modern-love-world-wedding-month` | 結婚式の準備をきっかけに、親族や職場に関係が知られていく街 | 結婚や家族のあり方に、親族と職場の慣習が影響する現代社会 | 家族と周囲の慣習 | 特定の結婚式の準備と関係の公表を外す。婚姻の文化は残す。 |
| `mp-modern-love-world-apps-city` | アプリで知り合った成人の相手が、いつも利用する店の運営にも関わっていると分かる地方都市 | オンラインの出会いと地域の人付き合いが重なり、匿名でいられる範囲が狭い地域社会 | 重なる出会い | アプリの相手が店に関わるという発見を外し、出会いと地域の重なりにする。 |
| `mp-workplace-pro-world-sales-floor` | 主要取引を失った会社で営業部の解散が決まり、残る契約と社員の進路を朝礼で確認する部署 | 数字の目標と順位で人員と予算が決まり、成績が社員の暮らしにも響く企業の営業組織 | 数字に左右される職場 | 取引喪失と部署の解散を外し、評価の圧力を残す。 |
| `mp-workplace-pro-world-joint-station` | 合同捜査の体制が解散すると決まり、未解決の記録と担当の説明を引き継ぐ最後の捜査本部 | 所轄と本部の権限が分かれ、人員不足と未解決の記録を抱える警察組織 | 所轄と本部の警察 | 最後の捜査本部と解散決定を外し、権限の分担と組織の負担を残す。 |
| `mp-workplace-pro-world-night-ward` | 病院の閉鎖が決まり、最後の夜勤チームが患者の次の受け入れ先と記録を確認する病棟 | 病床と夜勤の人員が削られ続け、現場の裁量に頼る地域の病院 | 人員の限られる病院 | 閉鎖と最後の夜勤を外し、逼迫した体制を残す。 |
| `mp-workplace-pro-world-transfer-cycle` | 学校の閉鎖が決まり、教員が異動までに生徒の支援と地域への連絡を次の学校へ渡す校舎 | 教員の定期異動があり、人員不足と地域格差のもとで支援を引き継ぐ公立学校 | 異動と支援の学校 | 学校閉鎖と異動までの締切を外し、定期異動と支援の難しさを残す。 |

## 分離した内容と既存素材の検索

基本6カテゴリ・任意人物・進行・入口の最終EXTRA_DATAを、元恋人／婚約／同居／遠距離／結婚式／アプリ／廃校／閉鎖／異動／卒業／返却／引き継ぎ／修理／軍／継承／開戦などで検索して照合しました。下表は実在IDと全文であり、移動や新規追加は行っていません。関係性、事件、葛藤、期限、結末を区別し、一部が似ているだけで全展開を収録済みとは扱いません。

| 世界観ID | 外した要素 | 既存素材（実在ID・本文） | 一致の範囲／未追加部分 |
| --- | --- | --- | --- |
| `world-original-17jnmz1` | 廃校寸前 | conflict / `sf-school-conflict-archive-secret`：廃校の前に記録を残したいが、残せば卒業生が隠したかった事情も明らかになる | 廃校前の記録を残す葛藤。廃校の事件そのものではない |
| `world-original-1j1khx1` | 開戦前夜 | 今回は新規追加せず | 同じ開戦の時点を指定する候補は確認できず、今回は新規追加せず |
| `world-original-1jdjray` | 継承争いの渦中 | relation / `desert-court-relation-siblings`：王位を望まない第一継承者と望む第二継承者 | 王位を巡る関係性。進行中の争い・決着は別 |
| `world-original-e6zzeq` | 主人公の転生後 | genre / `genre-original-106tddq`：異世界転生 | 転生ジャンル。転生時点を必ず描く指定ではない |
| `world-original-1eprmze` | 悪役令嬢という人物・ジャンル | genre / `genre-original-7ascxa`：悪役令嬢 | ジャンルとして存在。任意人物欄へ自動転記しない |
| `desert-court-world-shared-treaty` | 今回の婚約者 | relation / `desert-court-relation-hidden-fiances`：宮廷の外では肩書きを伏せる婚約者同士 | 婚約者の関係性。二国水路維持の全展開を収録したとは扱わない |
| `romantasy-world-beast-water` | 水路解除権を持つ婚約者 | relation / `romantasy-relation-consent-witness`：婚約の解除権を守る立会人と婚約者 | 解除権を扱う関係性のみ。水路の具体的展開とは異なる |
| `story3-cozy-fantasy-world-last-arcade` | 取り壊し日までの返却 | incident / `story3-cozy-fantasy-incident-return-calendar`：閉店前の店へ預かり品の持ち主たちが違う日に訪ねてくる | 返却・閉店の事件。商店街取り壊し期限は今回は新規追加せず |
| `story3-cozy-fantasy-world-house-seasons` | 今回の住人の巣立ち | incident / `story3-cozy-fantasy-incident-house-last-meal`：共同住宅を出る住人が最後の食事当番を引き受ける | 住人が出ていく事件として存在。別々の道の結末は未指定 |
| `story3-cozy-fantasy-world-repair-winter` | 最後の冬に技術を渡す | relation / `story3-cozy-fantasy-relation-final-apprentice`：最後の弟子を迎える修理職人と旅立ちを控えた弟子 | 継承の関係性。冬の期限や継承達成は今回は新規追加せず |
| `story3-cozy-fantasy-world-return-week` | 閉店まで一週間で返す | incident / `story3-cozy-fantasy-incident-return-calendar`：閉店前の店へ預かり品の持ち主たちが違う日に訪ねてくる | 預かり品と閉店前の事件。一週間という期限は別で未追加 |
| `story3-cozy-fantasy-world-old-tools` | 老いた店主と次の使い手 | incident / `incident-new-1c1rnl8`：古い道具の持ち主を探すことになる | 持ち主を探す事件。老店主や探し終える結末は未追加 |
| `story3-cozy-fantasy-world-season-inn` | 最後の季節営業 | incident / `cozy-fantasy-incident-last-day`：最後の営業日に小さな守護魔法が働く | 最終営業日の事件のみ。精霊の季節移動と同一展開ではない |
| `r4-limited-cooperation-world-evacuation-pact` | 退去日までの避難 | incident / `r4-limited-cooperation-incident-broken-pact`：輸送協定が破棄され、救出を約束した人々の一部が取り残される | 輸送協定破棄と救出の事件。浸水・退去日は今回は新規追加せず |
| `r4-practical-skill-world-closing-workshop` | 軍の命令への抵抗と最後の工房閉鎖 | incident / `r4-practical-skill-incident-destroy-tools`：工房の技を軍へ渡すことを拒み、弟子たちが唯一の型を壊すか迫られる | 軍への技術提供を拒む事件。工房閉鎖の期限は別 |
| `sf-school-world-school-merge` | 二校統合と校歌・制服の二択 | incident / `sf-school-incident-club-merge`：部員不足で、二つの部に統合の提案が出る | 部の統合提案という類似事件のみ。学校全体の二択は未追加 |
| `sf-school-world-island-last` | 卒業式翌日の廃校 | conflict / `sf-school-conflict-archive-secret`：廃校の前に記録を残したいが、残せば卒業生が隠したかった事情も明らかになる | 廃校前の葛藤のみ。翌日指定の期限・廃校実施は未追加 |
| `sf-school-world-score-rewrite` | 改ざん発覚と推薦枠不回復 | incident / `mp-workplace-pro-incident-graduate-statistics`：卒業生の進路データが、学校評価のため書き換えられていると分かる | 進路データ改ざんの事件で、成績・推薦枠の結末とは異なる |
| `sf-school-world-shelter-school` | 最後の学年を送り出す | incident / `mp-workplace-pro-incident-changed-path-letter`：卒業後に進路を変えた成人の卒業生から、職員室へ手紙が届く | 卒業後の進路を扱う別事件。災害後の最後の学年の結末は未追加 |
| `sf-underworld-world-neutral-diner` | 抗争の合間 | 今回は新規追加せず | 中立の慣習は世界観へ残し、特定の抗争休止の事件は今回は新規追加せず |
| `sf-underworld-world-new-boss` | 今回の組の代替わり | 今回は新規追加せず | 代替わりの反復的な慣習へ整理。同じ組の継承事件は今回は新規追加せず |
| `sf-school-world-student-services` | 権限移譲を完了して旅立つ | 今回は新規追加せず | 権限失効の期限候補はあるが、学年の完了・旅立ちの結末とは異なるため未追加 |
| `mp-modern-love-world-ex-same-floor` | 別れた二人が同じ職場 | relation / `mp-modern-love-relation-ex-project`：別れて異動したはずが、再び同じプロジェクトに入った元恋人 | 元恋人が再び同じ案件に入る関係性。建物の配置は世界側に残す |
| `mp-modern-love-world-company-town` | 婚約者・閉鎖決定・最後の整理 | relation / `mp-workplace-pro-relation-rebuild-leaver`：傾いた会社を継いだ経営者と、退職を決めた古参社員 | 再建と退職の関係性のみ。会社閉鎖・婚約者・不正の全事件は未追加 |
| `mp-modern-love-world-share-house` | 交際を隠して二人で暮らす | relation / `mp-modern-love-relation-house-chores`：交際を続けながら、家事の分担を何度も話し合う同居の恋人 | 同居する恋人の関係性。交際を隠す展開はこの候補と同義ではない |
| `mp-modern-love-world-long-distance` | 恋人が毎週末に会う | genre / `mp-modern-love-genre-couple-life`：同棲や遠距離など、暮らしの選択を重ねる恋人もの | 遠距離のジャンル。駅での毎週末の行動は今回は新規追加せず |
| `mp-modern-love-world-wedding-month` | 式準備を契機に関係が公表される | 今回は新規追加せず | 結婚式を契機にした公表と同趣旨の事件は確認できず、今回は新規追加せず |
| `mp-modern-love-world-apps-city` | アプリの相手と店の関係が判明 | relation / `mp-modern-love-relation-app-match`：アプリで知り合い、後から共通の知人の存在に気づいた成人の二人 | アプリと共通知人の関係性のみ。店の関与が判明する事件は未追加 |
| `mp-workplace-pro-world-sales-floor` | 取引喪失・解散・進路確認 | incident / `mp-workplace-pro-incident-orphan-project`：部署の統合直前に、引き継ぎ先のない案件が一つ残る | 統合前に引き継ぎ先がない案件の事件のみ。営業部解散の事件とは異なる |
| `mp-workplace-pro-world-joint-station` | 解散決定と最後の引き継ぎ | incident / `mp-workplace-pro-incident-duty-reassign`：捜査の山場で、担当刑事に異動の辞令が出る | 捜査中の担当異動の事件。組織解散の結末は未追加 |
| `mp-workplace-pro-world-night-ward` | 閉鎖と最後の夜勤 | incident / `mp-workplace-pro-incident-closure-list`：病院の閉鎖日が迫るなか、次の受け入れ先が決まらない患者の一覧が残る | 病院閉鎖と受け入れ先の事件は存在。最後の夜勤の完了は未指定 |
| `mp-workplace-pro-world-transfer-cycle` | 閉鎖と異動期限の引き継ぎ | incident / `mp-workplace-pro-incident-lost-support-history`：学校の記録から、一人分の相談履歴だけが見つからなくなる | 支援記録の欠損という別事件のみ。学校閉鎖・異動期限は未追加 |

既存の期限例：deadline / `deadline-new-giizd2`：契約の更新日まで、deadline / `r4-extra-deadline-authority-end`：共同指揮の権限が自動で失効する正午まで。どちらも取り壊し日や卒業式翌日の廃校とは同義でなく、その期限を新たに収録したとは扱いません。

## 重点6世界観：異なる関係性と中心事件3例ずつ

以下18例は編集上の組み合わせ例です。候補を追加した実績でも、ランダム抽選の成功による自由の保証でもありません。実在する関係性・中心事件を選び、必要背景がworldと合うことを確認しました。結末・解決方法は選ばず、恋愛、仕事、共同生活、地域の謎など別の方向を置けるかを目視しました。学園の世界観へeducationを勝手に足さず、背景条件のない素材を使っています。

### mp-modern-love-world-ex-same-floor

部署ごとに働く場所が固定され、仕事と私生活の人間関係が重なりやすい企業社会

| 例 | 関係性 | 中心事件 | 置ける方向（結末は未確定） |
| --- | --- | --- | --- |
| 1 | relation / `mp-modern-love-relation-ex-project`：別れて異動したはずが、再び同じプロジェクトに入った元恋人 | incident / `mp-modern-love-incident-reorg-notice`：組織変更で、二人の部署が同じ上司の下に統合される通知が出る | 公表する関係・仕事の範囲を選ぶ恋愛劇 |
| 2 | relation / `mp-workplace-pro-relation-new-leader-team`：新任上司と、前任者の方針を守りたいチーム | incident / `mp-workplace-pro-incident-unexplained-data`：新商品の資料に、誰も提供元を説明できないデータが混ざる | データの提供元をたどる職場ミステリー |
| 3 | relation / `mp-workplace-pro-relation-accounting-sales`：経費の不備を指摘する経理担当と、締切を理由に急ぐ営業 | incident / `mp-workplace-pro-incident-orphan-project`：部署の統合直前に、引き継ぎ先のない案件が一つ残る | 担当と負担を引き受け直す仕事の物語 |

### mp-modern-love-world-share-house

共同生活向けの住まいが普及し、暮らし方を自分たちで選べる現代社会

| 例 | 関係性 | 中心事件 | 置ける方向（結末は未確定） |
| --- | --- | --- | --- |
| 1 | relation / `mp-modern-love-relation-house-chores`：交際を続けながら、家事の分担を何度も話し合う同居の恋人 | incident / `mp-modern-love-incident-key-return`：同棲中の部屋の合鍵を、返すかどうか相手が聞いてくる | 二人で暮らす条件を選び直す |
| 2 | relation / `relation-new-1xztvua`：共同住宅で暮らす住人たち | incident / `story3-cozy-fantasy-incident-house-last-meal`：共同住宅を出る住人が最後の食事当番を引き受ける | 住人の思い出を残す方法を選ぶ群像劇 |
| 3 | relation / `relation-original-vst3bu`：幼なじみ | incident / `incident-new-10221eg`：閉店予定の店に一日だけ客が集まる | 住居の外の店を巡る再会劇 |

### mp-modern-love-world-apps-city

オンラインの出会いと地域の人付き合いが重なり、匿名でいられる範囲が狭い地域社会

| 例 | 関係性 | 中心事件 | 置ける方向（結末は未確定） |
| --- | --- | --- | --- |
| 1 | relation / `mp-modern-love-relation-app-match`：アプリで知り合い、後から共通の知人の存在に気づいた成人の二人 | incident / `mp-modern-love-incident-rent-decision`：二人の部屋の更新日を前に、片方へ別の町で暮らす仕事の誘いが届く | 暮らす場所を選び直す恋愛劇 |
| 2 | relation / `relation-original-vst3bu`：幼なじみ | incident / `sf-modern-incident-news-correction`：町の店を閉店と伝えた記事に訂正が出るが、転載先には古い見出しが残る | 地域の記事訂正を追う日常の謎 |
| 3 | relation / `relation-new-1xztvua`：共同住宅で暮らす住人たち | incident / `sf-modern-incident-shop-renewal`：商店街の共同倉庫の契約が今月で切れ、更新案に維持費の分担が追加される | 維持費を巡り居住者が交渉する生活劇 |

### mp-modern-love-world-company-town

一つの企業が町の雇用と暮らしを支え、不利な記録が表に出にくい企業城下町

| 例 | 関係性 | 中心事件 | 置ける方向（結末は未確定） |
| --- | --- | --- | --- |
| 1 | relation / `mp-workplace-pro-relation-rebuild-leaver`：傾いた会社を継いだ経営者と、退職を決めた古参社員 | incident / `mp-workplace-pro-incident-closing-letters`：閉鎖予定の支店へ、地域の人々から大量の手紙が届く | 支店と地域との関係を捉え直す再建劇 |
| 2 | relation / `mp-workplace-pro-relation-anonymous-source`：社内広報の担当者と、名前を出されたくない情報提供者 | incident / `mp-workplace-pro-incident-unexplained-data`：新商品の資料に、誰も提供元を説明できないデータが混ざる | 名前を出さない証言の扱いを考える謎 |
| 3 | relation / `mp-workplace-pro-relation-new-leader-team`：新任上司と、前任者の方針を守りたいチーム | incident / `mp-workplace-pro-incident-orphan-project`：部署の統合直前に、引き継ぎ先のない案件が一つ残る | 部署を超えた引き継ぎを探す群像劇 |

### sf-school-world-score-rewrite

進学実績が学校の資金と推薦枠を左右し、成績記録の訂正が難しい学校

| 例 | 関係性 | 中心事件 | 置ける方向（結末は未確定） |
| --- | --- | --- | --- |
| 1 | relation / `sf-school-relation-night-day`：定時制の生徒と、昼の授業の記録を預かる教師 | incident / `sf-school-incident-club-merge`：部員不足で、二つの部に統合の提案が出る | 夜と昼の人々が共同の活動を選ぶ学園劇 |
| 2 | relation / `relation-original-vst3bu`：幼なじみ | incident / `incident-new-a4vkr2`：いつもの通学路に小さな店が開く | 通学と新しい店から関係が変わる日常劇 |
| 3 | relation / `relation-new-1xztvua`：共同住宅で暮らす住人たち | incident / `sf-modern-incident-news-correction`：町の店を閉店と伝えた記事に訂正が出るが、転載先には古い見出しが残る | 学校の外の情報と居住者を追う地域の謎 |

### mp-workplace-pro-world-night-ward

病床と夜勤の人員が削られ続け、現場の裁量に頼る地域の病院

| 例 | 関係性 | 中心事件 | 置ける方向（結末は未確定） |
| --- | --- | --- | --- |
| 1 | relation / `mp-workplace-pro-relation-emergency-leaving`：救急医と、働き方を変えるため病院を辞めたい看護師 | incident / `mp-workplace-pro-incident-unassigned-shift`：夜勤の引き継ぎ記録に、誰が担当したか分からない時間が見つかる | 生活と仕事の境界を見直す職場劇 |
| 2 | relation / `mp-workplace-pro-relation-record-patient`：医療記録を管理する事務員と、記録の食い違いを訴える成人患者 | incident / `mp-workplace-pro-incident-closure-list`：病院の閉鎖日が迫るなか、次の受け入れ先が決まらない患者の一覧が残る | 受け入れ先と本人の選択を考える支援の物語 |
| 3 | relation / `mp-workplace-pro-relation-ex-socialworker`：交際を終えた成人の医師とソーシャルワーカーで、同じ患者への支援を仕事の関係として組み直す二人 | incident / `mp-workplace-pro-incident-unnamed-donations`：診療所を支える寄付の帳簿に、名乗らない支援者の記録が続く | 支援者の記録を追う再会・謎の物語 |

## トーンと背景の目視

暗い候補には、企業依存と不利な記録、数字による評価、警察の人員不足、病床・夜勤人員の削減、成績訂正の難しさ、島外通学の制約、仮設教室の物資不足、軍の用途管理、浸水と地区間の敵対、職人の高齢化を残しています。すべてを相談窓口や透明な合意へ変えていません。

砂漠水路2件は、砂漠・オアシス・王家・魔法、shared-treatyの交易、beast-waterの獣人を本文で確認。王位規則のroyalとdesert-courtテーマも、旧本文で補完した後にそのまま残っています。魔法・精霊の候補の根拠を残し、背景のない宿場や共同住宅へ魔法を新設していません。

残る表現と背景の範囲：school候補の多くは学校でもeducationが空、戦乱・悪役令嬢の王国は王家に触れてもroyalが空です。これは改修前からの定義で、同名の要素を持つ職業・宮廷必須素材を通せない場合があります。本文の連想から背景を足す設計にはせず、タグ再設計は今回混ぜません。season-innのnomadicは精霊の季節移動を根拠とする旧背景で、人間も遊牧するとは断定しません。

| ID | トーン（維持） | 背景（維持） |
| --- | --- | --- |
| `world-original-17jnmz1` | 2,3,4 | 明示背景なし |
| `world-original-1j1khx1` | 2,3,4,5 | 明示背景なし |
| `world-original-1jdjray` | 2,3,4,5 | 王族・宮廷 |
| `world-original-e6zzeq` | 1,2,3,4 | 明示背景なし |
| `world-original-1eprmze` | 2,3,4,5 | 明示背景なし |
| `desert-court-world-shared-treaty` | 1,2,3,4 | 砂漠・オアシス・王族・宮廷・交易・魔法 |
| `romantasy-world-beast-water` | 1,2,3,4 | 獣人・知性ある人外・砂漠・オアシス・王族・宮廷・魔法 |
| `story3-cozy-fantasy-world-last-arcade` | 2,3,4 | 魔法 |
| `story3-cozy-fantasy-world-house-seasons` | 2,3,4 | 明示背景なし |
| `story3-cozy-fantasy-world-repair-winter` | 2,3,4 | 魔法 |
| `story3-cozy-fantasy-world-return-week` | 2,3,4 | 明示背景なし |
| `story3-cozy-fantasy-world-old-tools` | 2,3,4 | 魔法 |
| `story3-cozy-fantasy-world-season-inn` | 3,4 | 移動・遊牧の暮らし・精霊 |
| `r4-limited-cooperation-world-evacuation-pact` | 3,4,5 | 明示背景なし |
| `r4-practical-skill-world-closing-workshop` | 3,4 | 明示背景なし |
| `sf-school-world-school-merge` | 1,2,3,4 | 明示背景なし |
| `sf-school-world-island-last` | 3,4,5 | 明示背景なし |
| `sf-school-world-score-rewrite` | 3,4,5 | 明示背景なし |
| `sf-school-world-shelter-school` | 3,4,5 | 明示背景なし |
| `sf-underworld-world-neutral-diner` | 2,3,4 | 明示背景なし |
| `sf-underworld-world-new-boss` | 3,4 | 明示背景なし |
| `sf-school-world-student-services` | 1,2,3,4 | 明示背景なし |
| `mp-modern-love-world-ex-same-floor` | 2,3,4 | 会社組織 |
| `mp-modern-love-world-company-town` | 3,4,5 | 会社組織 |
| `mp-modern-love-world-share-house` | 1,2,3 | 明示背景なし |
| `mp-modern-love-world-long-distance` | 1,2,3 | 明示背景なし |
| `mp-modern-love-world-wedding-month` | 1,2,3,4 | 明示背景なし |
| `mp-modern-love-world-apps-city` | 2,3,4 | 明示背景なし |
| `mp-workplace-pro-world-sales-floor` | 2,3,4,5 | 会社組織 |
| `mp-workplace-pro-world-joint-station` | 2,3,4,5 | 警察・捜査組織 |
| `mp-workplace-pro-world-night-ward` | 2,3,4,5 | 医療現場 |
| `mp-workplace-pro-world-transfer-cycle` | 2,3,4,5 | 学校・教育現場 |

## 統合・全面書き直しを見送った候補

指示書付録Aの候補群はすべて変更せず残しました。現代日本・地方都市・学校・企業社会、中世／近世／ヴィクトリア朝風、神祇祭祀の里／神に仕える一族、王朝文化の都／和風王朝、言霊／和歌、魔法学校／魔法学院、勇者召喚／国家召喚、聖女の王国／広い世界、ディストピア／管理社会は、規模・時代・文化・役割の違いを残すため統合しません。亡国・魔王討伐後・鬼の封印は歴史的状態、灯台守の家族・引退勇者の町は住民や反復する暮らしとして保持します。小さい研究所・商店街を広い社会へ強制統一せず、毎年の塔の変化や閉門時刻も物語固有の締切とは扱いません。UIの欄、規模フィルタ、内部scale、テーマ、背景、プリセットも追加していません。

## 抽選・候補プールと既存の限界

| 舞台 | T1 | T2 | T3 | T4 | T5 |
| --- | --- | --- | --- | --- | --- |
| modern | 50 | 70 | 87 | 68 | 20 |
| western | 14 | 22 | 22 | 21 | 8 |
| wafu | 10 | 22 | 22 | 20 | 12 |
| fantasy | 66 | 106 | 111 | 95 | 32 |
| isekai | 12 | 17 | 17 | 16 | 5 |
| scifi | 5 | 13 | 23 | 20 | 11 |
| research | 6 | 13 | 20 | 14 | 7 |
| underworld | 3 | 6 | 16 | 14 | 8 |
| school | 10 | 11 | 14 | 11 | 3 |

| 現代の職業背景 | T1 | T2 | T3 | T4 | T5 |
| --- | --- | --- | --- | --- | --- |
| company | 6 | 9 | 10 | 7 | 2 |
| police | 1 | 2 | 2 | 1 | 1 |
| medical | 2 | 3 | 3 | 3 | 1 |
| education | 3 | 4 | 4 | 3 | 1 |

上表は変更前後で完全一致。プリセットは各ケースごとにseed20261006からLCG（1664525 / 1013904223 / 2^32）を開始し、固定なし・未入力から連続20回を試行しました。下表は失敗までの成功回数で、改修前後の候補ID・設定・背景・recent・案内も一致しました。

| プリセット | T1 | T2 | T3 | T4 | T5 |
| --- | --- | --- | --- | --- | --- |
| 現代の恋人 | 20 | 20 | 20 | 20 | 20 |
| 秘密の社内恋愛 | 20 | 20 | 20 | 20 | 20 |
| 仕事と恋愛の両立 | 20 | 20 | 20 | 20 | 20 |
| 警察と事件 | 1 | 20 | 20 | 1 | 1 |
| 教師と学校の仕事 | 20 | 20 | 20 | 20 | 1 |
| 医療と夜勤 | 20 | 20 | 20 | 20 | 1 |
| 会社の再建 | 20 | 20 | 20 | 20 | 20 |

警察T1/T4/T5、教育T5、医療T5は有効world1件のため次の適用で不足になります。最近10件の完全除外ではなく、直前ID／同本文の除外です。失敗時のstate・設定・recentが変わらず説明されることを確認し、トーン緩和・勝手な背景追加・候補追加で隠していません。古い「警察・探偵業界」の背景も変更しません。

## 実行した検証

Node：96件成功（既存88＋今回8）。全249件・32新本文／短語・217未対象・メタデータ・他6カテゴリ・任意素材・質問・辞書・重みを比較。舞台9×トーン5×2方針×3seed×3抽選＝810回を前後比較。35プリセット条件を各20回上限で試し、既存不足5条件を保持。32旧固定world、明示空背景／欠損／custom／legacy、JSON・Repository、履歴、保存・上書き・複製・お気に入り・タグ検索・全件復元、旧／新本文の代表4ID×2版×8AI依頼文を確認。Markdownは保存済み出力を保持し、明示的な作り直し後は現在の本文を使います。

Chrome：72項目成功（既存67＋今回5）、未処理エラー0。今回の画面検証は旧5fixture読み込み、固定再抽選と解除、明示的な新world抽選、undo/redo、出力再生成、8AIコピー、JSON／Markdown、保存／上書き／別名／複製／お気に入り／タグ検索／全件取り込みと再読込、360/390/430pxの世界観カード・編集・出力を確認しました。世界観の説明は指定の1文、操作欄は増えていません。実機iPhone／Safari、外部AIの応答は未検証。公開サイトとCIは公開コミットで別途確認します。

検証データ：world-restructure-audit.json、Node／Chromeログ、old-world.json／old-world.md／old-world-full-backup.json、world-card-mobile.png。
