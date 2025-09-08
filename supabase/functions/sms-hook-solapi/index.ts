import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 1. 환경 변수에서 모든 비밀 정보를 가져옵니다.
const SOLAPI_API_KEY = Deno.env.get("SOLAPI_API_KEY");
const SOLAPI_API_SECRET = Deno.env.get("SOLAPI_API_SECRET");
const SOLAPI_SENDER_NUMBER = Deno.env.get("SOLAPI_SENDER_NUMBER");
const HOOK_SECRET = Deno.env.get("HOOK_SECRET"); // ✅ Auth Hook에 설정한 비밀번호
const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send";

// 2. 응답 생성을 위한 함수
function createResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// 3. 솔라피 API 인증 시그니처 생성 함수
async function createSignature() {
  const salt = crypto.randomUUID();
  const date = new Date().toISOString();
  const signature = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SOLAPI_API_SECRET!),
    { name: "HMAC", hash: "SHA-264" }, // 이전 코드의 오타 수정 가능성 대비
    false,
    ["sign"]
  ).then(key => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(date + salt)))
   .then(res => Array.from(new Uint8Array(res)).map(b => b.toString(16).padStart(2, '0')).join(''));

  return `HMAC-SHA256 salt=${salt}, date=${date}, signature=${signature}`;
}


// 4. 메인 서버 로직
serve(async (req) => {
  // ✅ 가장 먼저 비밀번호부터 확인합니다.
  // Supabase는 'x-supabase-webhook-secret' 헤더에 비밀번호를 담아 보냅니다.
  const receivedSecret = req.headers.get('x-supabase-webhook-secret');
  if (receivedSecret !== HOOK_SECRET) {
    console.error("Webhook secret mismatch! Unauthorized request.");
    return createResponse({ error: 'Unauthorized. Invalid secret.' }, 401);
  }

  // CORS Preflight 요청은 여기서 처리해도 괜찮습니다.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const hookEvent = await req.json();
    const phone = hookEvent?.user?.phone;
    const otp = hookEvent?.sms?.otp;

    if (!phone || !otp) {
      console.error("Hook Error: phone or otp missing from payload", hookEvent);
      return createResponse({ error: "Missing phone or otp from hook" }, 400);
    }

    const payload = {
      message: {
        to: phone,
        from: SOLAPI_SENDER_NUMBER,
        text: `[찍공] 인증번호는 [${otp}] 입니다.`,
      },
    };

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

    // Supabase에 성공적으로 처리되었음을 알립니다.
    return createResponse({ success: true });

  } catch (error) {
    console.error("Function Execution Error:", error.message);
    return createResponse({ error: error.message }, 500);
  }
});