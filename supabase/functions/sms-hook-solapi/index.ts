// supabase/functions/sms-hook-solapi/index.ts (최종 수정본)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 1. 환경 변수에서 솔라피 키와 발신번호를 미리 가져옵니다.
const SOLAPI_API_KEY = Deno.env.get("SOLAPI_API_KEY");
const SOLAPI_API_SECRET = Deno.env.get("SOLAPI_API_SECRET");
const SOLAPI_SENDER_NUMBER = Deno.env.get("SOLAPI_SENDER_NUMBER");
const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send";

// 2. 응답을 위한 Helper 함수
function createResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// 3. 솔라피 API 호출을 위한 시그니처 생성 함수 (✅ 가장 중요한 부분)
async function createSignature() {
  const salt = crypto.randomUUID();
  const date = new Date().toISOString();
  const signature = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SOLAPI_API_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(key => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(date + salt)))
   .then(res => Array.from(new Uint8Array(res)).map(b => b.toString(16).padStart(2, '0')).join(''));

  return `HMAC-SHA256 salt=${salt}, date=${date}, signature=${signature}`;
}

serve(async (req) => {
  // CORS Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // 4. Supabase가 보내주는 Hook 데이터를 받습니다.
    const hookEvent = await req.json();
    const phone = hookEvent?.user?.phone;
    const otp = hookEvent?.sms?.otp;

    if (!phone || !otp) {
      console.error("Hook Error: phone or otp missing", hookEvent);
      return createResponse({ error: "Missing phone or otp from hook" }, 400);
    }
    
    // 5. 솔라피에 보낼 메시지 본문을 만듭니다.
    const payload = {
      message: {
        to: phone,
        from: SOLAPI_SENDER_NUMBER,
        text: `[찍공] 인증번호는 [${otp}] 입니다.`,
      },
    };
    
    // 6. 올바른 인증 헤더를 생성하여 API를 호출합니다.
    const signatureHeader = await createSignature();
    const response = await fetch(SOLAPI_SEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': signatureHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok || responseData.statusCode !== '2000') {
      console.error("Solapi Send Error:", responseData);
      throw new Error(`Failed to send SMS via Solapi: ${responseData.statusMessage || 'Unknown error'}`);
    }

    console.log(`SMS successfully sent to ${phone} via Solapi.`);

    // 7. Supabase에 성공적으로 처리되었음을 알립니다.
    return createResponse({ success: true });

  } catch (error) {
    console.error("Function Error:", error.message);
    return createResponse({ error: error.message }, 500);
  }
});