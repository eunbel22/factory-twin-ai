"""스테이션 C 예측 워커.

station_c_raw의 최근 윈도우를 읽어 학습된 XGBoost 모델로 이상 확률을 예측하고,
SHAP으로 어떤 변수가 얼마나 기여했는지 계산해 station_c_predictions에 기록한다.
Vercel Functions가 아니라 이 워커가 별도로 실행되는 이유는 ARCHITECTURE.md 5절 참고
(콜드스타트/실행시간 제한 때문에 무거운 추론은 Function에서 하지 않음).

실행 전에 train_station_c_model.py를 한 번 실행해서 model/ 폴더를 만들어야 한다.
"""

import os
import time
from pathlib import Path

import numpy as np
import requests
import shap
import xgboost as xgb
from dotenv import load_dotenv

from features import extract_features

load_dotenv(Path(__file__).parents[2] / ".env")

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"].rstrip("/")
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

MODEL_PATH = Path(__file__).parent / "model" / "station_c_model.json"
WINDOW_SIZE = 50  # station_a/b_collector 배치 크기(10Hz * 5초)와 맞춤
POLL_SECONDS = 15


def load_model() -> xgb.XGBClassifier:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"{MODEL_PATH}가 없습니다. 먼저 `python train_station_c_model.py`를 실행하세요."
        )
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    return model


def fetch_latest_window() -> list[dict]:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/station_c_raw",
        headers=HEADERS,
        params={
            "select": "measured_at,vibration,temperature",
            "order": "measured_at.desc",
            "limit": WINDOW_SIZE,
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def write_prediction(window: list[dict], probability: float, shap_top3: list[dict]) -> None:
    measured_ats = [row["measured_at"] for row in window]
    payload = {
        "window_start": min(measured_ats),
        "window_end": max(measured_ats),
        "model": "xgboost",
        "probability": probability,
        "shap_top3": shap_top3,
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/station_c_predictions",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=payload,
        timeout=10,
    )
    resp.raise_for_status()


def run_once(model: xgb.XGBClassifier, explainer: shap.TreeExplainer) -> None:
    window = fetch_latest_window()
    if len(window) < 5:
        print(f"[predict] 데이터가 너무 적음 ({len(window)}건) — 건너뜀")
        return

    vibration = [row["vibration"] for row in window]
    temperature = [row["temperature"] for row in window if row["temperature"] is not None]
    features = extract_features(vibration, temperature)

    X = np.array([features])
    probability = float(model.predict_proba(X)[0, 1])

    shap_values = explainer.shap_values(X)[0]
    from features import FEATURE_NAMES

    contributions = sorted(
        zip(FEATURE_NAMES, features, shap_values),
        key=lambda item: abs(item[2]),
        reverse=True,
    )[:3]
    shap_top3 = [
        {"feature": name, "value": round(float(value), 4), "shap": round(float(shap_v), 4)}
        for name, value, shap_v in contributions
    ]

    write_prediction(window, probability, shap_top3)
    print(f"[predict] probability={probability:.3f} shap_top3={shap_top3}")


def main() -> None:
    model = load_model()
    explainer = shap.TreeExplainer(model)

    while True:
        try:
            run_once(model, explainer)
        except requests.RequestException as exc:
            print(f"[predict] 요청 실패: {exc}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
