import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { bindAccountAndClearIfNeeded } from '@/lib/clear-practice-data';

export type CampusSession = {
  email: string;
  practiceName: string;
};

const STORAGE_KEY = 'campus-session';
const DATA_VERSION_KEY = 'campus-practice-data-version';
const DATA_VERSION = '4';

function readSession(): CampusSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CampusSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: CampusSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

type SessionContextValue = {
  session: CampusSession | null;
  login: (session: CampusSession) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function ensureDataVersion() {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== DATA_VERSION) {
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CampusSession | null>(() => {
    ensureDataVersion();
    return readSession();
  });

  const value = useMemo(
    () => ({
      session,
      login: (next: CampusSession) => {
        // Ne purge que si on change vraiment de compte (pas à chaque reconnexion).
        bindAccountAndClearIfNeeded(next.email);
        ensureDataVersion();
        writeSession(next);
        setSession(next);
      },
      logout: () => {
        // Garde les données cabinet ; seule la session est fermée.
        writeSession(null);
        setSession(null);
      },
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
