import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// TODO: `supabase gen types typescript`로 Database 타입이 생기면 T=any 대신 적용할 것.
export function useLatestRows<T = any>(table: string, orderColumn: string, limit: number) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    async function fetchRows() {
      const { data } = await supabase
        .from(table)
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(limit)

      if (active) {
        setRows(((data ?? []) as T[]).reverse()) // 시간순(과거→최신)으로 뒤집기
        setLoading(false)
      }
    }

    fetchRows()

    const channel = supabase
      .channel(`realtime-list:${table}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          if (!active) return
          setRows((prev) => {
            const next = [...prev, payload.new as T]
            return next.length > limit ? next.slice(next.length - limit) : next
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [table, orderColumn, limit])

  return { rows, loading }
}
