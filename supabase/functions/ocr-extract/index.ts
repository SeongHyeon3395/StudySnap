// supabase/functions/ocr-extract/index.ts
Deno.serve(async (req) => {
  try {
    const { image_base64 } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "GEMINI_API_KEY missing" }), { status: 500 });
    if (!image_base64) return new Response(JSON.stringify({ error: "image_base64 required" }), { status: 400 });

    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const instruction = "Extract ALL visible text from the image and return PLAIN TEXT only. Preserve line breaks and spacing.";
    const parts = [
      { text: instruction },
      { inline_data: { mime_type: "image/jpeg", data: image_base64 } },
    ];

    const body = { contents: [{ role: "user", parts }], generationConfig: { temperature: 0.0 } };

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const err = await r.text();
      return new Response(JSON.stringify({ error: err }), { status: r.status });
    }

    const json = await r.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 400 });
  }
});
