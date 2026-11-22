// Immutable original-equation collision IDs, source-grounded in the archived
// original Maths V3.1 question/answer PDFs, not authored template metadata.
// This guards diagnostic diversity only; it NEVER marks a question approved.
// See qa-staging/math-v311-simultaneous-original-system-collisions-20261122.json.
export const VERIFIED_MATHS_SYSTEM_COLLISIONS = Object.freeze([
  {
    "sameSystemKey": "2x+3y=7__3x-2y=4",
    "ids": [
      "LUX-MATH-Y9-SIMULTANEOUS-001",
      "LUX-MATH-Y9-SIMULTANEOUS-009",
      "LUX-MATH-Y9-SIMULTANEOUS-029"
    ]
  },
  {
    "sameSystemKey": "3x+4y=17__4x-3y=6",
    "ids": [
      "LUX-MATH-Y9-SIMULTANEOUS-002",
      "LUX-MATH-Y9-SIMULTANEOUS-010"
    ]
  },
  {
    "sameSystemKey": "4x+5y=31__5x-4y=8",
    "ids": [
      "LUX-MATH-Y9-SIMULTANEOUS-003",
      "LUX-MATH-Y9-SIMULTANEOUS-011"
    ]
  },
  {
    "sameSystemKey": "5x+6y=49__6x-5y=10",
    "ids": [
      "LUX-MATH-Y9-SIMULTANEOUS-004",
      "LUX-MATH-Y9-SIMULTANEOUS-012"
    ]
  }
].map(group=>Object.freeze({
  sameSystemKey:group.sameSystemKey,ids:Object.freeze(group.ids)
})));
const BY_SOURCE_ID=new Map();
for(const group of VERIFIED_MATHS_SYSTEM_COLLISIONS){
  for(const id of group.ids){
    if(BY_SOURCE_ID.has(id))throw new Error('duplicate QA original ID '+id);
    BY_SOURCE_ID.set(id,group.sameSystemKey);
  }
}
export const verifiedSourceSystemKeyForMathsId=id=>BY_SOURCE_ID.get(id)||null;
