import { createClient } from '@supabase/supabase-js'

// TODO: `supabase gen types typescript`로 생성한 Database 타입이 생기면 any 대신 적용할 것.
let client: ReturnType<typeof createClient<any>> | null = null

/**
 * 서비스 롤 키를 쓰는 서버 전용 클라이언트. RLS를 우회하므로 Vercel Functions
 * 안에서만 사용하고, 절대 프론트엔드 번들에 포함되지 않도록 한다.
 */
export function getSupabaseServer() {
  if (client) return client

  const url = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.',
    )
  }

  client = createClient<any>(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
  return client
}
