import { useLatestRow } from '../hooks/useLatestRow'

type StationARaw = {
  image_path: string | null
  captured_at: string
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
// TODO: 실제 카메라 업로드 구현 시 이 버킷을 Supabase Storage에 만들고 이름을 맞출 것.
const IMAGE_BUCKET = 'station-a-images'

function Placeholder({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center">
      <div className="text-3xl">📷</div>
      <div className="text-sm font-medium text-neutral-500">{label}</div>
      <div className="max-w-xs text-xs text-neutral-400">{note}</div>
    </div>
  )
}

export function CameraFeed() {
  const { row, loading } = useLatestRow<StationARaw>('station_a_raw', 'captured_at')

  const imageUrl =
    row?.image_path && SUPABASE_URL
      ? `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${row.image_path}`
      : null

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-blue-600">스테이션 A</div>
        <div className="mt-1 mb-3 font-semibold text-neutral-900">외관검사 카메라</div>

        {loading ? (
          <div className="h-56 animate-pulse rounded-lg bg-neutral-100" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="스테이션 A 최근 촬영"
            className="h-56 w-full rounded-lg object-cover"
          />
        ) : (
          <Placeholder
            label="카메라 연결 대기 중"
            note="Raspberry Pi AI Camera가 연결되고 이미지 업로드가 구현되면 최근 촬영본이 여기에 표시됩니다."
          />
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-blue-600">상시 감시</div>
        <div className="mt-1 mb-3 font-semibold text-neutral-900">IR-CUT 카메라</div>

        <Placeholder
          label="카메라 연결 대기 중"
          note="저조도 라인 전체 감시용 IR-CUT 카메라가 연결되면 실시간 스트림 또는 주기 캡처가 여기에 표시됩니다."
        />
      </div>
    </div>
  )
}
