'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

export default function Page() {
  const [result, setResult] = useState<'...' | 'same-instance' | 'error'>('...');

  useEffect(() => {
    try {
      const a = getBrowserClient();
      const b = getBrowserClient();
      setResult(a === b ? 'same-instance' : 'error');

      // touch auth to ensure the client is functional
      a.auth.getSession().catch(console.error);
    } catch (e) {
      console.error(e);
      setResult('error');
    }
  }, []);

  return <pre>browser client: {result}</pre>;
}
