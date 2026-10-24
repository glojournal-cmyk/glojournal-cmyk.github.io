import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/journey-navigation-20261004.js',import.meta.url),'utf8');
test('iPad Safari non-ISO locale output does not cause Home date mismatch',()=>{
 const NativeIntl=Intl;
 const mockedIntl={DateTimeFormat:class{
   constructor(locale,options){this.native=new NativeIntl.DateTimeFormat(locale,options)}
   format(){return '24/10/2026'} // A valid locale-specific Safari output, NOT an ISO date
   formatToParts(date){return this.native.formatToParts(date)}
 }};
 const context=vm.createContext({Intl:mockedIntl,Date,URL,URLSearchParams,
   localStorage:{getItem:()=>null}});
 vm.runInContext(source,context);
 assert.equal(context.LuxJourney.day(new Date('2026-10-24T17:00:00Z').getTime()),'2026-10-24');
 assert.equal(context.LuxJourney.day(new Date('2026-10-24T23:30:00Z').getTime()),'2026-10-25');
 assert.match(context.LuxJourney.day(),/^\d{4}-\d{2}-\d{2}$/);
});
