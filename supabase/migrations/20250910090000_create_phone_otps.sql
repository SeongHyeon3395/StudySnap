-- phone_otps: 휴대폰 인증코드 저장 테이블
-- Edge Function(otp-send / otp-verify)에서 사용합니다.

create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 조회 성능 및 최신 건 우선 정렬을 위한 인덱스
create index if not exists idx_phone_otps_phone_created_at
  on public.phone_otps (phone, created_at desc);

-- 최근 코드 찾기 속도 향상을 위한 보조 인덱스
create index if not exists idx_phone_otps_phone_expires_at
  on public.phone_otps (phone, expires_at);

-- RLS는 서비스 롤 키가 우회하므로 필수는 아니지만 보안을 위해 켭니다.
alter table public.phone_otps enable row level security;

-- 일반 클라이언트가 접근할 일은 없으므로 별도의 정책은 두지 않습니다.
-- (SERVICE_ROLE을 사용하는 Edge Function만 접근합니다.)
