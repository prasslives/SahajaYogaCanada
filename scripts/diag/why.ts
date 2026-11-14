import { NEW_DELHI, windowOn, tithiAt, tithiName, sunriseOn, lunationsBetween } from '../../src/lib/panchang';
import { formatInTimeZone } from 'date-fns-tz';
const IST='Asia/Kolkata'; const f=(d:Date)=>formatInTimeZone(d,IST,'MM-dd HH:mm');
const lun = lunationsBetween(new Date('2026-01-01'), new Date('2026-12-31'));

for (const [date, w] of [['2026-03-18','madhyahna'],['2026-03-19','madhyahna'],['2026-03-20','madhyahna'],
                          ['2026-10-18','sunrise'],['2026-10-19','sunrise'],
                          ['2026-03-02','pradosh'],['2026-03-03','pradosh']] as const) {
  const win = windowOn(NEW_DELHI, date, w as any)!;
  const mid = new Date((win.start.getTime()+win.end.getTime())/2);
  const l = lun.find(x=>mid>=x.start && mid<x.end)!;
  const sr = sunriseOn(NEW_DELHI, date)!;
  const lsr = lun.find(x=>sr>=x.start && sr<x.end)!;
  console.log(`${date} ${w.padEnd(9)} window ${f(win.start)}-${f(win.end)}  tithi@mid=${tithiAt(mid)} ${tithiName(tithiAt(mid)).padEnd(20)} month@mid=${l.month.padEnd(11)} month@sunrise=${lsr.month}`);
}
