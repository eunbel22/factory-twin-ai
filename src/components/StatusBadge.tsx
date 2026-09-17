const COLORS: Record<string, string> = {
  양품: 'bg-emerald-100 text-emerald-700',
  불량: 'bg-red-100 text-red-700',
  경고: 'bg-amber-100 text-amber-700',
}

export function StatusBadge({ status }: { status: string }) {
  const className = COLORS[status] ?? 'bg-neutral-100 text-neutral-600'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {status}
    </span>
  )
}
