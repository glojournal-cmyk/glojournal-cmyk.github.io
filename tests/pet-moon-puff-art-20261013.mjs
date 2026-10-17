import fs from "node:fs";
import assert from "node:assert/strict";

const artRoot = "pet/art-moon-puff-20261013";
const moduleText = fs.readFileSync("pet/pet-art-hd-20261009.js", "utf8");
const petText = fs.readFileSync("pet/pet.js", "utf8");
const homeText = fs.readFileSync("pet/home-pet.js", "utf8");
const homePage = fs.readFileSync("index.html", "utf8");
const fallbackPage = fs.readFileSync("404.html", "utf8");
assert.equal(homePage, fallbackPage, "Home and recovery page must have identical scripts");
assert.match(moduleText, /safe==='moon-puff' && stage>=5/);
assert.match(moduleText, /art-moon-puff-20261013/);
assert.match(petText, /Celestial Moon Guardian/);
assert.match(homeText, /20261017-moss-fullbody1/); // Latest Home cache version; Moon Puff sprite route is verified separately.

for (let level = 5; level <= 10; level++) {
  const file = `${artRoot}/level-${level}.png`;
  const img = fs.readFileSync(file);
  assert.ok(img.length > 50000, `LV${level} artwork too small`);
  assert.equal(img.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `LV${level} is not PNG`);
  const w = img.readUInt32BE(16);
  const h = img.readUInt32BE(20);
  const colorType = img[25];
  assert.ok(w >= 700 && h >= 700, `LV${level} resolution ${w}x${h} too small`);
  assert.ok(colorType === 6 || colorType === 4, `LV${level} must contain an alpha channel: ${colorType}`);
  console.log(`Moon Puff LV${level}: transparent PNG ${w}x${h}, ${img.length} bytes`);
}
console.log("Moon Puff LV5-LV10 full-body art references and transparency QA passed");
