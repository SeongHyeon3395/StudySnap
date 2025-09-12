// find-email-by-phone: 휴대폰+코드 검증 후 가입 이메일(마스킹) 반환
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const toDigits = (s: string) => (s ?? "").replace(/\D/g, "");

function maskEmail(email: string) {
  if (!email || !email.includes('@')) return '';
  const [id, dom] = email.split('@');
  const head = (id ?? '').slice(0, 2);
  return `${head}***@${dom}`;
}

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ ok:false, stage:'env', reason:'ENV_MISSING', miss:{ SUPABASE_URL: !SUPABASE_URL, SERVICE_ROLE: !SERVICE_ROLE } }), { status:200, headers:{ 'content-type':'application/json' }});
    }

    const { phone, code } = await req.json().catch(() => ({ phone:'', code:'' }));
    const to = toDigits(phone);
    const c  = toDigits(code);
    if (!/^01\d{8,9}$/.test(to) || !/^\d{6}$/.test(c)) {
      return new Response(JSON.stringify({ ok:false, reason:'INVALID_INPUT' }), { status:200, headers:{ 'content-type':'application/json' }});
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) 최신 OTP 조회
    const { data: rows, error } = await sb
      .from('phone_otps')
      .select('id, code, expires_at')
      .eq('phone', to)
      .order('created_at', { ascending: false })
      .limit(1);
  if (error || !rows?.length) return new Response(JSON.stringify({ ok:false, reason:'NOT_FOUND' }), { status:200, headers:{ 'content-type':'application/json' }});

    const row = rows[0];
    if (new Date(row.expires_at).getTime() < Date.now())
      return new Response(JSON.stringify({ ok:false, reason:'EXPIRED' }), { status:200, headers:{ 'content-type':'application/json' }});

    if (row.code !== c)
      return new Response(JSON.stringify({ ok:false, reason:'WRONG_CODE' }), { status:200, headers:{ 'content-type':'application/json' }});

    // 2) 해당 번호의 프로필 찾기
    const { data: prof, error: pErr } = await sb
      .from('profiles')
      .select('id')
      .eq('phone', to)
      .maybeSingle();
  if (pErr || !prof?.id) return new Response(JSON.stringify({ ok:false, reason:'NO_PROFILE' }), { status:200, headers:{ 'content-type':'application/json' }});

    // 3) auth.users에서 이메일 조회 (Admin API)
    const { data: userRes, error: uErr } = await sb.auth.admin.getUserById(prof.id);
  if (uErr || !userRes?.user?.email) return new Response(JSON.stringify({ ok:false, reason:'NO_EMAIL' }), { status:200, headers:{ 'content-type':'application/json' }});

    // (선택) 사용한 OTP 제거
    await sb.from('phone_otps').delete().eq('id', row.id);

    return new Response(JSON.stringify({ ok:true, emailMasked: maskEmail(userRes.user.email!) }), { status:200, headers:{ 'content-type':'application/json' }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, reason:'SERVER_ERROR', detail: String(e) }), { status:200, headers:{ 'content-type':'application/json' }});
  }
});
