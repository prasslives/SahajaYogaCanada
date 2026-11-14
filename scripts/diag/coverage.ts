import { NEW_DELHI } from '../../src/lib/panchang';
import { festivalsBetween, FESTIVAL_RULES } from '../../src/lib/festivals';

const all = festivalsBetween(NEW_DELHI, '2026-01-01', '2030-12-31');
console.log(`Total occurrences 2026-2030: ${all.length}\n`);

const perKeyPerYear = new Map<string, Map<string, number>>();
for (const o of all) {
  const y = o.date.slice(0, 4);
  if (!perKeyPerYear.has(o.key)) perKeyPerYear.set(o.key, new Map());
  const m = perKeyPerYear.get(o.key)!;
  m.set(y, (m.get(y) ?? 0) + 1);
}

const years = ['2026', '2027', '2028', '2029', '2030'];
console.log('key                 ' + years.join('  ') + '   expected');
const problems: string[] = [];
for (const rule of FESTIVAL_RULES) {
  const m = perKeyPerYear.get(rule.key) ?? new Map();
  // Navaratri spans 9 tithis, which compress into 8 calendar days in years
  // with a kshaya tithi, so both counts are correct.
  const ok = (c: number) => (rule.kind === 'lunarRange' ? c === 8 || c === 9 : c === 1);
  const expected = rule.kind === 'lunarRange' ? '8-9' : '1';
  const counts = years.map((y) => m.get(y) ?? 0);
  const flag = counts.some((c) => !ok(c)) ? '  <-- CHECK' : '';
  if (flag) problems.push(`${rule.key}: ${counts.join(',')} (expected ${expected}/yr)`);
  console.log(`${rule.key.padEnd(20)}${counts.map((c) => String(c).padStart(4)).join('  ')}      ${expected}${flag}`);
}

console.log('\n--- 2027 dates (spot-check year) ---');
for (const o of all.filter((o) => o.date.startsWith('2027') && o.key !== 'navaratri')) {
  console.log(`${o.date}  ${o.name}`);
}

console.log(`\n${problems.length ? 'ANOMALIES:\n' + problems.join('\n') : 'No structural anomalies.'}`);
