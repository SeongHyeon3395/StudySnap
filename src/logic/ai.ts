import { supabase } from '../lib/supabase';

export async function askGemini(text: string, image_base64?: string) {
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: { text, image_base64 }
  });
  if (error) throw error;
  return (data as any)?.text as string;
}

export async function extractTextWithGemini(image_base64: string) {
  const { data, error } = await supabase.functions.invoke('ocr-extract', {
    body: { image_base64 }
  });
  if (error) throw error;
  return (data as any)?.text as string;
}
