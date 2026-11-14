import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { FEEDS_BY_ID } from '../domain/feeds';
import { usePreferences } from './preferences';
import type { CalendarEvent, EventCategory } from '../domain/types';

/** Pujas first, then festivals, then the sky. Mirrors the sort in `events.ts`. */
const RANK: EventCategory[] = [
  'puja', 'religious_festival', 'public_program', 'seminar', 'workshop', 'other', 'astronomical',
];

interface FilterState {
  /**
   * The categories the user has subscribed to, in display order. Driven by the
   * setup screen, so a category with no enabled feed never appears at all.
   */
  available: EventCategory[];
  /** Whether the chip strip is worth rendering. One chip filters nothing. */
  showChips: boolean;
  isOn: (category: EventCategory) => boolean;
  toggle: (category: EventCategory) => void;
  reset: () => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const { enabled } = usePreferences();

  /**
   * Muted rather than active, so a category the user switches on in setup shows
   * up straight away instead of arriving pre-hidden.
   */
  const [muted, setMuted] = useState<Set<EventCategory>>(new Set());

  const available = useMemo(() => {
    const categories = new Set<EventCategory>();
    for (const id of enabled) {
      const feed = FEEDS_BY_ID.get(id);
      if (feed) categories.add(feed.category);
    }
    return RANK.filter((category) => categories.has(category));
  }, [enabled]);

  const value = useMemo<FilterState>(
    () => ({
      available,
      showChips: available.length > 1,
      isOn: (category) => !muted.has(category),
      toggle: (category) =>
        setMuted((previous) => {
          const next = new Set(previous);
          if (next.has(category)) next.delete(category);
          else next.add(category);
          // Never let the calendar go completely blank.
          return available.every((c) => next.has(c)) ? new Set() : next;
        }),
      reset: () => setMuted(new Set()),
    }),
    [available, muted],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterState {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used inside FilterProvider');
  return context;
}

/**
 * The single predicate every screen filters with. An event has to be both
 * subscribed to in setup and not muted in the chip strip.
 */
export function useVisibleEvent(): (event: CalendarEvent) => boolean {
  const { enabled } = usePreferences();
  const { isOn } = useFilters();
  return useMemo(
    () => (event: CalendarEvent) => enabled.has(event.feed) && isOn(event.category),
    [enabled, isOn],
  );
}
