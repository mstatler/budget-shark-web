'use client';

import { useEffect, useState } from 'react';

type OrgPayload = { org_id: string | null };

export function useActiveOrg() {
  const [data, setData] = useState<OrgPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/org', { cache: 'no-store' });
        const j = await res.json();
        if (!alive) return;
        if (j?.ok) {
          setData({ org_id: j.org_id ?? null });
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

  return { org_id: data?.org_id ?? null, loading, error };
}
