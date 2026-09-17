-- 대시보드가 Supabase Realtime으로 구독할 테이블들을 publication에 추가한다.
-- 이게 없으면 supabase-js의 postgres_changes 구독이 INSERT 이벤트를 받지 못한다.

alter publication supabase_realtime add table station_a_judgments;
alter publication supabase_realtime add table station_b_judgments;
alter publication supabase_realtime add table station_c_raw;
