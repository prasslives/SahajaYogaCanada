/**
 * Generates the five-year seed dataset: Cabella pujas, religious festivals,
 * moon days and Canadian-visible eclipses.
 *
 * Output is plain JSON so it can be reviewed by eye, corrected by hand, and
 * loaded into Supabase (or bundled with the app before the backend exists).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NEW_DELHI, moonDaysBetween } from '../../src/lib/panchang';
import { festivalsBetween, type FestivalOccurrence } from '../../src/lib/festivals';
import { eclipsesBetween } from '../../src/lib/eclipses';
import { parseCabellaFeed, cabellaFeedUrl, type CabellaPuja } from '../../src/lib/cabella';
import { localPujasBetween } from '../../src/lib/sahaja-pujas';

const FROM = '2026-01-01';
const TO = '2030-12-31';
const OUT_DIR = join(process.cwd(), 'src/data/seed');

/**
 * Which religious festival each Cabella puja celebrates. The puja and the
 * festival fall on different days -- Janmashtami on 4 Sep 2026, Shri Krishna
 * Puja on the 6th -- and the app shows both, linked.
 */
const PUJA_TO_FESTIVAL: Record<string, string> = {
  'Mahashivaratri Puja': 'mahashivaratri',
  'Easter Puja': 'easter',
  'Shri Adi Guru Puja': 'guru-purnima',
  'Shri Krishna Puja': 'janmashtami',
  'Shri Ganesha Puja': 'ganesh-chaturthi',
  'Navaratri': 'navaratri',
  'Diwali': 'diwali',
};

async function fetchYear(year: number): Promise<CabellaPuja[]> {
  try {
    const response = await fetch(cabellaFeedUrl(year));
    if (!response.ok) {
      console.warn(`  ${year}: HTTP ${response.status}`);
      return [];
    }
    const pujas = parseCabellaFeed(await response.text()).filter((p) =>
      p.pujaDate.startsWith(String(year)),
    );
    console.log(`  ${year}: ${pujas.length} pujas`);
    return pujas;
  } catch (error) {
    console.warn(`  ${year}: fetch failed -- ${(error as Error).message}`);
    return [];
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Fetching Cabella puja calendar...');
  const years = [2026, 2027, 2028, 2029, 2030];
  const pujaLists = await Promise.all(years.map(fetchYear));
  const pujas = pujaLists.flat();
  // The foundation publishes each year late, so later years are simply absent.
  const yearsPublished = years.filter((y, i) => pujaLists[i].length > 0);

  console.log('\nComputing festivals...');
  const festivals = festivalsBetween(NEW_DELHI, FROM, TO);
  console.log(`  ${festivals.length} occurrences`);

  console.log('Computing moon days...');
  const moonDays = moonDaysBetween(NEW_DELHI, FROM, TO);
  console.log(`  ${moonDays.length} moon days`);

  console.log('Computing local pujas (not published by Cabella)...');
  const localPujas = localPujasBetween(festivals, FROM, TO);
  console.log(`  ${localPujas.length} local pujas`);

  console.log('Computing eclipses...');
  const eclipses = eclipsesBetween(FROM, TO);
  console.log(`  ${eclipses.length} visible from Canada`);

  // Link each puja to the festival it celebrates, in the same year.
  const links = pujas
    .map((puja) => {
      const key = PUJA_TO_FESTIVAL[puja.title];
      if (!key) return null;
      const year = puja.pujaDate.slice(0, 4);
      const candidates = festivals.filter((f) => f.key === key && f.date.startsWith(year));
      // Navaratri spans nine days; link to its first.
      const festival = candidates[0];
      if (!festival) return null;
      return {
        pujaUid: puja.uid,
        pujaTitle: puja.title,
        pujaDate: puja.pujaDate,
        festivalKey: festival.key,
        festivalName: festival.name,
        festivalDate: festival.date,
        dayGap: Math.round(
          (new Date(puja.pujaDate).getTime() - new Date(festival.date).getTime()) / 86400000,
        ),
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const write = (name: string, data: unknown) => {
    writeFileSync(join(OUT_DIR, name), JSON.stringify(data, null, 2) + '\n');
    console.log(`  wrote ${name}`);
  };

  console.log('\nWriting seed files...');
  write('pujas.json', pujas);
  write('local-pujas.json', localPujas);
  write('festivals.json', festivals);
  write('moon-days.json', moonDays);
  write('eclipses.json', eclipses);
  write('puja-festival-links.json', links);
  write('meta.json', {
    generatedAt: new Date().toISOString(),
    range: { from: FROM, to: TO },
    reckoning: `${NEW_DELHI.name} sunrise (matches Drik Panchang)`,
    cabellaYearsPublished: yearsPublished,
    counts: {
      pujas: pujas.length,
      localPujas: localPujas.length,
      festivals: festivals.length,
      moonDays: moonDays.length,
      eclipses: eclipses.length,
      links: links.length,
    },
  });

  console.log('\n--- Puja / festival pairings ---');
  for (const l of links) {
    console.log(
      `${l.pujaDate}  ${l.pujaTitle.padEnd(22)} celebrates ${l.festivalName} (${l.festivalDate}, ${l.dayGap >= 0 ? '+' : ''}${l.dayGap}d)`,
    );
  }
  console.log('\n--- Local pujas (first year) ---');
  for (const p of localPujas.filter((p) => p.date.startsWith('2026'))) {
    console.log(`${p.date}  ${p.name}${p.needsConfirmation ? '  [confirm]' : ''}`);
  }

  const needsVerification = festivals.filter((f) => f.needsVerification);
  console.log(`\n${needsVerification.length} occurrences flagged for verification.`);
  console.log(`Cabella years published: ${yearsPublished.join(', ') || 'none'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
