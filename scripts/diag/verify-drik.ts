/**
 * Regression check of the festival engine against dates published by
 * Drik Panchang for 2026, the authority the Ontario Council follows.
 */
import { NEW_DELHI } from '../../src/lib/panchang';
import { festivalsBetween } from '../../src/lib/festivals';

/** Fetched from drikpanchang.com for 2026. */
const DRIK_2026: Record<string, string> = {
  'mahashivaratri': '2026-02-15',
  'holika-dahan': '2026-03-03',
  'holi': '2026-03-04',
  'ugadi': '2026-03-19',
  'rama-navami': '2026-03-26', // Smarta; ISKCON observes the 27th
  'hanuman-jayanti': '2026-04-02',
  'akshaya-tritiya': '2026-04-19',
  'buddha-purnima': '2026-05-01',
  'guru-purnima': '2026-07-29',
  'raksha-bandhan': '2026-08-28',
  'janmashtami': '2026-09-04',
  'ganesh-chaturthi': '2026-09-14',
  'durga-ashtami': '2026-10-19',
  'maha-navami': '2026-10-19',
  'dussehra': '2026-10-20',
  'diwali': '2026-11-08',
  'govardhan-puja': '2026-11-10',
  'bhai-dooj': '2026-11-11',
  'easter': '2026-04-05',
  'good-friday': '2026-04-03',
};

const occurrences = festivalsBetween(NEW_DELHI, '2026-01-01', '2026-12-31');

let matched = 0;
const mismatches: string[] = [];
for (const [key, expected] of Object.entries(DRIK_2026)) {
  const got = occurrences.find((o) => o.key === key)?.date ?? 'MISSING';
  if (got === expected) {
    matched += 1;
  } else {
    mismatches.push(`  ${key.padEnd(18)} computed ${got}   Drik ${expected}`);
  }
}

const navaratriStart = occurrences.find((o) => o.key === 'navaratri' && o.dayNumber === 1)?.date;
const navaratriOk = navaratriStart === '2026-10-11';
if (navaratriOk) matched += 1;
else mismatches.push(`  navaratri day 1   computed ${navaratriStart}   Drik 2026-10-11`);

const total = Object.keys(DRIK_2026).length + 1;
console.log(`Drik 2026 agreement: ${matched}/${total}`);
if (mismatches.length) {
  console.log('\nMismatches:');
  console.log(mismatches.join('\n'));
}
process.exit(mismatches.length ? 1 : 0);
