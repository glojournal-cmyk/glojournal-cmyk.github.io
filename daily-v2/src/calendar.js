/* Daily V2 strict calendar validation. Calendar keys are local YYYY-MM-DD dates;
 * UTC noon is used only for stable civil-day arithmetic, never a timezone conversion.
 * Reject Date.parse rollover (e.g. 2026-02-30 -> March 2) before any planning or save.
 */
export function isValidDailyV2Day(day){
 if(typeof day!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(day))return false;
 const date=new Date(day+'T12:00:00.000Z');
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===day;
}
