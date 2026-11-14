import * as A from 'astronomy-engine';
import { NEW_DELHI, sunriseOn, tithiAt, tithiName } from '../../src/lib/panchang';
import { formatInTimeZone } from 'date-fns-tz';

function tithiStart(tithi: number, near: Date): Date {
  const target = ((tithi - 1) * 12) % 360;
  return A.SearchMoonPhase(target, new Date(near.getTime() - 20 * 86400000), 40)!.date;
}
const IST = 'Asia/Kolkata';
const fmt = (d: Date) => formatInTimeZone(d, IST, 'yyyy-MM-dd HH:mm') + ' IST';

const windows: Array<[string, string[], number[]]> = [
  ['Dussehra window', ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'], [8, 9, 10, 11]],
  ['Diwali window', ['2026-11-07', '2026-11-08', '2026-11-09'], [29, 30, 1]],
  ['Akshaya Tritiya', ['2026-04-18', '2026-04-19', '2026-04-20'], [2, 3, 4]],
  ['Ugadi window', ['2026-03-18', '2026-03-19', '2026-03-20'], [30, 1, 2]],
];

for (const [label, dates, tithis] of windows) {
  console.log(`--- ${label} ---`);
  for (const t of tithis) {
    const s = tithiStart(t, new Date(dates[1] + 'T00:00:00Z'));
    console.log(`  tithi ${String(t).padStart(2)} ${tithiName(t).padEnd(22)} starts ${fmt(s)}`);
  }
  for (const d of dates) {
    const sr = sunriseOn(NEW_DELHI, d)!;
    console.log(`  sunrise ${d} = ${fmt(sr)}  -> tithi ${tithiAt(sr)} ${tithiName(tithiAt(sr))}`);
  }
  console.log();
}
