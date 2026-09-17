import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rejectUnlessAuthorized } from '../_lib/auth.js'
import { getSupabaseServer } from '../_lib/supabaseServer.js'

/**
 * 스테이션 C (진동/온도 예지보전) 수집 엔드포인트.
 * 10Hz 이상으로 샘플링되는 스트림이라 배치로 받아 한 번에 insert한다.
 * 예측(LSTM/XGBoost)+SHAP는 여기서 계산하지 않는다 — 별도 Python 추론 워커가
 * station_c_raw를 주기적으로 읽어 station_c_predictions에 직접 기록한다
 * (ARCHITECTURE.md 5절 참고).
 *
 * body: { readings: { measured_at?: string, vibration: number, temperature?: number }[] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' })
    return
  }
  if (rejectUnlessAuthorized(req, res)) return

  const { readings } = req.body ?? {}

  if (!Array.isArray(readings) || readings.length === 0) {
    res.status(400).json({ error: 'readings는 비어있지 않은 배열이어야 합니다.' })
    return
  }
  if (readings.some((r) => typeof r.vibration !== 'number')) {
    res.status(400).json({ error: '각 reading은 vibration(number)을 포함해야 합니다.' })
    return
  }

  const supabase = getSupabaseServer()

  const rows = readings.map((r) => ({
    measured_at: r.measured_at ?? new Date().toISOString(),
    vibration: r.vibration,
    temperature: r.temperature ?? null,
  }))

  const { error } = await supabase.from('station_c_raw').insert(rows)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(201).json({ inserted: rows.length })
}
