# Pi Collector (시뮬레이터 모드)

하드웨어 조립 전까지 Vercel Functions + Supabase 파이프라인을 검증하기 위한 스크립트입니다.
기본값은 `SIMULATE=true`로, 가짜 센서값을 생성해 API로 전송합니다.

## 로컬 실행

```bash
pip install -r requirements.txt

# 터미널 1: Vercel Functions를 로컬에서 실행
npx vercel dev

# 터미널 2~4: 각 스테이션 스크립트 실행 (환경변수는 .env 값과 맞출 것)
export MINILINE_API_BASE_URL=http://localhost:3000
export INGEST_API_SECRET=<.env의 INGEST_API_SECRET 값>
python station_a.py
python station_b.py
python station_c.py
```

## 실제 하드웨어 연결 시

각 `station_*.py`의 `read_*` 함수 안 `NotImplementedError`를 실제 센서 판독 코드로 교체하고,
환경변수 `MINILINE_SIMULATE=false`로 설정하세요. 배선/핀맵은 `서류/tech_planning.html`의
"하드웨어 배선도/핀맵" 탭을 참고하세요 (단, 정확한 핀 번호는 실제 모듈 데이터시트로 재확인 필요).
