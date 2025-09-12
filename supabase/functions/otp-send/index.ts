// otp-send: 휴대폰 인증번호 전송 (Solapi)
// 개선 사항: rate limit(최근 30초), sandbox 모드, Solapi 단일 발송 엔드포인트 사용, 상세 에러 구분
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const toDigits = (s: string) => (s ?? "").replace(/\D/g, "");
const hex = (n=16)=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return Array.from(a).map(b=>b.toString(16).padStart(2,"0")).join("")};
async function hmacSha256Hex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  try {
    // 0) 입력
    let bodyJson: any = {};
    try { bodyJson = await req.json(); } catch { /* 빈 바디 허용 */ }
  const to = toDigits(bodyJson?.phone || "");
  const sandbox = !!bodyJson?.sandbox; // sandbox=true이면 실제 발송 생략
    if (!/^01\d{8,9}$/.test(to)) {
      return new Response(JSON.stringify({ ok:false, stage:"input", reason:"INVALID_PHONE", to }), { status:200, headers:{ "content-type":"application/json" }});
    }

    // 1) ENV 확인
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SOLAPI_API_KEY = Deno.env.get("SOLAPI_API_KEY");
    const SOLAPI_API_SECRET = Deno.env.get("SOLAPI_API_SECRET");
    const SOLAPI_FROM = Deno.env.get("SOLAPI_FROM");
    if (!SUPABASE_URL || !SERVICE_ROLE || !SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_FROM) {
      return new Response(JSON.stringify({
        ok:false, stage:"env", reason:"ENV_MISSING",
        miss:{
          SUPABASE_URL: !SUPABASE_URL, SERVICE_ROLE: !SERVICE_ROLE,
          SOLAPI_API_KEY: !SOLAPI_API_KEY, SOLAPI_API_SECRET: !SOLAPI_API_SECRET, SOLAPI_FROM: !SOLAPI_FROM
        }
      }), { status:200, headers:{ "content-type":"application/json" }});
    }

    // 2) DB: rate limit (최근 30초 내 동일 번호 요청 차단)
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 30_000).toISOString();
    const recent = await sb.from('phone_otps')
      .select('id, created_at')
      .eq('phone', to)
      .gte('created_at', since)
      .limit(1);
    if (recent.error) {
      return new Response(JSON.stringify({ ok:false, stage:'rate_query', reason:'RATE_QUERY_FAIL', detail: recent.error }), { status:200, headers:{ 'content-type':'application/json' }});
    }
    if (recent.data && recent.data.length) {
      return new Response(JSON.stringify({ ok:false, stage:'rate_limit', reason:'TOO_FREQUENT', retry_after:30 }), { status:200, headers:{ 'content-type':'application/json' }});
    }

    // 2-1) 코드 생성 & 저장
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 3*60*1000).toISOString();
    const ins = await sb.from("phone_otps").insert({ phone: to, code, expires_at: expiresAt });
    if (ins.error) {
      return new Response(JSON.stringify({ ok:false, stage:"db_insert", reason:"DB_INSERT", detail: ins.error }), { status:200, headers:{ "content-type":"application/json" }});
    }

    // 3) (Sandbox면 실제 발송 생략하고 코드 반환)
    if (sandbox) {
      return new Response(JSON.stringify({ ok:true, sandbox:true, code, expires_at: expiresAt }), { status:200, headers:{ 'content-type':'application/json' }});
    }

    // 3) Solapi 호출 준비
    const date = new Date().toISOString();
    const salt = hex(16);
    const signature = await hmacSha256Hex(SOLAPI_API_SECRET, date + salt);
    const authHeader = `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
    const fromNumber = toDigits(SOLAPI_FROM);
    const text = `[StudySnap] 인증번호 ${code} (3분 이내 입력)`;
    // 단일 발송 엔드포인트 사용
    const payload = { message: { to, from: fromNumber, text } };

    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method:'POST',
      headers:{ 'Authorization': authHeader, 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });

    const solapiBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      const codeStr = (solapiBody?.errorCode || '') as string;
      let mapped = 'SOLAPI_ERROR';
      if (/InvalidMessage/.test(codeStr)) mapped = 'MSG_INVALID';
      else if (/InvalidNumber/.test(codeStr)) mapped = 'NUMBER_INVALID';
      else if (/DailyLimit/.test(codeStr)) mapped = 'DAILY_LIMIT';
      else if (/RateLimit/.test(codeStr)) mapped = 'SOLAPI_RATE';
      return new Response(JSON.stringify({ ok:false, stage:"solapi", reason:mapped, status:res.status, body: solapiBody }), { status:200, headers:{ "content-type":"application/json" }});
    }

    // 4) 성공
  return new Response(JSON.stringify({ ok:true, result: solapiBody, expires_at: expiresAt }), { status:200, headers:{ "content-type":"application/json" }});

  } catch (e) {
    return new Response(JSON.stringify({ ok:false, stage:"fatal", reason:"FATAL", error: String(e) }), { status:200, headers:{ "content-type":"application/json" }});
  }
});
