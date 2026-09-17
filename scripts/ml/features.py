"""스테이션 C 특징 추출 — 학습(train)과 추론(predict_worker) 양쪽에서 공유한다."""

import numpy as np

FEATURE_NAMES = [
    "vibration_mean",
    "vibration_std",
    "vibration_max",
    "temperature_mean",
]


def extract_features(vibration: list[float], temperature: list[float]) -> list[float]:
    vib = np.asarray(vibration, dtype=float)
    temp = np.asarray(temperature, dtype=float) if len(temperature) else np.array([np.nan])

    return [
        float(np.mean(vib)),
        float(np.std(vib)),
        float(np.max(vib)),
        float(np.nanmean(temp)) if not np.all(np.isnan(temp)) else 0.0,
    ]
