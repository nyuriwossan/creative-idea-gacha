export const BACKUP_STATUS_KEY='creativeIdeaGacha_backupStatus';
export function worksFingerprint(works){
 const text=JSON.stringify(works.map(({updatedAt,...work})=>work));
 let a=2166136261,b=5381;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}
 return `${text.length}:${a>>>0}:${b>>>0}`;
}
export class BackupStatus {
 constructor(storage,works){
  this.storage=storage;this.warning='';this.dismissedChanges=0;
  this.meta={current:worksFingerprint(works),exported:null,lastExportAt:null,changes:0};
  try{const raw=JSON.parse(storage.getItem(BACKUP_STATUS_KEY)||'null');if(raw&&typeof raw.current==='string'&&raw.current.length<100&&Number.isSafeInteger(raw.changes)&&raw.changes>=0&&(raw.exported===null||typeof raw.exported==='string'&&raw.exported.length<100)&&(raw.lastExportAt===null||typeof raw.lastExportAt==='string'&&raw.lastExportAt.length<50&&Number.isFinite(Date.parse(raw.lastExportAt))))this.meta=raw;}catch{}
  this.observe(works);
 }
 persist(){try{this.storage.setItem(BACKUP_STATUS_KEY,JSON.stringify(this.meta));this.warning='';}catch{this.warning='書き出し状況を端末に記録できませんでした。作品の保存結果とは別の案内です。';}}
 observe(works){const current=worksFingerprint(works);if(current===this.meta.current)return;this.meta={...this.meta,current,changes:this.meta.changes+1};this.persist();}
 exported(works,now=new Date().toISOString()){const current=worksFingerprint(works);this.meta={current,exported:current,lastExportAt:now,changes:0};this.dismissedChanges=0;this.persist();}
 dismiss(){this.dismissedChanges=this.meta.changes;}
 get changed(){return this.meta.exported!==null&&this.meta.current!==this.meta.exported;}
 get shouldPrompt(){return this.meta.changes>=this.dismissedChanges+5&&this.meta.current!==this.meta.exported;}
}
