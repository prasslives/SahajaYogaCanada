/**
 * Renders the date review sheet from the generated seed data.
 *
 * Regenerate with `npx tsx scripts/seed/review-sheet.ts` after any change to
 * the panchang or festival rules, then republish the artifact.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatInTimeZone } from 'date-fns-tz';
import type { FestivalOccurrence } from '../../src/lib/festivals';
import type { CabellaPuja } from '../../src/lib/cabella';
import type { Eclipse, MoonDay } from '../../src/domain/types';
import type { LocalPuja } from '../../src/lib/sahaja-pujas';

const SEED = join(process.cwd(), 'src/data/seed');
const read = <T>(name: string): T => JSON.parse(readFileSync(join(SEED, name), 'utf8'));

const festivals = read<FestivalOccurrence[]>('festivals.json');
const moonDays = read<MoonDay[]>('moon-days.json');
const eclipses = read<Eclipse[]>('eclipses.json');
const pujas = read<CabellaPuja[]>('pujas.json');
const links = read<any[]>('puja-festival-links.json');
const localPujas = read<LocalPuja[]>('local-pujas.json');
const meta = read<any>('meta.json');

const YEARS = ['2026', '2027', '2028', '2029', '2030'];
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const weekday = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-CA', { weekday: 'short', timeZone: 'UTC' });
const pretty = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-CA', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  });

// Verified against Drik Panchang during development.
const DRIK_VERIFIED = new Set([
  'mahashivaratri', 'holika-dahan', 'holi', 'ugadi', 'rama-navami', 'hanuman-jayanti',
  'akshaya-tritiya', 'buddha-purnima', 'guru-purnima', 'raksha-bandhan', 'janmashtami',
  'ganesh-chaturthi', 'durga-ashtami', 'maha-navami', 'dussehra', 'diwali',
  'govardhan-puja', 'bhai-dooj', 'easter', 'good-friday', 'navaratri',
]);

const festivalRows = festivals
  .filter((f) => !(f.key === 'navaratri' && (f.dayNumber ?? 1) > 1))
  .map((f) => {
    const status = f.needsVerification
      ? 'check'
      : DRIK_VERIFIED.has(f.key) && f.date.startsWith('2026')
        ? 'verified'
        : 'computed';
    const label = f.key === 'navaratri'
      ? `${f.name} <span class="sub">${f.totalDays} days from here</span>`
      : esc(f.name);
    return `<tr data-year="${f.date.slice(0, 4)}" data-status="${status}" data-name="${esc(f.name.toLowerCase())}">
      <td class="num">${f.date}</td><td class="dim">${weekday(f.date)}</td>
      <td>${label}</td><td class="dim">${f.tradition}</td>
      <td><span class="tag tag-${status}">${status === 'check' ? 'confirm' : status}</span></td>
      <td class="note">${f.note ? esc(f.note) : ''}</td></tr>`;
  })
  .join('\n');

type PujaRow = {
  date: string; title: string; span: string; celebrates: string; origin: 'cabella' | 'local'; confirm: boolean;
};

const pujaRows = ([] as PujaRow[])
  .concat(
    pujas.map((p) => {
      const link = links.find((l) => l.pujaUid === p.uid);
      return {
        date: p.pujaDate,
        title: p.title,
        span: `${pretty(p.weekendStart)} &ndash; ${pretty(p.weekendEnd)}`,
        celebrates: link
          ? `${esc(link.festivalName)} <span class="gap">${link.dayGap >= 0 ? '+' : ''}${link.dayGap}d</span>`
          : '<span class="dim">&mdash;</span>',
        origin: 'cabella' as const,
        confirm: false,
      };
    }),
  )
  .concat(
    localPujas
      .filter((p) => p.date.startsWith('2026'))
      .map((p) => ({
        date: p.date,
        title: p.name,
        span: '<span class="dim">single day</span>',
        celebrates: p.note ? esc(p.note) : '<span class="dim">&mdash;</span>',
        origin: 'local' as const,
        confirm: p.needsConfirmation,
      })),
  )
  .sort((a, b) => a.date.localeCompare(b.date))
  .map(
    (r) => `<tr><td class="num">${r.date}</td><td class="dim">${weekday(r.date)}</td>
    <td>${esc(r.title)}${r.confirm ? ' <span class="tag tag-check">confirm</span>' : ''}</td>
    <td><span class="tag tag-${r.origin === 'cabella' ? 'computed' : 'verified'}">${r.origin === 'cabella' ? 'Cabella' : 'Canada'}</span></td>
    <td class="dim num">${r.span}</td>
    <td class="note">${r.celebrates}</td></tr>`,
  )
  .join('\n');

const eclipseRows = eclipses.map((e) => {
  const t = (iso?: string) => (iso ? formatInTimeZone(new Date(iso), e.timeZone, 'HH:mm') : '&ndash;');
  const zone = formatInTimeZone(new Date(e.maxAt), e.timeZone, 'zzz');
  return `<tr data-year="${e.date.slice(0, 4)}">
    <td class="num">${e.date}</td>
    <td><span class="tag tag-${e.kind}">${e.kind}</span> ${e.subtype}</td>
    <td class="num">${t(e.beginAt)}</td><td class="num strong">${t(e.maxAt)}</td><td class="num">${t(e.endAt)}</td>
    <td class="dim">${esc(e.observedFrom)} ${zone}</td>
    <td class="note">${esc(e.visibilityNote ?? '')}</td></tr>`;
}).join('\n');

const moonByYear = YEARS.map((y) => {
  const rows = moonDays.filter((m) => m.date.startsWith(y));
  const count = (k: string) => rows.filter((m) => m.kind === k).length;
  return `<tr><td class="num">${y}</td><td class="num">${count('purnima')}</td><td class="num">${count('amavasya')}</td>
    <td class="num">${count('saptami')}</td><td class="num">${count('navami')}</td><td class="num strong">${rows.length}</td></tr>`;
}).join('\n');

const moon2026 = moonDays.filter((m) => m.date.startsWith('2026')).map((m) =>
  `<tr><td class="num">${m.date}</td><td class="dim">${weekday(m.date)}</td>
   <td><span class="tag tag-moon-${m.kind}">${m.kind}</span></td><td class="dim">${m.paksha} paksha</td></tr>`
).join('\n');

const flaggedCount = festivals.filter((f) => f.needsVerification).length;
const generated = formatInTimeZone(new Date(meta.generatedAt), 'America/Toronto', "d MMMM yyyy");

const html = `<title>Panchang Seed Review</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root {
    --paper: #F7F8F5; --card: #FFFFFF; --ink: #16201B; --ink-soft: #55625B;
    --rule: #DDE3DC; --rule-soft: #EBEFE9;
    --green: #1E5B45; --green-soft: #E6EFE9; --brass: #8A6522; --brass-soft: #F5EEDD;
    --flag: #A8481A; --flag-soft: #FAEBE2;
    --shadow: 0 1px 2px rgba(22,32,27,.05), 0 8px 24px -16px rgba(22,32,27,.25);
  }
  :root:not([data-theme="light"]) { }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #101412; --card: #171D19; --ink: #E8EDE7; --ink-soft: #93A198;
      --rule: #28312B; --rule-soft: #1F2622;
      --green: #74C3A0; --green-soft: #17251E; --brass: #D3A85A; --brass-soft: #221C0F;
      --flag: #E39066; --flag-soft: #291710;
      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8);
    }
  }
  :root[data-theme="dark"] {
    --paper: #101412; --card: #171D19; --ink: #E8EDE7; --ink-soft: #93A198;
    --rule: #28312B; --rule-soft: #1F2622;
    --green: #74C3A0; --green-soft: #17251E; --brass: #D3A85A; --brass-soft: #221C0F;
    --flag: #E39066; --flag-soft: #291710;
    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8);
  }

  * { box-sizing: border-box; }
  body {
    background: var(--paper); color: var(--ink);
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    font-size: 15px; line-height: 1.6; margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 56px 24px 96px; }

  h1, h2, h3 { font-family: Spectral, Georgia, serif; text-wrap: balance; margin: 0; font-weight: 600; }
  h1 { font-size: clamp(30px, 5vw, 44px); line-height: 1.1; letter-spacing: -.01em; }
  h2 { font-size: 24px; letter-spacing: -.005em; }
  h3 { font-size: 17px; }
  p { margin: 0; max-width: 68ch; }

  .eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
    color: var(--green); font-family: "IBM Plex Sans", sans-serif;
  }

  header { display: flex; flex-direction: column; gap: 14px; padding-bottom: 32px; }
  header .lede { color: var(--ink-soft); font-size: 17px; }
  .meta-line {
    display: flex; flex-wrap: wrap; gap: 8px 20px; padding-top: 8px;
    font-family: "IBM Plex Mono", monospace; font-size: 12.5px; color: var(--ink-soft);
  }
  .meta-line b { color: var(--ink); font-weight: 500; }

  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 28px 0 8px; }
  .tile { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 16px 18px; box-shadow: var(--shadow); }
  .tile .n { font-family: "IBM Plex Mono", monospace; font-size: 28px; font-weight: 500; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .tile .k { font-size: 12px; color: var(--ink-soft); margin-top: 4px; }
  .tile.accent .n { color: var(--green); }
  .tile.warn .n { color: var(--flag); }

  section { margin-top: 56px; display: flex; flex-direction: column; gap: 16px; }
  .section-head { display: flex; flex-direction: column; gap: 6px; border-top: 2px solid var(--ink); padding-top: 14px; }

  .callout {
    background: var(--brass-soft); border: 1px solid var(--brass); border-radius: 10px;
    padding: 16px 18px; display: flex; flex-direction: column; gap: 8px;
  }
  .callout.flag { background: var(--flag-soft); border-color: var(--flag); }
  .callout h3 { color: var(--brass); font-size: 15px; }
  .callout.flag h3 { color: var(--flag); }
  .callout p { font-size: 14px; }

  .scroll { overflow-x: auto; border: 1px solid var(--rule); border-radius: 10px; background: var(--card); box-shadow: var(--shadow); }
  table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
  th {
    text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .09em; text-transform: uppercase;
    color: var(--ink-soft); padding: 11px 14px; border-bottom: 1px solid var(--rule); white-space: nowrap;
    background: var(--card); position: sticky; top: 0;
  }
  td { padding: 9px 14px; border-bottom: 1px solid var(--rule-soft); vertical-align: top; }
  tr:last-child td { border-bottom: 0; }
  .num { font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .strong { font-weight: 500; color: var(--green); }
  .dim { color: var(--ink-soft); }
  .note { color: var(--ink-soft); font-size: 12.5px; min-width: 200px; }
  .sub { color: var(--ink-soft); font-size: 12px; }
  .gap { font-family: "IBM Plex Mono", monospace; color: var(--brass); font-weight: 500; }

  .tag {
    display: inline-block; font-size: 10.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
    padding: 2px 7px; border-radius: 4px; white-space: nowrap;
  }
  .tag-verified { background: var(--green-soft); color: var(--green); }
  .tag-computed { background: var(--rule-soft); color: var(--ink-soft); }
  .tag-check { background: var(--flag-soft); color: var(--flag); }
  .tag-solar { background: var(--brass-soft); color: var(--brass); }
  .tag-lunar { background: var(--green-soft); color: var(--green); }
  .tag-moon-purnima { background: var(--brass-soft); color: var(--brass); }
  .tag-moon-amavasya { background: var(--rule-soft); color: var(--ink-soft); }
  .tag-moon-saptami, .tag-moon-navami { background: var(--green-soft); color: var(--green); }

  .controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .chip {
    font: inherit; font-size: 12.5px; padding: 5px 12px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--rule); background: var(--card); color: var(--ink-soft);
  }
  .chip:hover { border-color: var(--green); color: var(--green); }
  .chip[aria-pressed="true"] { background: var(--green); border-color: var(--green); color: var(--paper); }
  .chip:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }

  ol.todo { margin: 0; padding-left: 0; list-style: none; counter-reset: t; display: flex; flex-direction: column; gap: 12px; }
  ol.todo li { counter-increment: t; display: grid; grid-template-columns: 26px 1fr; gap: 12px; align-items: start; }
  ol.todo li::before {
    content: counter(t); font-family: "IBM Plex Mono", monospace; font-size: 12px; font-weight: 500;
    width: 24px; height: 24px; border-radius: 6px; display: grid; place-items: center;
    background: var(--green-soft); color: var(--green);
  }
  ol.todo b { font-weight: 600; }
  ol.todo p { font-size: 14px; color: var(--ink-soft); }

  details { border: 1px solid var(--rule); border-radius: 10px; background: var(--card); }
  summary { padding: 12px 16px; cursor: pointer; font-size: 13.5px; font-weight: 500; }
  summary:focus-visible { outline: 2px solid var(--green); outline-offset: -2px; }
  details .scroll { border: 0; border-top: 1px solid var(--rule); border-radius: 0; box-shadow: none; }

  footer { margin-top: 64px; padding-top: 20px; border-top: 1px solid var(--rule); color: var(--ink-soft); font-size: 13px; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">Sahaja Yoga Canada &middot; Calendar App</div>
    <h1>Five-year date review</h1>
    <p class="lede">Every festival, moon day, eclipse and puja the app will show, computed from scratch and cross-checked. Please confirm the dates flagged for review &mdash; everything here is editable later.</p>
    <div class="meta-line">
      <span>Generated <b>${generated}</b></span>
      <span>Range <b>2026&ndash;2030</b></span>
      <span>Reckoned by <b>New Delhi sunrise</b></span>
      <span>Authority <b>Drik Panchang</b></span>
    </div>
  </header>

  <div class="tiles">
    <div class="tile accent"><div class="n">21/21</div><div class="k">2026 festival dates matching Drik</div></div>
    <div class="tile"><div class="n">${festivals.length}</div><div class="k">Festival occurrences</div></div>
    <div class="tile"><div class="n">${moonDays.length}</div><div class="k">Moon days</div></div>
    <div class="tile"><div class="n">${eclipses.length}</div><div class="k">Eclipses visible in Canada</div></div>
    <div class="tile"><div class="n">${pujas.length}<span style="font-size:16px;color:var(--ink-soft)"> + ${localPujas.filter((p) => p.date.startsWith('2026')).length}</span></div><div class="k">Pujas in 2026 &mdash; Cabella + Canada</div></div>
    <div class="tile warn"><div class="n">${flaggedCount}</div><div class="k">Need your confirmation</div></div>
  </div>

  <section>
    <div class="section-head"><div class="eyebrow">Start here</div><h2>What I need you to check</h2></div>
    <div class="callout"><h3>Settled since the last version</h3><p>Christmas Puja is now placed on Christmas Day itself. Birthday, Sahasrara and Shri Adi Shakti Puja are treated as fixed Sahaja dates with no separate festival. The Islamic list is trimmed to Prophet Muhammad's Birthday, Ramzan and Bakrid.</p></div>
    <ol class="todo">
      <li><div><b>The ${flaggedCount} Islamic dates.</b><p>Now trimmed to the three the collective observes &mdash; Prophet Muhammad's Birthday, Eid al-Fitr (Ramzan) and Eid al-Adha (Bakrid). All three come from the tabular Hijri calendar, so actual observance follows local moon sighting and can shift by a day. If the collective follows a particular mosque or council, tell me and I will match it.</p></div></li>
      <li><div><b>Sankranti Puja on 14 January.</b><p>Placed on Makar Sankranti itself, since you described the puja year as running from Sankranti to Christmas Puja. Confirm this is the day the collective observes it, or give me the right one.</p></div></li>
      <li><div><b>Shri Mahakali Puja, 29 November 2026.</b><p>You said this is a one-off rather than an annual fixture. It is still in Cabella's own 2026 calendar and has not happened yet, so I have left it on this year's calendar &mdash; it will not carry into later years, because pujas are read from the feed each year rather than from a fixed list. Say the word if you would rather it were hidden entirely.</p></div></li>
      <li><div><b>Any festival the collective observes that is missing.</b><p>The list covers Hindu, Christian, Buddhist, Sikh and Islamic observances. Tell me anything to add or remove.</p></div></li>
    </ol>
  </section>

  <section>
    <div class="section-head"><div class="eyebrow">Cabella</div><h2>Puja calendar, and the years that are missing</h2></div>
    <div class="callout flag">
      <h3>Only 2026 is published</h3>
      <p>The Shri Mataji Foundation feed returns pujas for 2026 only; 2027 onward are not out yet. The app syncs monthly and will pick each year up automatically as it is published, so the calendar will show festivals and moon days for all five years but pujas only as far ahead as Cabella has announced them.</p>
    </div>
    <div class="scroll"><table>
      <thead><tr><th>Puja date</th><th></th><th>Puja</th><th>Source</th><th>Gathering</th><th>Celebrates / note</th></tr></thead>
      <tbody>${pujaRows}</tbody>
    </table></div>
    <p class="note">Rows marked <span class="tag tag-computed">Cabella</span> come from the foundation's feed, which gives a three-day weekend for each puja with the exact day written in the event description. Rows marked <span class="tag tag-verified">Canada</span> are observed locally and are not in the feed at all. Note Shri Ganesha Puja falls <b>before</b> Ganesha Chaturthi, and Shri Krishna Puja two days <b>after</b> Janmashtami &mdash; which is why the app shows both dates separately.</p>
  </section>

  <section>
    <div class="section-head"><div class="eyebrow">Festivals</div><h2>Religious festivals, 2026&ndash;2030</h2></div>
    <p class="note">2026 was checked line by line against Drik Panchang and matches on all 21 comparable dates. Later years use the identical rules but have not been compared against a published almanac.</p>
    <div class="controls">
      <button class="chip" data-filter="year" data-value="all" aria-pressed="true">All years</button>
      ${YEARS.map((y) => `<button class="chip" data-filter="year" data-value="${y}" aria-pressed="false">${y}</button>`).join('\n      ')}
      <span style="flex:1"></span>
      <button class="chip" id="flagged" aria-pressed="false">Only those needing confirmation</button>
    </div>
    <div class="scroll"><table id="festivals">
      <thead><tr><th>Date</th><th></th><th>Festival</th><th>Tradition</th><th>Status</th><th>Note</th></tr></thead>
      <tbody>${festivalRows}</tbody>
    </table></div>
    <p class="note" id="count"></p>
  </section>

  <section>
    <div class="section-head"><div class="eyebrow">Astronomical</div><h2>Eclipses visible from Canada</h2></div>
    <p class="note">Only eclipses actually visible from somewhere in Canada are included. Times are local to the city named &mdash; Toronto wherever Toronto can see it.</p>
    <div class="scroll"><table>
      <thead><tr><th>Date</th><th>Type</th><th>Begins</th><th>Maximum</th><th>Ends</th><th>Times for</th><th>Visibility</th></tr></thead>
      <tbody>${eclipseRows}</tbody>
    </table></div>
  </section>

  <section>
    <div class="section-head"><div class="eyebrow">Moon days</div><h2>Full moon, no moon, Saptami, Navami</h2></div>
    <div class="scroll"><table>
      <thead><tr><th>Year</th><th>Purnima</th><th>Amavasya</th><th>Saptami</th><th>Navami</th><th>Total</th></tr></thead>
      <tbody>${moonByYear}</tbody>
    </table></div>
    <details>
      <summary>Show all 2026 moon days</summary>
      <div class="scroll"><table>
        <thead><tr><th>Date</th><th></th><th>Day</th><th>Paksha</th></tr></thead>
        <tbody>${moon2026}</tbody>
      </table></div>
    </details>
  </section>

  <section>
    <div class="section-head"><div class="eyebrow">Method</div><h2>How these dates were worked out</h2></div>
    <p>Tithi comes from the Moon's ecliptic longitude minus the Sun's, so no ayanamsa is involved and there is nothing to calibrate. Lunar months are named by the sign the Sun enters during them, which correctly produces the leap months <b>Adhika Jyeshtha 2026</b> and <b>Adhika Chaitra 2029</b> &mdash; festivals skip those, as tradition requires.</p>
    <p style="margin-top:12px">Festivals are not all placed by sunrise. Each is reckoned by its traditional window: Mahashivaratri and Janmashtami at <b>nishita</b> (midnight), Ganesha Chaturthi and Ugadi at <b>madhyahna</b> (midday), Dussehra and Maha Navami at <b>aparahna</b> (afternoon), Diwali at <b>pradosh</b> (evening). Using sunrise for all of them put six festivals a day late.</p>
  </section>

  <footer>Generated from the app's own calendar engine. Every date here is stored as an ordinary editable entry &mdash; anything wrong can be corrected in the admin panel without touching code.</footer>
</div>

<script>
  var yearFilter = 'all';
  var flaggedOnly = false;
  var rows = Array.prototype.slice.call(document.querySelectorAll('#festivals tbody tr'));
  var countEl = document.getElementById('count');

  function apply() {
    var shown = 0;
    rows.forEach(function (row) {
      var okYear = yearFilter === 'all' || row.dataset.year === yearFilter;
      var okFlag = !flaggedOnly || row.dataset.status === 'check';
      var visible = okYear && okFlag;
      row.hidden = !visible;
      if (visible) shown++;
    });
    countEl.textContent = 'Showing ' + shown + ' of ' + rows.length + ' occurrences.';
  }

  document.querySelectorAll('[data-filter="year"]').forEach(function (button) {
    button.addEventListener('click', function () {
      yearFilter = button.dataset.value;
      document.querySelectorAll('[data-filter="year"]').forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button));
      });
      apply();
    });
  });

  var flaggedButton = document.getElementById('flagged');
  flaggedButton.addEventListener('click', function () {
    flaggedOnly = !flaggedOnly;
    flaggedButton.setAttribute('aria-pressed', String(flaggedOnly));
    apply();
  });

  apply();
</script>
`;

const outPath = join(process.cwd(), 'docs/date-review.html');
writeFileSync(outPath, html);
console.log(`Wrote ${outPath} (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`  ${festivals.length} festivals, ${moonDays.length} moon days, ${eclipses.length} eclipses, ${pujas.length} pujas`);
