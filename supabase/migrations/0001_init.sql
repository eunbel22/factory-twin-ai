-- MiniLine AI — 초기 스키마
-- 원칙(AGENTS.md 참고): raw 테이블은 불변, 판정/예측 결과는 별도 테이블에 기록.
-- anon/authenticated는 조회(select)만 가능하고, 쓰기는 서비스 롤(Vercel Functions, 추론 워커)에서만 수행한다.

create extension if not exists "pgcrypto";

-- ===================== 스테이션 A: 입고 외관검사 =====================
create table if not exists station_a_raw (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  image_path text
);

create table if not exists station_a_judgments (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid not null references station_a_raw(id),
  judgment text not null check (judgment in ('양품', '불량')),
  confidence float not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

-- ===================== 스테이션 B: 중량 검사 =====================
create table if not exists station_b_raw (
  id uuid primary key default gen_random_uuid(),
  measured_at timestamptz not null default now(),
  weight_g float not null,
  pressure_kpa float
);

create table if not exists station_b_judgments (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid not null references station_b_raw(id),
  status text not null check (status in ('양품', '불량', '경고')),
  reason text,
  created_at timestamptz not null default now()
);

-- ===================== 스테이션 C: 진동/온도 예지보전 (핵심) =====================
create table if not exists station_c_raw (
  id uuid primary key default gen_random_uuid(),
  measured_at timestamptz not null default now(),
  vibration float not null,
  temperature float
);
create index if not exists station_c_raw_measured_at_idx on station_c_raw (measured_at);

create table if not exists station_c_predictions (
  id uuid primary key default gen_random_uuid(),
  window_start timestamptz not null,
  window_end timestamptz not null,
  model text not null check (model in ('lstm', 'xgboost')),
  probability float not null check (probability >= 0 and probability <= 1),
  shap_top3 jsonb,
  created_at timestamptz not null default now()
);

-- ===================== 스테이션 D: 자동 분류 (스트레치) =====================
create table if not exists station_d_sorting (
  id uuid primary key default gen_random_uuid(),
  decision text not null check (decision in ('양품', '불량')),
  overridden boolean not null default false,
  overridden_by text,
  created_at timestamptz not null default now()
);

-- ===================== 설정값 (기준 중량, 위험 임계치 등) =====================
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ===================== 챗봇 로그 (근거 추적용) =====================
create table if not exists chat_logs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  context_snapshot jsonb,
  answer text,
  created_at timestamptz not null default now()
);

-- ===================== RLS: 전부 조회만 허용, 쓰기는 서비스 롤 전용 =====================
alter table station_a_raw enable row level security;
alter table station_a_judgments enable row level security;
alter table station_b_raw enable row level security;
alter table station_b_judgments enable row level security;
alter table station_c_raw enable row level security;
alter table station_c_predictions enable row level security;
alter table station_d_sorting enable row level security;
alter table settings enable row level security;
alter table chat_logs enable row level security;

create policy "public read: station_a_raw" on station_a_raw for select using (true);
create policy "public read: station_a_judgments" on station_a_judgments for select using (true);
create policy "public read: station_b_raw" on station_b_raw for select using (true);
create policy "public read: station_b_judgments" on station_b_judgments for select using (true);
create policy "public read: station_c_raw" on station_c_raw for select using (true);
create policy "public read: station_c_predictions" on station_c_predictions for select using (true);
create policy "public read: station_d_sorting" on station_d_sorting for select using (true);
create policy "public read: settings" on settings for select using (true);
create policy "public read: chat_logs" on chat_logs for select using (true);

-- insert/update/delete 정책을 의도적으로 만들지 않는다 —
-- anon/authenticated 키로는 쓰기가 항상 거부되고, service_role 키(Vercel Functions, 추론 워커)만
-- RLS를 우회해 쓸 수 있다.
