import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  console.warn('⚠️  Supabase environment variables missing. Database will not be functional.')
}

// Use service role key on backend — bypasses RLS for trusted server operations
export const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
