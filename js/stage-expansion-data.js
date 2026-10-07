// 新3組だけの橋渡し素材。単独舞台・既存3組には追加しない。
export const STAGE_EXPANSION_ROWS=[
  {
    "key": "world",
    "id": "sm-modern-fantasy-world-transit",
    "text": "電車の路線と魔法の転移路を同じ通勤定期で使え、駅員が両方の乗り継ぎを案内する現代の都市",
    "titleWord": "二つの通勤路",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "journey"
    ],
    "contextTags": [
      "magic"
    ],
    "requiresContext": [],
    "topicTags": [
      "negotiation",
      "craft"
    ],
    "plotLinks": [
      "sm-mf-transit"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-modern-fantasy-world-apartment",
    "text": "賃貸住宅の住人が電気設備と魔法の灯りを共同で管理し、更新費用を管理組合で話し合う現代の街",
    "titleWord": "魔法のある集合住宅",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "found-family",
      "daily-work"
    ],
    "contextTags": [
      "magic"
    ],
    "requiresContext": [],
    "topicTags": [
      "shared-home",
      "resource-fairness"
    ],
    "plotLinks": [
      "sm-mf-housing"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-modern-fantasy-world-outage",
    "text": "電力と魔法の供給網が同時に途切れ、病院や住宅への復旧順を行政と術師が決める現代都市",
    "titleWord": "二つの供給網の断絶",
    "tones": [
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "buddy"
    ],
    "contextTags": [
      "magic"
    ],
    "requiresContext": [],
    "topicTags": [
      "resource-fairness",
      "mutual-aid"
    ],
    "plotLinks": [
      "sm-mf-supply"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "genre",
    "id": "sm-modern-fantasy-genre-civic",
    "text": "現代の公共サービスを、機械と魔法の両方で支える人々の仕事の物語",
    "titleWord": "機械と魔法の仕事",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "practical-skill"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "craft",
      "negotiation"
    ],
    "plotLinks": [],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "relation",
    "id": "sm-modern-fantasy-relation-repair",
    "text": "賃貸住宅の設備担当者と、電気配線を傷めず魔法の灯りを取り付けたい術師",
    "titleWord": "設備担当者と術師",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "buddy",
      "daily-work"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "craft",
      "negotiation"
    ],
    "plotLinks": [
      "sm-mf-housing"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix",
    "relationShape": "pair"
  },
  {
    "key": "relation",
    "id": "sm-modern-fantasy-relation-dispatch",
    "text": "現代都市の復旧担当者と、魔法の供給を止めてでも安全を確かめたい術師",
    "titleWord": "復旧と術式の点検",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "buddy",
      "rescue"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "mutual-aid",
      "resource-fairness"
    ],
    "plotLinks": [
      "sm-mf-supply"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix",
    "relationShape": "pair"
  },
  {
    "key": "incident",
    "id": "sm-modern-fantasy-incident-pass",
    "text": "通勤定期の更新日に転移路だけが使えず、駅員と術師が乗車記録を照合する",
    "titleWord": "定期と転移路",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "mystery",
      "daily-work"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "record-conflict",
      "negotiation"
    ],
    "plotLinks": [
      "sm-mf-transit"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "incident",
    "id": "sm-modern-fantasy-incident-restore",
    "text": "停電後の魔法供給を再開する条件が、病院への電力復旧と食い違う",
    "titleWord": "食い違う復旧条件",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "buddy"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "resource-fairness",
      "negotiation"
    ],
    "plotLinks": [
      "sm-mf-supply"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "conflict",
    "id": "sm-modern-fantasy-conflict-cost",
    "text": "住人へ魔法の灯りを残したいが、賃貸住宅の共益費だけでは術式の更新費を払えない",
    "titleWord": "灯りと共益費",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "limited-cooperation"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "resource-fairness",
      "contract"
    ],
    "plotLinks": [
      "sm-mf-housing"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "conflict",
    "id": "sm-modern-fantasy-conflict-restart",
    "text": "現代都市の停電を早く直したいが、送電を再開すると未点検の魔法供給網も動いてしまう",
    "titleWord": "送電と術式点検",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "buddy"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "mutual-aid",
      "resource-fairness"
    ],
    "plotLinks": [
      "sm-mf-supply"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "gimmick",
    "id": "sm-modern-fantasy-gimmick-inspection",
    "text": "電気設備と魔法の術式を別々の担当が点検し、両者の確認が揃ってから再開する手順",
    "titleWord": "二つの点検記録",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "practical-skill",
      "buddy"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-mf-supply"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "twist",
    "id": "sm-modern-fantasy-twist-separate",
    "text": "止まっていたのは魔法そのものではなく、送電再開と術式再開を一度に扱う制御だった。別々に点検すれば復旧する区画を選べる",
    "titleWord": "分けられる再開手順",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "modern",
      "fantasy"
    ],
    "themeTags": [
      "practical-skill",
      "rescue"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "record-conflict",
      "resource-fairness"
    ],
    "plotLinks": [
      "sm-mf-supply"
    ],
    "blendPairs": [
      "modern+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-wafu-fantasy-world-inn",
    "text": "街道の宿場で人と精霊が同じ旅籠に泊まり、帳場が客ごとに異なる灯りや結界を用意する和風の国",
    "titleWord": "精霊も泊まる旅籠",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "myth"
    ],
    "contextTags": [
      "magic"
    ],
    "requiresContext": [],
    "topicTags": [
      "shared-home",
      "craft"
    ],
    "plotLinks": [
      "sm-wf-inn"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-wafu-fantasy-world-festival",
    "text": "町ごとの祭りで妖が結界を張り、氏子が参道や水路の手入れを分担する和風の里",
    "titleWord": "妖と氏子の祭り",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "myth",
      "daily-work"
    ],
    "contextTags": [
      "magic"
    ],
    "requiresContext": [],
    "topicTags": [
      "mutual-aid",
      "negotiation"
    ],
    "plotLinks": [
      "sm-wf-festival"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-wafu-fantasy-world-boundary",
    "text": "社の結界が弱まり、街道沿いの村々が妖と人の避難先を古い寄合の取り決めで調整する和風の土地",
    "titleWord": "結界と村の寄合",
    "tones": [
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "myth"
    ],
    "contextTags": [
      "magic"
    ],
    "requiresContext": [],
    "topicTags": [
      "resource-fairness",
      "return-home"
    ],
    "plotLinks": [
      "sm-wf-boundary"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "genre",
    "id": "sm-wafu-fantasy-genre-custom",
    "text": "宿場や社の暮らしを支える人と妖が、古い取り決めを結び直す和風の生活幻想譚",
    "titleWord": "社と宿場の生活幻想",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "myth",
      "daily-work"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "contract",
      "mutual-aid"
    ],
    "plotLinks": [],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "relation",
    "id": "sm-wafu-fantasy-relation-keeper",
    "text": "街道の旅籠の帳場係と、人とは休む時刻の異なる精霊の客",
    "titleWord": "帳場係と精霊の客",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "myth"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "shared-home",
      "negotiation"
    ],
    "plotLinks": [
      "sm-wf-inn"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix",
    "relationShape": "pair"
  },
  {
    "key": "relation",
    "id": "sm-wafu-fantasy-relation-delegate",
    "text": "村の寄合で避難先を探す世話役と、社の結界を離れるか迷う妖",
    "titleWord": "寄合の世話役と妖",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "myth"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "return-home",
      "negotiation"
    ],
    "plotLinks": [
      "sm-wf-boundary"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix",
    "relationShape": "pair"
  },
  {
    "key": "incident",
    "id": "sm-wafu-fantasy-incident-festival-water",
    "text": "祭りの支度の日に、妖の結界を支える水が参道の清掃に使う水と競合する",
    "titleWord": "祭りの二つの水",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "myth"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "resource-fairness",
      "negotiation"
    ],
    "plotLinks": [
      "sm-wf-festival"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "incident",
    "id": "sm-wafu-fantasy-incident-route",
    "text": "社の結界が途切れ、古い街道の道しるべを人と妖が別々の避難先へ読んでしまう",
    "titleWord": "道しるべと避難先",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "myth"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "record-conflict",
      "return-home"
    ],
    "plotLinks": [
      "sm-wf-boundary"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "conflict",
    "id": "sm-wafu-fantasy-conflict-quiet",
    "text": "旅籠の客を静かに休ませたいが、精霊の灯りを消すと街道を戻る客への目印も消える",
    "titleWord": "旅籠の休みと灯り",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "daily-work",
      "myth"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "shared-home",
      "mutual-aid"
    ],
    "plotLinks": [
      "sm-wf-inn"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "conflict",
    "id": "sm-wafu-fantasy-conflict-boundary-land",
    "text": "妖を新しい避難先へ迎えたいが、社の結界を移すには村の共有地の使い方を変えなければならない",
    "titleWord": "共有地と移す結界",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "rescue",
      "limited-cooperation"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "resource-fairness",
      "contract"
    ],
    "plotLinks": [
      "sm-wf-boundary"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "gimmick",
    "id": "sm-wafu-fantasy-gimmick-marks",
    "text": "街道の道しるべに人が読む墨書と妖が読む術の印を併記し、宿場で両方を照合する習慣",
    "titleWord": "墨書と術の道しるべ",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "myth",
      "practical-skill"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-wf-boundary"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "twist",
    "id": "sm-wafu-fantasy-twist-path",
    "text": "道しるべの墨書と術の印は、別々の避難先ではなく人と妖で歩ける道が異なるための案内だった",
    "titleWord": "異なる道の同じ行き先",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "wafu",
      "fantasy"
    ],
    "themeTags": [
      "myth",
      "rescue"
    ],
    "contextTags": [],
    "requiresContext": [
      "magic"
    ],
    "topicTags": [
      "record-conflict",
      "return-home"
    ],
    "plotLinks": [
      "sm-wf-boundary"
    ],
    "blendPairs": [
      "wafu+fantasy"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-scifi-research-world-orbital",
    "text": "軌道上の研究施設でAIが実験装置を操作し、研究員が地上へ送る観測記録を検証する社会",
    "titleWord": "軌道施設の実験記録",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "practical-skill",
      "archive-mystery"
    ],
    "contextTags": [
      "artificial-intelligence"
    ],
    "requiresContext": [],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-sr-record"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-scifi-research-world-open",
    "text": "市民がAI制御の実験設備を予約でき、研究員と一緒に仮説を確かめる公開研究施設がある都市",
    "titleWord": "AI設備の公開研究室",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "buddy",
      "practical-skill"
    ],
    "contextTags": [
      "artificial-intelligence"
    ],
    "requiresContext": [],
    "topicTags": [
      "craft",
      "mutual-aid"
    ],
    "plotLinks": [
      "sm-sr-open"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "world",
    "id": "sm-scifi-research-world-closure",
    "text": "AI制御の生命維持装置に異常が起きた軌道研究施設で、研究員が実験の中断と帰還の順序を検討する社会",
    "titleWord": "帰還を検討する軌道施設",
    "tones": [
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "rescue",
      "archive-mystery"
    ],
    "contextTags": [
      "artificial-intelligence"
    ],
    "requiresContext": [],
    "topicTags": [
      "resource-fairness",
      "return-home"
    ],
    "plotLinks": [
      "sm-sr-return"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "genre",
    "id": "sm-scifi-research-genre-verification",
    "text": "AIによる実験の結果を、人が再現と検証で問い直すSFの研究室ミステリー",
    "titleWord": "AI実験の検証劇",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "mystery",
      "practical-skill"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "relation",
    "id": "sm-scifi-research-relation-operator",
    "text": "AI制御の実験装置を使う研究員と、結果より測定方法の確認を優先する検証担当者",
    "titleWord": "AI実験と測定の検証",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "buddy",
      "practical-skill"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-sr-record"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix",
    "relationShape": "pair"
  },
  {
    "key": "relation",
    "id": "sm-scifi-research-relation-return",
    "text": "軌道施設から研究員を帰還させたい管制担当者と、AIの実験記録を失う前に検証したい研究員",
    "titleWord": "帰還管制と実験の検証",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "rescue",
      "archive-mystery"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "return-home",
      "record-conflict"
    ],
    "plotLinks": [
      "sm-sr-return"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix",
    "relationShape": "pair"
  },
  {
    "key": "incident",
    "id": "sm-scifi-research-incident-result",
    "text": "公開研究施設のAI実験で同じ手順から異なる結果が出て、市民と研究員が条件を調べ直す",
    "titleWord": "再現しないAI実験",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "mystery",
      "practical-skill"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-sr-open"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "incident",
    "id": "sm-scifi-research-incident-log",
    "text": "軌道施設の帰還予定が早まり、AIの生データを検証する前に実験設備を止める必要が生じる",
    "titleWord": "帰還前の未検証データ",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "rescue",
      "archive-mystery"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "return-home",
      "record-conflict"
    ],
    "plotLinks": [
      "sm-sr-return"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "conflict",
    "id": "sm-scifi-research-conflict-reproduce",
    "text": "AI実験の発見を早く発表したいが、公開研究施設で人が再現できる手順をまだ確かめていない",
    "titleWord": "発見と再現手順",
    "tones": [
      1,
      2,
      3,
      4
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "practical-skill",
      "mystery"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-sr-open"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "conflict",
    "id": "sm-scifi-research-conflict-data",
    "text": "軌道施設の研究員を帰還させたいが、AIの生データを持ち帰るには実験の検証時間を削る必要がある",
    "titleWord": "帰還と検証時間",
    "tones": [
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "rescue",
      "archive-mystery"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "return-home",
      "record-conflict"
    ],
    "plotLinks": [
      "sm-sr-return"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "gimmick",
    "id": "sm-scifi-research-gimmick-raw",
    "text": "AIの実験結果と測定装置の生データを別々に保存し、人が再検証できるようにする記録方式",
    "titleWord": "AI結果と生データ",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "practical-skill",
      "archive-mystery"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-sr-record"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  },
  {
    "key": "twist",
    "id": "sm-scifi-research-twist-calibration",
    "text": "AIの実験結果の食い違いは仮説の違いではなく、測定装置の校正時刻のずれだった。生データを照合すれば条件を揃えて検証し直せる",
    "titleWord": "校正時刻のずれ",
    "tones": [
      1,
      2,
      3,
      4,
      5
    ],
    "stageTags": [
      "scifi",
      "research"
    ],
    "themeTags": [
      "practical-skill",
      "mystery"
    ],
    "contextTags": [],
    "requiresContext": [
      "artificial-intelligence"
    ],
    "topicTags": [
      "record-conflict",
      "craft"
    ],
    "plotLinks": [
      "sm-sr-record"
    ],
    "blendPairs": [
      "scifi+research"
    ],
    "source": "generated",
    "origin": "stage-mix"
  }
];
