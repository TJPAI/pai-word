// Read-only preflight for lightweight-home statistics.
// Do not synthesize due/reinforcement counts from incomplete KU metadata.
const DAILY_ALLOWED=new Set([25,50,100,200]);
const ROUND_ALLOWED=new Set([10,25,50]);
export function inspectHomeBudget(state,{now=new Date(),validKU=null,authoritativeDue=null}={}){
 if(!state||typeof state!=='object')throw Error('HOME_STATE_REQUIRED');
 const newPerDay=Number(state.newPerDay),wordsPerRound=Number(state.wordsPerRound);
 const dailyLimit=DAILY_ALLOWED.has(newPerDay)?newPerDay:50;
 const roundLimit=ROUND_ALLOWED.has(wordsPerRound)?wordsPerRound:10;
 const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const progress=state.dailyNewProgress;
 const completed=progress?.date===date?
  (Array.isArray(progress.newWordsCompleted)?progress.newWordsCompleted:Array.isArray(progress.completed)?progress.completed:[]):[];
 const dailyCompleted=completed.length;
 const d=state.daily;
 const reinforcementQuota=Math.max(3,Math.round(dailyLimit*.30));
 const assignedValid=!!(validKU instanceof Set&&d?.date===date&&d.wordQuota===dailyLimit&&d.reinforcementQuota===reinforcementQuota&&d.lexiconLimit===20000&&d.policy==='selected-scene-words-v3'&&d.scene===(state.selectedScene||'daily')&&d.assigned&&Array.isArray(d.reinforcementKeys));
 const reinforcementRemaining=assignedValid?d.reinforcementKeys.filter(k=>validKU.has(k)&&!state.records?.[k]).length:null;
 const due=Number.isInteger(authoritativeDue)&&authoritativeDue>=0?authoritativeDue:null;
 return {
  dailyLimit,dailyCompleted,dailyRemaining:Math.max(0,dailyLimit-dailyCompleted),roundLimit,
  reinforcementRemaining,due,
  complete:reinforcementRemaining!==null&&due!==null,
  missing:[...(reinforcementRemaining===null?['reinforcement']:[]),...(due===null?['due']:[])],
  date
 };
}
