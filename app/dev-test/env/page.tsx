'use client';

function mask(s: string) {
  if (!s) return '(missing)';
  if (s.length <= 20) return s; // short ones show fully
  return s.slice(0, 12) + '…' + s.slice(-4);
}

export default function EnvCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return (
    <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
      NEXT_PUBLIC_SUPABASE_URL: {mask(url)}
      {'\n'}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {mask(key)}
    </pre>
  );
}
