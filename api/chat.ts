import { GoogleGenAI } from '@google/genai'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseServer } from './_lib/supabaseServer.js'

const SYSTEM_PROMPT = `당신은 미니 생산라인 "MiniLine AI"의 현재 상태를 설명하는 어시스턴트입니다.
반드시 아래 [최신 데이터]에 있는 내용만 근거로 답변하세요. 데이터에 없는 내용은 추측하지 말고
모른다고 답하세요. 답변에는 어느 스테이션의 어떤 값(SHAP 변수 등)을 근거로 삼았는지 함께 언급하세요.
한국어로, 비전문가도 이해할 수 있게 간결한 문장으로 답하세요.`

async function buildContext() {
  const supabase = getSupabaseServer()

  const [stationA, stationB, stationC, threshold] = await Promise.all([
    supabase
      .from('station_a_judgments')
      .select('judgment, confidence, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('station_b_judgments')
      .select('status, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('station_c_predictions')
      .select('probability, shap_top3, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'station_c_risk_threshold')
      .maybeSingle(),
  ])

  return {
    station_a: stationA.data ?? null,
    station_b: stationB.data ?? null,
    station_c_prediction: stationC.data ?? null,
    station_c_risk_threshold: threshold.data?.value ?? null,
  }
}

function contextToText(context: Awaited<ReturnType<typeof buildContext>>): string {
  const lines: string[] = []

  lines.push(
    context.station_a
      ? `- 스테이션 A(외관검사) 최신 판정: ${context.station_a.judgment}, 신뢰도 ${(context.station_a.confidence * 100).toFixed(0)}% (${context.station_a.created_at})`
      : '- 스테이션 A: 아직 데이터 없음',
  )
  lines.push(
    context.station_b
      ? `- 스테이션 B(중량검사) 최신 판정: ${context.station_b.status}${context.station_b.reason ? ` (${context.station_b.reason})` : ''} (${context.station_b.created_at})`
      : '- 스테이션 B: 아직 데이터 없음',
  )
  lines.push(
    context.station_c_prediction
      ? `- 스테이션 C(예지보전) 최신 예측: 이상 확률 ${(context.station_c_prediction.probability * 100).toFixed(1)}%, SHAP 근거 상위 3개: ${JSON.stringify(context.station_c_prediction.shap_top3)} (${context.station_c_prediction.created_at})`
      : '- 스테이션 C: 아직 예측 데이터 없음',
  )
  if (context.station_c_risk_threshold) {
    lines.push(`- 스테이션 C 위험 임계치 설정: ${JSON.stringify(context.station_c_risk_threshold)}`)
  }

  return lines.join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY가 서버에 설정되어 있지 않습니다.' })
    return
  }

  const { question } = req.body ?? {}
  if (typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'question은 비어있지 않은 문자열이어야 합니다.' })
    return
  }

  const context = await buildContext()
  const contextText = contextToText(context)

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: question,
    config: {
      systemInstruction: `${SYSTEM_PROMPT}\n\n[최신 데이터]\n${contextText}`,
    },
  })

  const answer = response.text ?? ''

  const supabase = getSupabaseServer()
  await supabase.from('chat_logs').insert({
    question,
    context_snapshot: context,
    answer,
  })

  res.status(200).json({ answer })
}
