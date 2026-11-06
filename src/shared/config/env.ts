import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): AppEnv {
  return envSchema.parse(source);
}

export function getEnv(): AppEnv {
  return parseEnv(import.meta.env);
}
