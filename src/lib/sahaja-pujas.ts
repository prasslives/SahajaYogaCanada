/**
 * Sahaja pujas that the Cabella feed does not publish.
 *
 * The Canadian puja year runs from Sankranti in January to Christmas Puja in
 * December, but the Shri Mataji Foundation calendar only lists the
 * international gatherings held at Cabella and elsewhere. These two are
 * observed locally and have to be supplied here.
 *
 * Anything added here is generated as an ordinary editable event, so a
 * coordinator can move or delete it without a code change.
 */
import type { FestivalOccurrence } from './festivals';
import type { IsoDate } from '../domain/types';

interface LocalPujaRule {
  key: string;
  name: string;
  note?: string;
  /** Surfaces in the review sheet until a coordinator confirms the date. */
  needsConfirmation?: boolean;
  date:
    | { kind: 'gregorian'; month: number; day: number }
    | { kind: 'onFestival'; festivalKey: string; offsetDays?: number };
}

export const LOCAL_PUJA_RULES: LocalPujaRule[] = [
  {
    key: 'sankranti-puja',
    name: 'Sankranti Puja',
    date: { kind: 'onFestival', festivalKey: 'makar-sankranti' },
    note: 'Opens the puja year. Placed on Makar Sankranti itself.',
    needsConfirmation: true,
  },
  {
    key: 'christmas-puja',
    name: 'Christmas Puja',
    date: { kind: 'gregorian', month: 12, day: 25 },
    note: 'Closes the puja year, celebrated on Christmas Day.',
  },
];

export interface LocalPuja {
  key: string;
  name: string;
  date: IsoDate;
  note?: string;
  needsConfirmation: boolean;
}

/** Local pujas for every year in a span, in date order. */
export function localPujasBetween(
  festivals: FestivalOccurrence[],
  from: IsoDate,
  to: IsoDate,
): LocalPuja[] {
  const firstYear = Number(from.slice(0, 4));
  const lastYear = Number(to.slice(0, 4));
  const out: LocalPuja[] = [];

  for (let year = firstYear; year <= lastYear; year++) {
    for (const rule of LOCAL_PUJA_RULES) {
      // Hoisted so the narrowing below survives into the `find` callback.
      const dateRule = rule.date;
      let date: IsoDate | undefined;

      if (dateRule.kind === 'gregorian') {
        date = `${year}-${String(dateRule.month).padStart(2, '0')}-${String(dateRule.day).padStart(2, '0')}`;
      } else {
        const festival = festivals.find(
          (f) => f.key === dateRule.festivalKey && f.date.startsWith(String(year)),
        );
        if (!festival) continue;
        const shifted = new Date(`${festival.date}T12:00:00Z`);
        shifted.setUTCDate(shifted.getUTCDate() + (dateRule.offsetDays ?? 0));
        date = shifted.toISOString().slice(0, 10);
      }

      if (!date || date < from || date > to) continue;
      out.push({
        key: rule.key,
        name: rule.name,
        date,
        note: rule.note,
        needsConfirmation: rule.needsConfirmation ?? false,
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
