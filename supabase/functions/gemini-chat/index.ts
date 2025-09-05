// Deno runtime (Supabase Edge Functions)
// Text + (optional) Image(Base64) → Gemini → text
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const MODEL = "gemini-1.5-flash-latest";
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "POST,OPTIONS",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return ok({});
  try {
    const { text, image_base64, mime_type = "image/jpeg" } = await req.json();

    const parts: any[] = [];
    if (text) parts.push({ text });
    if (image_base64) {
      parts.push({
        inline_data: { mime_type, data: image_base64 },
      });
    }

    const body = { contents: [{ role: "user", parts }] };
    const resp = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await resp.json();

    const out =
      json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ??
      "응답이 비어 있습니다.";
    return ok({ text: out });
  } catch (e) {
    return ok({ error: String(e) }, 500);
  }
});
