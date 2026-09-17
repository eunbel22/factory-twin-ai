"""스테이션 B — 중량 검사 수집 스크립트.

실제 하드웨어(무게센서 A4 + 압력센서 PA6H1F1549) 연결 전까지는 SIMULATE 모드로
동작하며, 기준 중량(100g) 근처의 무작위 값을 생성해 판정 로직(서버 측)까지
포함한 파이프라인을 미리 검증한다.

하드웨어 연결 후 할 일:
  1. `read_sensors()`를 실제 센서 판독 코드로 교체
     (예: HX711로 무게 읽기, MCP3008 채널로 압력 읽기)
  2. tech_planning.html의 "하드웨어 배선도/핀맵" 탭 참고
"""

import random
import time

import requests

from config import API_BASE_URL, INGEST_SECRET, SIMULATE


def read_sensors() -> tuple[float, float]:
    if SIMULATE:
        # 대부분 정상(100g ±3%), 가끔 기준 이탈(불량) 샘플 섞기
        if random.random() < 0.15:
            weight = random.choice([88, 112])  # 명백히 ±5% 밖
        else:
            weight = round(random.uniform(97, 103), 1)
        pressure = round(random.uniform(95, 105), 1)
        return weight, pressure

    # TODO: 실제 센서 판독으로 교체
    raise NotImplementedError("실제 하드웨어 연동이 아직 구현되지 않았습니다.")


def send(weight_g: float, pressure_kpa: float) -> None:
    resp = requests.post(
        f"{API_BASE_URL}/api/ingest/station-b",
        json={"weight_g": weight_g, "pressure_kpa": pressure_kpa},
        headers={"x-ingest-secret": INGEST_SECRET},
        timeout=5,
    )
    resp.raise_for_status()
    print(f"[station-b] {weight_g}g / {pressure_kpa}kPa -> {resp.json()}")


def main() -> None:
    while True:
        weight_g, pressure_kpa = read_sensors()
        try:
            send(weight_g, pressure_kpa)
        except requests.RequestException as exc:
            print(f"[station-b] 전송 실패: {exc}")
        time.sleep(5)


if __name__ == "__main__":
    main()
