import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync(new URL("../pet/pet.js",import.meta.url),"utf8");
assert(source.includes("window.__luxPetReadFailed=true"),"corrupt wallet must be flagged");
assert(source.includes("if(window.__luxPetReadFailed) throw"),"writes must be blocked after corrupt read");
assert(source.includes("localStorage.getItem(PET_KEY)!==encoded"),"writes must be verified");
assert(source.includes("if(!newlyUnlocked.length){window.__luxPetUnlockSaveFailed=false"),"clear stale unlock error");
assert(source.includes("catch(error){\n    window.__luxPetUnlockSaveFailed=true"),"failed unlock must be reported");
console.log("PASS: wallet defensive write and unlock checks");
