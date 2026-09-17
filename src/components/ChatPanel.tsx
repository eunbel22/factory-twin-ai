import { useState } from 'react'
import { formatChatText } from './formatChatText'

type Message = {
  role: 'user' | 'assistant'
  text: string
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    const question = input.trim()
    if (!question || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await resp.json()

      if (!resp.ok) {
        setError(data.error ?? '알 수 없는 오류가 발생했습니다.')
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }])
    } catch {
      setError('요청에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-blue-600">챗봇</div>
      <div className="mt-1 font-semibold text-neutral-900">라인 상태 질의</div>

      <div className="mt-3 flex max-h-96 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-sm text-neutral-400">
            예: "지금 라인 상태 어때?", "스테이션 C 왜 위험해?"
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white'
                : 'mr-auto max-w-[95%] rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-800'
            }
          >
            {m.role === 'assistant' ? formatChatText(m.text) : m.text}
          </div>
        ))}
        {sending && <div className="text-sm text-neutral-400">생각하는 중...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
        <input
          className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="질문을 입력하세요"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  )
}
