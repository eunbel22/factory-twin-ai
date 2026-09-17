import os

# Vercel Functions 배포 후 실제 URL로 교체 (로컬 개발 중이면 `vercel dev` 주소 사용)
API_BASE_URL = os.environ.get("MINILINE_API_BASE_URL", "http://localhost:3000")
INGEST_SECRET = os.environ.get("INGEST_API_SECRET", "")

# True: 하드웨어 없이 가짜 데이터로 파이프라인 전체를 시험
# False: 실제 센서를 읽음 (하드웨어 연결 후 각 station_*.py의 read_* 함수 구현 필요)
SIMULATE = os.environ.get("MINILINE_SIMULATE", "true").lower() != "false"
