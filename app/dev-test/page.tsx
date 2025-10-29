'use client';

import { useActiveOrg } from '@/lib/hooks/useActiveOrg';
import { useServerSession } from '@/lib/hooks/useServerSession';

export default function DevTestPage() {
  const org = useActiveOrg();
  const sess = useServerSession();

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Dev Test</h1>

      <section style={{ marginTop: 16 }}>
        <h2>/api/org</h2>
        <pre>{JSON.stringify(org, null, 2)}</pre>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>/api/session</h2>
        <pre>{JSON.stringify(sess, null, 2)}</pre>
      </section>
    </div>
  );
}
