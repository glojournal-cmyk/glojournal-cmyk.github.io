// A route's explicit school year belongs to the session. The year selector
// may still be on Year 8 when Home opens a locked Year 9 assignment.
export function practiceSessionYear(search, fallbackYear=9) {
  const value=Number(new URLSearchParams(search).get('year'));
  return value===8||value===9?value:Number(fallbackYear)||9;
}
