/* Weekly Garden scenery selection — Europe/London Monday boundary.
 * The four selected backgrounds remain decorative only. Never changes saved
 * scholar state, watering eligibility, XP, Basil or collectibles.
 */
export const GARDEN_WEEKLY_SCENES = Object.freeze([
 {id:'classic',name:'Classic Garden',url:'/assets/garden-weekly/classic.webp'},
 {id:'blossom',name:'Cherry Blossom Garden',url:'/assets/garden-weekly/blossom.webp'},
 {id:'autumn',name:'Autumn Garden',url:'/assets/garden-weekly/autumn.webp'},
 {id:'twilight',name:'Twilight Garden',url:'/assets/garden-weekly/twilight.webp'}
]);
const WEEK_MS=7*24*60*60*1000;
const ANCHOR_MONDAY=Date.UTC(2026,9,19);
export function londonGardenWeek(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(date);
 const pick=t=>Number(parts.find(p=>p.type===t)?.value);
 const today=Date.UTC(pick('year'),pick('month')-1,pick('day'));
 const weekday=new Date(today).getUTCDay();
 const monday=today-((weekday+6)%7)*24*60*60*1000;
 return Math.floor((monday-ANCHOR_MONDAY)/WEEK_MS);
}
export function gardenSceneForDate(date=new Date()){
 const n=londonGardenWeek(date);
 return GARDEN_WEEKLY_SCENES[((n%4)+4)%4];
}
