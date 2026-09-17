import { useEffect, useState } from 'react'

/** 상대시간("n초 전")이 계속 최신으로 보이게 주기적으로 리렌더를 트리거한다. */
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
