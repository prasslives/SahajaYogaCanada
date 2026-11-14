import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FEED_IDS, sanitiseFeedIds } from '../domain/feeds';
import type { FeedId } from '../domain/types';

const FEEDS_KEY = 'syc.feeds.v1';
const CONFIGURED_KEY = 'syc.configured.v1';

export interface PreferencesState {
  /** False until the stored selection has been read back. */
  ready: boolean;
  /** True once the user has been through the setup screen at least once. */
  configured: boolean;
  enabled: Set<FeedId>;
  isOn: (feed: FeedId) => boolean;
  toggle: (feed: FeedId) => void;
  setEnabled: (feeds: FeedId[]) => void;
  restoreDefaults: () => void;
  markConfigured: () => void;
}

const PreferencesContext = createContext<PreferencesState | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [enabled, setEnabledState] = useState<Set<FeedId>>(new Set(DEFAULT_FEED_IDS));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [[, storedFeeds], [, storedConfigured]] = await AsyncStorage.multiGet([
          FEEDS_KEY,
          CONFIGURED_KEY,
        ]);
        if (cancelled) return;
        const parsed = storedFeeds ? sanitiseFeedIds(JSON.parse(storedFeeds)) : null;
        if (parsed) setEnabledState(new Set(parsed));
        if (storedConfigured === 'true') setConfigured(true);
      } catch {
        // A corrupt or unreadable store just means first-run defaults.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Written on every change rather than on leaving the screen, so a user who
  // force-quits from setup keeps what they picked.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(FEEDS_KEY, JSON.stringify([...enabled])).catch(() => {});
  }, [enabled, ready]);

  const toggle = useCallback((feed: FeedId) => {
    setEnabledState((previous) => {
      const next = new Set(previous);
      if (next.has(feed)) next.delete(feed);
      else next.add(feed);
      return next;
    });
  }, []);

  const markConfigured = useCallback(() => {
    setConfigured(true);
    AsyncStorage.setItem(CONFIGURED_KEY, 'true').catch(() => {});
  }, []);

  const value = useMemo<PreferencesState>(
    () => ({
      ready,
      configured,
      enabled,
      isOn: (feed) => enabled.has(feed),
      toggle,
      setEnabled: (feeds) => setEnabledState(new Set(feeds)),
      restoreDefaults: () => setEnabledState(new Set(DEFAULT_FEED_IDS)),
      markConfigured,
    }),
    [ready, configured, enabled, toggle, markConfigured],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesState {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
  return context;
}
