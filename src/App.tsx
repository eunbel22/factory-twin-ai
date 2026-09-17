import { useState } from 'react'
import { CameraFeed } from './components/CameraFeed'
import { ChatPanel } from './components/ChatPanel'
import { LineVisualization, type LineVisualizationNode } from './components/LineVisualization'
import { StatusBadge } from './components/StatusBadge'
import { SummaryBanner } from './components/SummaryBanner'
import { VibrationChart } from './components/VibrationChart'
import { useLatestRow } from './hooks/useLatestRow'
import { useLatestRows } from './hooks/useLatestRows'
import { useNow } from './hooks/useNow'
import { formatRelativeTime } from './lib/time'
import { judgmentToLevel, probabilityToLevel, worstLevel } from './lib/status'

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

type StationCPrediction = {
  probability: number
  shap_top3: { feature: string; value: number; shap: number }[]
  created_at: string
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
      <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
    </div>
  )
}

function StationA({
  row,
  loading,
  now,
}: {
  row: StationAJudgment | null
  loading: boolean
  now: number
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">스테이션 A</div>
      <div className="mt-1 font-semibold text-neutral-900">입고 외관검사</div>
      <div className="mt-1 text-sm text-neutral-500">AI Camera 양/불 판정</div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {loading ? (
          <Skeleton />
        ) : row ? (
          <>
            <StatusBadge status={row.judgment} />
            <span className="ml-2 text-sm text-neutral-500">
              신뢰도 {(row.confidence * 100).toFixed(0)}%
            </span>
            <div className="mt-1 text-xs text-neutral-400">
              {formatRelativeTime(row.created_at, now)} 갱신
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">아직 데이터 없음</div>
        )}
      </div>
    </div>
  )
}

function StationB({
  row,
  loading,
  now,
}: {
  row: StationBJudgment | null
  loading: boolean
  now: number
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">스테이션 B</div>
      <div className="mt-1 font-semibold text-neutral-900">중량 검사</div>
      <div className="mt-1 text-sm text-neutral-500">무게/압력센서 기준치 검사</div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {loading ? (
          <Skeleton />
        ) : row ? (
          <>
            <StatusBadge status={row.status} />
            {row.reason && (
              <div className="mt-1 text-sm text-neutral-500">{row.reason}</div>
            )}
            <div className="mt-1 text-xs text-neutral-400">
              {formatRelativeTime(row.created_at, now)} 갱신
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">아직 데이터 없음</div>
        )}
      </div>
    </div>
  )
}

function StationC({
  prediction,
  predictionLoading,
  now,
}: {
  prediction: StationCPrediction | null
  predictionLoading: boolean
  now: number
}) {
  const { row, loading } = useLatestRow<StationCRaw>('station_c_raw', 'measured_at')
  const { rows: history } = useLatestRows<StationCRaw>('station_c_raw', 'measured_at', 40)

  const riskPct = prediction ? prediction.probability * 100 : null
  const riskLevel = probabilityToLevel(prediction?.probability)
  const riskColor =
    riskLevel === 'critical'
      ? 'text-red-600'
      : riskLevel === 'warning'
        ? 'text-amber-600'
        : riskLevel === 'good'
          ? 'text-emerald-600'
          : 'text-neutral-400'

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">스테이션 C</div>
      <div className="mt-1 font-semibold text-neutral-900">예지보전</div>
      <div className="mt-1 text-sm text-neutral-500">
        진동/온도 + LSTM/XGBoost + SHAP
      </div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {loading ? (
          <Skeleton />
        ) : row ? (
          <>
            <div className="text-sm text-neutral-700">
              진동 {row.vibration.toFixed(3)}
              {row.temperature != null && ` · 온도 ${row.temperature.toFixed(1)}°C`}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {formatRelativeTime(row.measured_at, now)} 갱신
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">아직 데이터 없음</div>
        )}
      </div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        <VibrationChart points={history} />
      </div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {predictionLoading ? (
          <Skeleton />
        ) : prediction ? (
          <>
            <div className={`text-sm font-semibold ${riskColor}`}>
              이상 확률 {riskPct!.toFixed(1)}%
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              근거: {prediction.shap_top3[0]?.feature ?? '-'}
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {formatRelativeTime(prediction.created_at, now)} 예측
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-400">예측 결과 없음 (워커 미실행)</div>
        )}
      </div>
    </div>
  )
}

function Overview() {
  const now = useNow()
  const a = useLatestRow<StationAJudgment>('station_a_judgments', 'created_at')
  const b = useLatestRow<StationBJudgment>('station_b_judgments', 'created_at')
  const c = useLatestRow<StationCPrediction>('station_c_predictions', 'created_at')

  const nodes: LineVisualizationNode[] = [
    {
      key: 'a',
      label: 'A. 외관검사',
      sublabel: a.row?.judgment ?? '대기 중',
      level: judgmentToLevel(a.row?.judgment),
    },
    {
      key: 'b',
      label: 'B. 중량검사',
      sublabel: b.row?.status ?? '대기 중',
      level: judgmentToLevel(b.row?.status),
    },
    {
      key: 'c',
      label: 'C. 예지보전',
      sublabel: c.row ? `이상확률 ${(c.row.probability * 100).toFixed(0)}%` : '대기 중',
      level: probabilityToLevel(c.row?.probability),
    },
  ]
  const overall = worstLevel(nodes.map((n) => n.level))

  return (
    <div className="space-y-4">
      <SummaryBanner level={overall} />
      <LineVisualization nodes={nodes} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StationA row={a.row} loading={a.loading} now={now} />
        <StationB row={b.row} loading={b.loading} now={now} />
        <StationC prediction={c.row} predictionLoading={c.loading} now={now} />
      </div>

      <ChatPanel />
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<'overview' | 'camera'>('overview')

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-bold text-neutral-900">MiniLine AI</h1>
      <p className="mt-1 text-sm text-neutral-500">
        미니 생산라인 디지털 트윈 대시보드 — Supabase Realtime 연동
      </p>

      <div className="mt-6 flex gap-1 border-b border-neutral-200">
        {(
          [
            ['overview', '라인 현황'],
            ['camera', '카메라'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === 'overview' ? <Overview /> : <CameraFeed />}</div>
    </main>
  )
}

export default App
