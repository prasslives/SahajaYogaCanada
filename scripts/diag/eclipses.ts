import { eclipsesBetween } from '../../src/lib/eclipses';
import { formatInTimeZone } from 'date-fns-tz';
const rows = eclipsesBetween('2026-01-01', '2030-12-31');
console.log(`${rows.length} eclipses visible from Canada, 2026-2030\n`);
for (const e of rows) {
  const f = (s?: string) => (s ? formatInTimeZone(new Date(s), e.timeZone, 'yyyy-MM-dd HH:mm zzz') : '        --        ');
  console.log(`${e.date}  ${e.kind.padEnd(6)} ${e.subtype.padEnd(10)} [times for ${e.observedFrom}]`);
  console.log(`             begin ${f(e.beginAt)}   max ${f(e.maxAt)}   end ${f(e.endAt)}`);
  console.log(`             ${e.visibilityNote}`);
}
