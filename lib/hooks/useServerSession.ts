'use client';

import { useEffect, useState } from 'react';

type SessionPayload = {
  user: any | null;
  session: any | null;
  org_id: string | null;
};

export function useServerSession() {
  const [data, setData] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/session', { cache: 'no-store' });
        const j = await res.json();
        if (!alive) return;
        if (j?.ok) {
          setData({
            user: j.user ?? null,
            session: j.session ?? null,
            org_id: j.org_id ?? null,
          });
          setError(null);
        } else {
          setError(j?.error?.message ?? 'Unknown error');
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Network error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    org_id: data?.org_id ?? null,
    loading,
    error,
  };
}
