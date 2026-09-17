import { useState } from 'react'

type Point = { vibration: number; measured_at: string }

const WIDTH = 600
const HEIGHT = 140
const PAD_X = 8
const PAD_Y = 16

export function VibrationChart({ points }: { points: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length < 2) {
    return (
      <div className="flex h-[140px] items-center justify-center text-sm text-neutral-400">
        데이터가 쌓이면 진동 추이가 여기에 표시됩니다
      </div>
    )
  }

  const values = points.map((p) => p.vibration)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const x = (i: number) =>
    PAD_X + (i / (points.length - 1)) * (WIDTH - PAD_X * 2)
  const y = (v: number) =>
    HEIGHT - PAD_Y - ((v - min) / range) * (HEIGHT - PAD_Y * 2)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.vibration)}`).join(' ')
  const gridLines = [0.25, 0.5, 0.75].map((t) => HEIGHT - PAD_Y - t * (HEIGHT - PAD_Y * 2))

  const hovered = hoverIndex != null ? points[hoverIndex] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
          const idx = Math.round(
            ((relX - PAD_X) / (WIDTH - PAD_X * 2)) * (points.length - 1),
          )
          setHoverIndex(Math.min(Math.max(idx, 0), points.length - 1))
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((gy, i) => (
          <line key={i} x1={PAD_X} x2={WIDTH - PAD_X} y1={gy} y2={gy} stroke="#e1e0d9" strokeWidth={1} />
        ))}

        <path d={path} fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hoverIndex != null && (
          <>
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={PAD_Y}
              y2={HEIGHT - PAD_Y}
              stroke="#898781"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={x(hoverIndex)} cy={y(points[hoverIndex].vibration)} r={4} fill="#2a78d6" />
          </>
        )}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute top-0 rounded bg-neutral-900 px-2 py-1 text-[11px] text-white shadow"
          style={{
            left: `${(x(hoverIndex!) / WIDTH) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          진동 {hovered.vibration.toFixed(3)} ·{' '}
          {new Date(hovered.measured_at).toLocaleTimeString('ko-KR', { hour12: false })}
        </div>
      )}
    </div>
  )
}
