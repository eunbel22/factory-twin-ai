import type { ReactNode } from 'react'

/**
 * Gemini 응답에 섞여 오는 아주 기본적인 마크다운(굵게, 목록, 줄바꿈)만 렌더링한다.
 * LLM이 생성한 텍스트이므로 dangerouslySetInnerHTML은 쓰지 않고 React 엘리먼트로만 구성한다.
 */
function renderInline(line: string): ReactNode[] {
  return line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function formatChatText(text: string): ReactNode {
  const lines = text.split('\n').filter((line) => line.trim().length > 0)

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ')

        if (isBullet) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-neutral-400">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          )
        }

        return <div key={i}>{renderInline(trimmed)}</div>
      })}
    </div>
  )
}
