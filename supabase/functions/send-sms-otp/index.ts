// Deno (Supabase Edge Functions)
// Supabase "Send SMS Hook" 이벤트를 받아 국내 SMS API(예: SOLAPI)로 OTP 전송

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SOLAPI_API_KEY = Deno.env.get("SOLAPI_API_KEY")!;
const SOLAPI_API_SECRET = Deno.env.get("SOLAPI_API_SECRET")!;
// SOLAPI 전송 엔드포인트(예시) — 실제 값/헤더명은 업체 문서에 맞춰 조정하세요.
const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send";

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return ok({});
  try {
    // Supabase Send SMS Hook 이벤트 바디
    // 문서상 user, sms.otp 등이 포함됨:contentReference[oaicite:2]{index=2}.
    const event = await req.json();

    // 1) 받는 번호/OTP 추출
    const userPhone: string | undefined = event?.user?.phone;     // 국제 형식 권장 (+8210...)
    const otp: string | undefined = event?.sms?.otp;              // 발송할 6자리 OTP

    if (!userPhone || !otp) {
      return ok({ error: "missing phone or otp" }, 400);
    }

    // 2) 국내 SMS 업체 API 호출 (여기서는 SOLAPI 예시)
    // 실제 인증방식(헤더/서명)은 업체 문서에 맞게 바꿔주세요.
    // 예: 솔라피는 키/시크릿 기반 헤더 또는 JWT/HMAC 등 방식을 사용.
    const msg = `[StudySnap] 인증번호: ${otp}`;
    const payload = {
      // 업체 요구 필드에 맞게 수정
      to: userPhone,
      from: Deno.env.get("SMS_FROM") ?? "",  // 발신번호(국내 등록/사전 인증 필요)
      text: msg,
    };

    const r = await fetch(SOLAPI_SEND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `HMAC-SHA256 ${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`, // 예시, 실제는 문서대로
      },
      body: JSON.stringify(payload),
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      console.error("SOLAPI error", r.status, j);
      return ok({ error: "provider send failed", detail: j }, 502);
    }

    // 3) Hook 응답: 200 이면 Supabase가 "전송 성공"으로 간주
    return ok({ ok: true, provider: "solapi", result: j }, 200);
  } catch (e) {
    console.error(e);
    return ok({ error: String(e) }, 500);
  }
});
