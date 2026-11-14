import { NEW_DELHI } from '../../src/lib/panchang';
import { festivalsBetween } from '../../src/lib/festivals';
const all = festivalsBetween(NEW_DELHI, '2026-01-01', '2030-12-31').filter(o => o.key === 'navaratri');
for (const y of ['2026','2027','2028','2029','2030']) {
  const rows = all.filter(o => o.date.startsWith(y));
  const dates = rows.map(r => r.date.slice(5));
  const nums  = rows.map(r => r.dayNumber);
  // contiguity check
  let gaps = 0;
  for (let i=1;i<rows.length;i++){
    const d = (new Date(rows[i].date).getTime() - new Date(rows[i-1].date).getTime())/86400000;
    if (d !== 1) gaps++;
  }
  console.log(`${y}: ${rows.length} dates ${dates[0]}..${dates[dates.length-1]}  tithi-numbers [${nums.join(',')}]  calendar gaps: ${gaps}`);
}
