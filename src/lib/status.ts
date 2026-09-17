// 상태 색상은 카테고리 색상과 절대 섞이지 않는 고정 팔레트를 쓴다 (dataviz 스킬 참고).
export const STATUS_COLOR = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  unknown: '#9c9c94',
} as const

export type StatusLevel = keyof typeof STATUS_COLOR

export const STATUS_ICON: Record<StatusLevel, string> = {
  good: '✓',
  warning: '!',
  critical: '✕',
  unknown: '·',
}

export const STATUS_LABEL: Record<StatusLevel, string> = {
  good: '정상',
  warning: '주의',
  critical: '위험',
  unknown: '데이터 없음',
}

export function judgmentToLevel(judgment: string | null | undefined): StatusLevel {
  if (judgment === '양품') return 'good'
  if (judgment === '불량') return 'critical'
  if (judgment === '경고') return 'warning'
  return 'unknown'
}

export function probabilityToLevel(probability: number | null | undefined): StatusLevel {
  if (probability == null) return 'unknown'
  if (probability >= 0.7) return 'critical'
  if (probability >= 0.3) return 'warning'
  return 'good'
}

const LEVEL_RANK: Record<StatusLevel, number> = {
  unknown: 0,
  good: 1,
  warning: 2,
  critical: 3,
}

export function worstLevel(levels: StatusLevel[]): StatusLevel {
  return levels.reduce((worst, level) =>
    LEVEL_RANK[level] > LEVEL_RANK[worst] ? level : worst,
  )
}
