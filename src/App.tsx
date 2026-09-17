import { StatusBadge } from './components/StatusBadge'
import { useLatestRow } from './hooks/useLatestRow'

type StationAJudgment = {
  judgment: '양품' | '불량'
  confidence: number
  created_at: string
}

type StationBJudgment = {
  status: '양품' | '불량' | '경고'
  reason: string | null
  created_at: string
}

type StationCRaw = {
  vibration: number
  temperature: number | null
  measured_at: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour12: false })
}

function StationA() {
  const { row, loading } = useLatestRow<StationAJudgment>(
    'station_a_judgments',
    'created_at',
  )

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">스테이션 A</div>
      <div className="mt-1 font-semibold text-neutral-900">입고 외관검사</div>
      <div className="mt-1 text-sm text-neutral-500">AI Camera 양/불 판정</div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {loading ? (
          <div className="text-sm text-neutral-400">불러오는 중...</div>
        ) : row ? (
          <>
            <StatusBadge status={row.judgment} />
            <span className="ml-2 text-sm text-neutral-500">
              신뢰도 {(row.confidence * 100).toFixed(0)}%
            </span>
            <div className="mt-1 text-xs text-neutral-400">
              {formatTime(row.created_at)} 갱신
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">아직 데이터 없음</div>
        )}
      </div>
    </div>
  )
}

function StationB() {
  const { row, loading } = useLatestRow<StationBJudgment>(
    'station_b_judgments',
    'created_at',
  )

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">스테이션 B</div>
      <div className="mt-1 font-semibold text-neutral-900">중량 검사</div>
      <div className="mt-1 text-sm text-neutral-500">무게/압력센서 기준치 검사</div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {loading ? (
          <div className="text-sm text-neutral-400">불러오는 중...</div>
        ) : row ? (
          <>
            <StatusBadge status={row.status} />
            {row.reason && (
              <div className="mt-1 text-sm text-neutral-500">{row.reason}</div>
            )}
            <div className="mt-1 text-xs text-neutral-400">
              {formatTime(row.created_at)} 갱신
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">아직 데이터 없음</div>
        )}
      </div>
    </div>
  )
}

function StationC() {
  const { row, loading } = useLatestRow<StationCRaw>('station_c_raw', 'measured_at')

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">스테이션 C</div>
      <div className="mt-1 font-semibold text-neutral-900">예지보전</div>
      <div className="mt-1 text-sm text-neutral-500">
        진동/온도 + LSTM/XGBoost + SHAP
      </div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {loading ? (
          <div className="text-sm text-neutral-400">불러오는 중...</div>
        ) : row ? (
          <>
            <div className="text-sm text-neutral-700">
              진동 {row.vibration.toFixed(3)}
              {row.temperature != null && ` · 온도 ${row.temperature.toFixed(1)}°C`}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {formatTime(row.measured_at)} 갱신 · 예측 모델 연동 전
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">아직 데이터 없음</div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-bold text-neutral-900">MiniLine AI</h1>
      <p className="mt-1 text-sm text-neutral-500">
        미니 생산라인 디지털 트윈 대시보드 — Supabase Realtime 연동
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StationA />
        <StationB />
        <StationC />
      </div>
    </main>
  )
}

export default App
