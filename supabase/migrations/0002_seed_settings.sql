-- 기본 설정값 시드 (PRD.md 3절 기준)

insert into settings (key, value) values
  ('station_b_target_weight_g', '{"target": 100, "tolerance_pct": 5}'::jsonb),
  ('station_c_risk_threshold', '{"probability": 0.7}'::jsonb)
on conflict (key) do nothing;
