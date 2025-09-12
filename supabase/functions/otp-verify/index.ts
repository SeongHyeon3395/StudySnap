// 검증: phone + code 일치 & 안 만료되었는지 확인. 맞으면 OK
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
function onlyDigits(s: string) { return (s ?? "").replace(/\D/g, ""); }

Deno.serve(async (req) => {
  try {
    const { phone, code } = await req.json();
    const to = onlyDigits(phone);
    const c  = onlyDigits(code);
    if (!/^01\d{8,9}$/.test(to) || !/^\d{6}$/.test(c)) {
      return new Response(JSON.stringify({ ok:false, reason:"INVALID_INPUT" }), { status:200, headers:{"content-type":"application/json"} });
    }

    const { data: rows, error } = await sb
      .from("phone_otps")
      .select("id, code, expires_at")
      .eq("phone", to)
      .order("created_at", { ascending: false })
      .limit(1);

  if (error || !rows?.length) return new Response(JSON.stringify({ ok:false, reason:"NOT_FOUND" }), { status:200, headers:{"content-type":"application/json"} });

    const row = rows[0];
    if (new Date(row.expires_at).getTime() < Date.now())
      return new Response(JSON.stringify({ ok:false, reason:"EXPIRED" }), { status:200, headers:{"content-type":"application/json"} });

    if (row.code !== c)
      return new Response(JSON.stringify({ ok:false, reason:"WRONG_CODE" }), { status:200, headers:{"content-type":"application/json"} });

    // (선택) 사용 후 바로 삭제
    await sb.from("phone_otps").delete().eq("id", row.id);

  return new Response(JSON.stringify({ ok:true }), { status:200, headers:{"content-type":"application/json"} });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, reason:"SERVER_ERROR", detail:String(e) }), { status:200, headers:{"content-type":"application/json"} });
  }
});
