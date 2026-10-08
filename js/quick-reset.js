// 画面上部の「ロック解除」「テーマ解除」。設定シート内の同名ボタンと同じ処理を使う（DOM には触れない）。
// 解除は解除だけ：素材の再抽選・本文・回答・名前・メモ・舞台・トーン・用途には触れない。
import {updateSettings} from './core.js';

// 基本7・人物・進行・入口の固定と、全区分（画面に出ていない区分も含む）の質問固定を数える。
export function lockCount(state){
 const items=Object.values(state.locks||{}).filter(Boolean).length;
 const questions=Object.values(state.questions||{}).reduce((n,slots)=>n+(slots||[]).filter(slot=>slot?.locked).length,0);
 return items+questions;
}
export function themeCount(state){return (state.settings?.themes||[]).length;}

export function unlockAll(draft){
 for(const key of Object.keys(draft.locks))draft.locks[key]=false;
 for(const slots of Object.values(draft.questions))for(const slot of slots)slot.locked=false;
}
export function clearThemes(draft){updateSettings(draft,{themes:[]});}

export const UNLOCK_NOTICE='ロックを解除しました。本文と回答は残っています。';
export const CLEAR_THEMES_NOTICE='テーマの選択を解除しました。';

// 上部ボタンの表示用。件数は読み上げにだけ含め、見た目は短いラベルのままにする。
export function quickResetView(state){
 const locks=lockCount(state),themes=themeCount(state);
 return {
  unlock:{disabled:locks===0,label:locks?`すべてのロックを解除する（${locks}件固定中。本文と回答は残ります）`:'ロック解除（固定中の項目はありません）'},
  themes:{disabled:themes===0,label:themes?`テーマの選択を解除してお任せに戻す（${themes}個選択中）`:'テーマ解除（選択中のテーマはありません）'}
 };
}
