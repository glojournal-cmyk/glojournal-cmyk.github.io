import assert from 'node:assert/strict';
import {gardenSceneForDate,londonGardenWeek} from '../assets/garden-weekly-rotation-20261021.js';
const check=(iso,expected)=>{
 const day=new Date(iso);
 assert.equal(gardenSceneForDate(day).id,expected,`Wrong scene for ${iso}`);
};
check('2026-10-19T00:01:00+01:00','classic');
check('2026-10-25T23:50:00Z','blossom'); // Monday after UK BST ends
check('2026-10-26T00:01:00Z','blossom');
check('2026-11-02T12:00:00Z','autumn');
check('2026-11-09T12:00:00Z','twilight');
check('2026-11-16T12:00:00Z','classic');
check('2027-03-29T00:01:00+01:00',gardenSceneForDate(new Date('2027-03-29T00:01:00+01:00')).id);
assert.equal(londonGardenWeek(new Date('2026-10-19T09:00:00+01:00')),0);
console.log('Garden Monday Europe/London rotation checks passed');
