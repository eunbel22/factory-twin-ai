-- 예측 워커가 쓰는 테이블도 대시보드가 실시간으로 구독할 수 있게 publication에 추가한다.

alter publication supabase_realtime add table station_c_predictions;
