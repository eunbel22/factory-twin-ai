"""스테이션 C — 진동/온도 예지보전 수집 스크립트 (핵심 스테이션).

실제 하드웨어(MCP3008 + 진동/모터 키트) 연결 전까지는 SIMULATE 모드로 동작한다.
10Hz로 샘플링한다는 PRD.md 요구사항을 맞추기 위해, 1초 분량(10개)을 모아
배치로 전송한다. 예측(LSTM/XGBoost)+SHAP 계산은 이 스크립트의 책임이 아니다 —
별도 Python 추론 워커가 station_c_raw를 읽어 처리한다 (5-6주차 작업).

하드웨어 연결 후 할 일:
  1. `read_vibration_temperature()`를 실제 MCP3008 SPI 판독 코드로 교체
  2. tech_planning.html의 "하드웨어 배선도/핀맵" 탭에서 SPI 채널 매핑 확인
  3. 진짜로 10Hz를 보장하려면 sleep 대신 타이머 기반 스케줄링 고려
"""

import random
import time
from datetime import datetime, timezone

import requests

from config import API_BASE_URL, INGEST_SECRET, SIMULATE

SAMPLE_HZ = 10
BATCH_SECONDS = 1


def read_vibration_temperature() -> tuple[float, float]:
    if SIMULATE:
        vibration = round(random.uniform(0.1, 0.3), 3)  # 평상시 낮은 진동
        temperature = round(random.uniform(35, 45), 1)
        return vibration, temperature

    # TODO: 실제 MCP3008 SPI 판독으로 교체
    raise NotImplementedError("실제 하드웨어 연동이 아직 구현되지 않았습니다.")


def send_batch(readings: list[dict]) -> None:
    resp = requests.post(
        f"{API_BASE_URL}/api/ingest/station-c",
        json={"readings": readings},
        headers={"x-ingest-secret": INGEST_SECRET},
        timeout=5,
    )
    resp.raise_for_status()
    print(f"[station-c] {len(readings)}건 전송 -> {resp.json()}")


def main() -> None:
    while True:
        batch = []
        for _ in range(SAMPLE_HZ * BATCH_SECONDS):
            vibration, temperature = read_vibration_temperature()
            batch.append(
                {
                    "measured_at": datetime.now(timezone.utc).isoformat(),
                    "vibration": vibration,
                    "temperature": temperature,
                }
            )
            time.sleep(1 / SAMPLE_HZ)

        try:
            send_batch(batch)
        except requests.RequestException as exc:
            print(f"[station-c] 전송 실패: {exc}")


if __name__ == "__main__":
    main()
