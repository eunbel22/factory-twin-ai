"""스테이션 C 예지보전 모델 학습 스크립트.

실제 하드웨어에서 라벨링된 고장/정상 데이터가 아직 없으므로, 지금은 합성(synthetic)
데이터로 학습한 '자리표시자(placeholder)' 모델이다. 목적은 정확도가 아니라
파이프라인(수집 → 추론 → SHAP 해석 → 저장 → 챗봇 응답)이 끝까지 동작하는 것을
증명하는 것이다.

실제 하드웨어 연결 후 할 일:
  1. 정상/이상 상태에서 실제로 수집된 station_c_raw 데이터에 라벨을 붙여
     `generate_synthetic_windows()`를 실제 데이터 로딩 함수로 교체
  2. KSTECH 다이벽 프로젝트에서 썼던 것처럼 Optuna로 하이퍼파라미터 튜닝 추가 고려
"""

import json
from pathlib import Path

import numpy as np
import xgboost as xgb
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from features import FEATURE_NAMES, extract_features

MODEL_DIR = Path(__file__).parent / "model"
RNG = np.random.default_rng(42)


def generate_synthetic_windows(n_normal: int = 1700, n_anomaly: int = 300):
    """정상/이상 진동·온도 윈도우를 합성 생성한다 (윈도우당 50개 샘플 = 5초치)."""
    rows = []
    labels = []

    for _ in range(n_normal):
        vibration = RNG.normal(0.15, 0.03, size=50).clip(min=0)
        temperature = RNG.normal(38, 2, size=50)
        rows.append(extract_features(vibration.tolist(), temperature.tolist()))
        labels.append(0)

    for _ in range(n_anomaly):
        # 이상 상태: 평균 진동이 높고, 가끔 스파이크가 섞임
        vibration = RNG.normal(0.4, 0.1, size=50).clip(min=0)
        spike_idx = RNG.choice(50, size=5, replace=False)
        vibration[spike_idx] += RNG.normal(0.3, 0.05, size=5)
        temperature = RNG.normal(43, 3, size=50)
        rows.append(extract_features(vibration.tolist(), temperature.tolist()))
        labels.append(1)

    return np.array(rows), np.array(labels)


def main() -> None:
    X, y = generate_synthetic_windows()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=3,
        learning_rate=0.1,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    print(f"검증 AUC (합성 데이터 기준): {auc:.4f}")

    MODEL_DIR.mkdir(exist_ok=True)
    model.save_model(MODEL_DIR / "station_c_model.json")
    (MODEL_DIR / "feature_names.json").write_text(
        json.dumps(FEATURE_NAMES, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"모델 저장 완료 -> {MODEL_DIR}")


if __name__ == "__main__":
    main()
