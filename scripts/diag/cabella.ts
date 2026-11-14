import { readFileSync } from 'node:fs';
import { parseCabellaFeed, cabellaFeedUrl, extractPujaDate } from '../../src/lib/cabella';

// Parse the feed already downloaded during planning, plus the sample the user supplied.
const feed = readFileSync(process.argv[2], 'utf8');
const pujas = parseCabellaFeed(feed);
console.log(`${pujas.length} pujas parsed from ${process.argv[2]}\n`);
for (const p of pujas) {
  console.log(`${p.pujaDate}  ${p.title.padEnd(24)} weekend ${p.weekendStart}..${p.weekendEnd}${p.dateInferred ? '  [INFERRED]' : ''}`);
}

console.log('\n--- extractPujaDate edge cases ---');
const cases: Array<[string, string, string]> = [
  ['Date: Sunday 6th September', '2026-09-04', '2026-09-06'],
  ['\u{1F5D3}️ Date: Saturday 12th September', '2026-09-11', '2026-09-12'],
  ['Date: Sunday 3rd May', '2026-05-01', '2026-05-03'],
  ['Date: Thursday 1st January', '2026-12-30', '2027-01-01'],  // straddles New Year
  ['Date: Wednesday 31st December', '2027-01-01', '2026-12-31'], // straddles backwards
  ['no date here', '2026-09-04', 'null'],
];
for (const [desc, start, want] of cases) {
  const got = String(extractPujaDate(desc, start));
  console.log(`${got === want ? 'OK  ' : 'FAIL'} "${desc.slice(0, 40)}" + ${start} -> ${got}  (want ${want})`);
}
console.log('\nfeed url 2027:', cabellaFeedUrl(2027));
