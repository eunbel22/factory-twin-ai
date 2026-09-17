import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Raspberry Pi 수집 스크립트가 보내는 요청인지 확인한다.
 * INGEST_API_SECRET은 .env에서 관리하고 Pi 쪽 설정과 동일한 값을 공유해야 한다.
 * 실패 시 401 응답을 보내고 true를 반환한다 (호출부에서 `if (rejected) return` 패턴으로 사용).
 */
export function rejectUnlessAuthorized(
  req: VercelRequest,
  res: VercelResponse,
): boolean {
  const expected = process.env.INGEST_API_SECRET
  const provided = req.headers['x-ingest-secret']

  if (!expected) {
    res.status(500).json({ error: 'INGEST_API_SECRET이 서버에 설정되어 있지 않습니다.' })
    return true
  }

  if (provided !== expected) {
    res.status(401).json({ error: '인증 실패' })
    return true
  }

  return false
}
