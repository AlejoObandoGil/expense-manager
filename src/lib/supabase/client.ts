import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components (auth UI: login,
 * signup, logout). Uses the `NEXT_PUBLIC_*` env vars because this is the
 * only one of the three Supabase client files that runs in the browser.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
