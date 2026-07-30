import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

/** Demo mode: runs fully in the browser with fake data and no backend.
 *  Auto-on until a real Kona Supabase project is wired up (placeholder URL),
 *  or forced with VITE_DEMO=1. Flips to the real DB automatically once the
 *  Kona URL + key are set in .env.local. */
export const DEMO =
  import.meta.env.VITE_DEMO === '1' ||
  !url || url.includes('placeholder') || !key || key.includes('placeholder')

export const supabase = createClient(
  DEMO ? 'https://demo.invalid' : url,
  DEMO ? 'demo-anon-key' : key,
)
