import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rejectUnlessAuthorized } from '../_lib/auth.js'
import { getSupabaseServer } from '../_lib/supabaseServer.js'

/**
 * 스테이션 B (중량 검사) 수집 엔드포인트.
 * 판정 로직(±5% 기준)은 단순 산술이라 여기서 직접 계산한다 — settings 테이블의
 * station_b_target_weight_g 값을 기준으로 한다 (PRD.md 3절).
 *
 * body: { weight_g: number, pressure_kpa?: number }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' })
    return
  }
  if (rejectUnlessAuthorized(req, res)) return

  const { weight_g, pressure_kpa } = req.body ?? {}

  if (typeof weight_g !== 'number') {
    res.status(400).json({ error: 'weight_g는 숫자여야 합니다.' })
    return
  }

  const supabase = getSupabaseServer()

  const { data: settingRow, error: settingError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'station_b_target_weight_g')
    .single()

  if (settingError || !settingRow) {
    res.status(500).json({ error: settingError?.message ?? '기준값 조회 실패' })
    return
  }

  const { target, tolerance_pct } = settingRow.value as {
    target: number
    tolerance_pct: number
  }
  const deviationPct = (Math.abs(weight_g - target) / target) * 100
  const status = deviationPct <= tolerance_pct ? '양품' : '불량'
  const reason =
    status === '양품'
      ? null
      : `기준 ${target}g 대비 ${deviationPct.toFixed(1)}% 이탈 (허용 ${tolerance_pct}%)`

  const { data: raw, error: rawError } = await supabase
    .from('station_b_raw')
    .insert({ weight_g, pressure_kpa: pressure_kpa ?? null })
    .select('id')
    .single()

  if (rawError || !raw) {
    res.status(500).json({ error: rawError?.message ?? 'raw 저장 실패' })
    return
  }

  const { error: judgmentError } = await supabase
    .from('station_b_judgments')
    .insert({ raw_id: raw.id, status, reason })

  if (judgmentError) {
    res.status(500).json({ error: judgmentError.message })
    return
  }

  res.status(201).json({ raw_id: raw.id, status })
}
