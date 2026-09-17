import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// TODO: `supabase gen types typescript`로 Database 타입이 생기면 T=any 대신 적용할 것.
export function useLatestRow<T = any>(table: string, orderColumn: string) {
  const [row, setRow] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    async function fetchLatest() {
      const { data } = await supabase
        .from(table)
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(1)
        .maybeSingle()

      if (active) {
        setRow(data as T | null)
        setLoading(false)
      }
    }

    fetchLatest()

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          if (active) setRow(payload.new as T)
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [table, orderColumn])

  return { row, loading }
}
