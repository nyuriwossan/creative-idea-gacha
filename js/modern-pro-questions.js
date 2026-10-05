// 元の文字列質問へ挿入せず、末尾へ明示IDで追加する。
const define=(category,slug,text,context=[],love=false)=>({id:`mp-question-${category}-${slug}`,text,requiresContext:context,themeTags:['workplace-pro',...(love?['modern-love']:[])]});
export const MODERN_PRO_QUESTIONS={
 world:[define('world','office-duty','この会社で、担当者が結果を説明する相手は誰だろう。',['company']),define('world','public-record','この捜査組織で、記録を公開できる範囲は誰が決めるのだろう。',['police']),define('world','school-time','この学校で、授業と校務と休息の時間はどう分けられているだろう。',['education'])],
 character:[define('character','shift-life','仕事をする設定なら、この人物の勤務時間は親しい人との生活をどう変えているだろう。',[],true),define('character','private-secret','仕事をする設定なら、親しい相手にも話せない仕事の情報は何だろう。',[],true),define('character','care-boundary','この医療者が引き受ける責任と、本人や家族が選ぶことの境界はどこだろう。',['medical'])],
 plot:[define('plot','waiting-third','二人で仕事上の判断をする設定なら、その判断を待っている第三者は誰だろう。'),define('plot','leave-change','仕事をする設定なら、辞める・続ける・やり方を変えることで誰の生活が変わるだろう。'),define('plot','couple-career','恋人がいる設定なら、仕事上の立場や勤務時間を二人はどう相談できるだろう。',[],true)],
 consistency:[define('consistency','rules-values','職場がある設定なら、主人公が正しいと思うことと職場で求められる判断は一致しているだろうか。'),define('consistency','evaluation-fair','この会社で、同じ成果を出した人が同じように評価される仕組みはあるだろうか。',['company']),define('consistency','record-followup','医療記録に食い違いが見つかったあと、誰が影響を確かめて本人へ説明するのだろう。',['medical'])]
};
