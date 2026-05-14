import { createClient } from '@supabase/supabase-js'

/* Single browser-wide Supabase client.
   Explicit auth config (rather than relying on supabase-js defaults) so:
   - persistSession survives a hard refresh (token in localStorage)
   - autoRefreshToken silently rotates expiring access tokens
   - detectSessionInUrl handles email-confirmation / magic-link callbacks
   - storageKey is pinned so two builds on the same origin don't collide
   - flowType: 'pkce' is the recommended modern flow and rehydrates more
     reliably than 'implicit' on page refresh. */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
      storage:            typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey:         'nexus101-auth',
      flowType:           'pkce',
    },
  },
)
