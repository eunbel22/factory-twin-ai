function App() {
  const stations = [
    { id: 'A', name: '입고 외관검사', desc: 'AI Camera 양/불 판정' },
    { id: 'B', name: '중량 검사', desc: '무게/압력센서 기준치 검사' },
    { id: 'C', name: '예지보전', desc: '진동/온도 + LSTM/XGBoost + SHAP' },
  ]

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-bold text-neutral-900">MiniLine AI</h1>
      <p className="mt-1 text-sm text-neutral-500">
        미니 생산라인 디지털 트윈 대시보드 — 스캐폴딩 단계
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stations.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs font-semibold text-blue-600">
              스테이션 {s.id}
            </div>
            <div className="mt-1 font-semibold text-neutral-900">{s.name}</div>
            <div className="mt-1 text-sm text-neutral-500">{s.desc}</div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default App
