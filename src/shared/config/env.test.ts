import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepts a valid public Supabase configuration', () => {
    expect(
      parseEnv({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'public-key',
      }),
    ).toEqual({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'public-key',
    });
  });

  it('rejects an invalid URL', () => {
    expect(() =>
      parseEnv({
        VITE_SUPABASE_URL: 'not-a-url',
        VITE_SUPABASE_ANON_KEY: 'public-key',
      }),
    ).toThrow();
  });
});
