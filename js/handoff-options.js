export const HANDOFF_PURPOSES=[['story','物語・プロットを作る'],['chat','AIチャットの設定を作る'],['brainstorm','壁打ち・深掘り相談'],['setting','設定資料にまとめる']];
export const defaultHandoff=()=>({purpose:null,length:'simple',preserveAll:true,suggestMissing:true,includeNotes:false,userRole:'unspecified',aiRole:'unspecified',userRoleText:'',extraRequest:''});
export function validateHandoff(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('AIへの依頼設定が不正です。');
 const value={...defaultHandoff()};
 for(const key of Object.keys(value))if(Object.hasOwn(raw,key))value[key]=raw[key];
 for(const [key,choices] of Object.entries({purpose:[null,...HANDOFF_PURPOSES.map(([k])=>k)],length:['simple','detail'],userRole:['unspecified','protagonist','counterpart','other'],aiRole:['unspecified','protagonist','counterpart','ensemble']}))if(!choices.includes(value[key]))throw new Error('AIへの依頼設定の選択値が不正です。');
 for(const key of ['preserveAll','suggestMissing','includeNotes'])if(typeof value[key]!=='boolean')throw new Error('AIへの依頼設定のチェック値が不正です。');
 for(const [key,max] of [['userRoleText',100],['extraRequest',2000]])if(typeof value[key]!=='string'||value[key].length>max)throw new Error(key==='userRoleText'?'その他の役割は100文字までです。':'追加条件は2,000文字までです。');
 if(['protagonist','counterpart'].includes(value.userRole)&&value.userRole===value.aiRole)throw new Error('同じ人物をユーザーとAIの両方には指定できません。役割を選び直してください。');
 return value;
}
