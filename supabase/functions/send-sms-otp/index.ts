// supabase/functions/send-sms-otp/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS 헤더 설정 (중요!)
// 브라우저에서 이 함수를 호출할 수 있도록 허용합니다.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

serve(async (req) => {
  // CORS Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 요청에서 전화번호(phone)를 가져옵니다.
    const { phone } = await req.json();
    if (!phone) {
      throw new Error("전화번호가 제공되지 않았습니다.");
    }

    // 2. 6자리 랜덤 인증번호를 생성합니다.
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. 솔라피(Solapi) API 호출 준비
    // !!주의!! 실제로는 환경 변수를 사용해야 안전합니다.
    const SOLAPI_API_KEY = Deno.env.get('SOLAPI_API_KEY')
    const SOLAPI_API_SECRET = Deno.env.get('SOLAPI_API_SECRET')
    const SOLAPI_SENDER_NUMBER = Deno.env.get('SOLAPI_SENDER_NUMBER')

    // 솔라피 인증 정보 생성
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


    // 4. 솔라피 API에 SMS 발송 요청
    const response = await fetch("https://api.solapi.com/messages/v4/send", {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 salt=${salt}, date=${date}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: phone,
          from: SOLAPI_SENDER_NUMBER,
          text: `[My App] 인증번호는 [${verificationCode}] 입니다.`,
        },
      }),
    });

    const responseData = await response.json();
    if (responseData.statusCode !== '2000') {
        console.error('SMS 발송 실패:', responseData);
        throw new Error('SMS 발송에 실패했습니다.');
    }

    console.log(`SMS 발송 성공! 수신번호: ${phone}`);

    // 5. 성공 응답과 함께 인증번호 반환
    // 실제 앱에서는 인증번호를 DB에 저장하고, 여기서는 성공 여부만 반환해야 합니다.
    return new Response(JSON.stringify({
      message: '인증번호가 성공적으로 발송되었습니다.',
      // !!주의!! 실제 서비스에서는 클라이언트에게 인증번호를 직접 보내면 안됩니다.
      // 지금은 테스트를 위해 임시로 포함합니다.
      verificationCode: verificationCode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // 에러 처리
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});