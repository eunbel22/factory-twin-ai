"""스테이션 A — 입고 외관검사 수집 스크립트.

실제 하드웨어(Raspberry Pi AI Camera) 연결 전까지는 SIMULATE 모드로 동작하며,
카메라 촬영 대신 무작위 판정을 생성해 파이프라인 전체(Vercel Functions → Supabase)를
미리 검증할 수 있게 한다.

하드웨어 연결 후 할 일:
  1. `read_judgment()`를 실제 AI Camera 추론 코드로 교체
     (예: picamera2로 프레임 캡처 → 로컬 경량 분류 모델 추론)
  2. tech_planning.html의 "하드웨어 배선도/핀맵" 탭에서 CSI 연결 확인
"""

import random
import time

import requests

from config import API_BASE_URL, INGEST_SECRET, SIMULATE


def read_judgment() -> tuple[str, float]:
    if SIMULATE:
        judgment = random.choices(["양품", "불량"], weights=[0.9, 0.1])[0]
        confidence = round(random.uniform(0.7, 0.99), 2)
        return judgment, confidence

    # TODO: 실제 AI Camera 추론으로 교체
    raise NotImplementedError("실제 하드웨어 연동이 아직 구현되지 않았습니다.")


def send(judgment: str, confidence: float) -> None:
    resp = requests.post(
        f"{API_BASE_URL}/api/ingest/station-a",
        json={"judgment": judgment, "confidence": confidence},
        headers={"x-ingest-secret": INGEST_SECRET},
        timeout=5,
    )
    resp.raise_for_status()
    print(f"[station-a] {judgment} ({confidence}) -> {resp.json()}")


def main() -> None:
    while True:
        judgment, confidence = read_judgment()
        try:
            send(judgment, confidence)
        except requests.RequestException as exc:
            print(f"[station-a] 전송 실패: {exc}")
        time.sleep(5)  # 물체가 검사대에 도착하는 주기를 가정 (실측 시 조정)


if __name__ == "__main__":
    main()
