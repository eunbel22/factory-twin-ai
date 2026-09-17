import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rejectUnlessAuthorized } from '../_lib/auth'
import { getSupabaseServer } from '../_lib/supabaseServer'

/**
 * 스테이션 A (입고 외관검사) 수집 엔드포인트.
 * 판정(양품/불량)은 Pi 쪽에서 이미 계산되어 넘어온다고 가정한다 — 이 함수는
 * 무거운 추론을 하지 않고 저장만 담당한다 (AGENTS.md 스택 규칙 참고).
 *
 * body: { image_path?: string, judgment: '양품' | '불량', confidence: number }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' })
    return
  }
  if (rejectUnlessAuthorized(req, res)) return

  const { image_path, judgment, confidence } = req.body ?? {}

  if (judgment !== '양품' && judgment !== '불량') {
    res.status(400).json({ error: "judgment는 '양품' 또는 '불량'이어야 합니다." })
    return
  }
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    res.status(400).json({ error: 'confidence는 0~1 사이 숫자여야 합니다.' })
    return
  }

  const supabase = getSupabaseServer()

  const { data: raw, error: rawError } = await supabase
    .from('station_a_raw')
    .insert({ image_path: image_path ?? null })
    .select('id')
    .single()

  if (rawError || !raw) {
    res.status(500).json({ error: rawError?.message ?? 'raw 저장 실패' })
    return
  }

  const { error: judgmentError } = await supabase
    .from('station_a_judgments')
    .insert({ raw_id: raw.id, judgment, confidence })

  if (judgmentError) {
    res.status(500).json({ error: judgmentError.message })
    return
  }

  res.status(201).json({ raw_id: raw.id })
}
