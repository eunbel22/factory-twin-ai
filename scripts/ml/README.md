# 스테이션 C 예측 워커

`station_c_raw`의 최근 데이터를 읽어 XGBoost로 이상 확률을 예측하고, SHAP으로 근거를
계산해 `station_c_predictions`에 기록합니다.

⚠️ 지금 모델은 **실제 하드웨어 데이터가 아니라 합성(synthetic) 데이터로 학습한
자리표시자**입니다. 정확도가 목적이 아니라 파이프라인 전체(수집 → 추론 → SHAP →
저장 → 대시보드/챗봇)가 끝까지 동작하는 것을 증명하는 용도입니다. 실제 하드웨어에서
라벨링된 데이터가 쌓이면 `train_station_c_model.py`의 `generate_synthetic_windows()`를
실제 데이터 로딩 함수로 교체하고 재학습하세요.

## 실행

```bash
pip install -r requirements.txt

# 1) 모델 학습 (한 번만, 또는 재학습할 때마다)
python train_station_c_model.py

# 2) 예측 워커 실행 (15초마다 최신 윈도우로 추론)
python predict_worker.py
```

`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 프로젝트 루트의 `.env`에서 자동으로
읽어옵니다 (`python-dotenv`).

## 특징(feature)

`features.py`에서 학습/추론이 특징 추출 로직을 공유합니다. 현재는 진동 평균/표준편차/최댓값,
온도 평균 4개만 씁니다 — 실제 데이터로 넘어가면 주파수 영역 특징(FFT) 등을 추가로
고려해볼 수 있습니다.
