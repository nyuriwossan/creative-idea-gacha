// 画面上部の設定要約チップ。表示用の文字列だけを作る純粋関数（DOM・保存形式には触れない）。
import {stageLabel} from './stage-selection.js';
import {TONES} from './data.js';

export function themeSummary(themes=[]){return themes.length?`${themes.length}個`:'お任せ';}

export function settingsChips(state){
 const settings=state.settings;
 return [
  {key:'stage',label:'舞台',value:stageLabel(settings)||'すべて'},
  {key:'tone',label:'トーン',value:TONES[settings.tone-1]||''},
  {key:'purpose',label:'出力用途',value:settings.purpose},
  {key:'themes',label:'好み',value:themeSummary(settings.themes)}
 ];
}

// 設定ボタンの読み上げ用。チップの見た目と同じ内容を一文にまとめる。
export function settingsChipsLabel(chips){return `設定を開く（${chips.map(c=>`${c.label}：${c.value}`).join('、')}）`;}
