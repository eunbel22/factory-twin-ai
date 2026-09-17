import { STATUS_COLOR, STATUS_ICON, type StatusLevel } from '../lib/status'

const MESSAGE: Record<StatusLevel, string> = {
  good: '정상 가동 중입니다',
  warning: '주의가 필요한 신호가 있습니다',
  critical: '즉시 확인이 필요합니다',
  unknown: '아직 데이터가 충분하지 않습니다',
}

export function SummaryBanner({ level }: { level: StatusLevel }) {
  const color = STATUS_COLOR[level]

  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-4 py-3"
      style={{ borderColor: color, backgroundColor: `${color}14` }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {STATUS_ICON[level]}
      </span>
      <div className="text-sm font-semibold text-neutral-900">
        라인 전체 상태: {MESSAGE[level]}
      </div>
    </div>
  )
}
