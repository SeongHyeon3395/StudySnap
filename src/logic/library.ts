import { supabase } from '../lib/supabase';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('로그인 필요');
  return uid;
}

export async function generatePdfBytesFromText(text: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const maxWidth = 595.28 - 60;
  const lines = wrapText(text || '', 100); // 아주 단순 줄바꿈
  let y = 800;
  lines.forEach(line => {
    page.drawText(line, { x: 30, y, size: fontSize, font, color: rgb(0,0,0) });
    y -= 16;
  });
  const bytes = await pdfDoc.save(); // Uint8Array
  return bytes;
}

function wrapText(t: string, n=100) {
  const arr: string[] = [];
  const s = String(t).replace(/\r/g,'');
  s.split('\n').forEach(line => {
    if (line.length <= n) { arr.push(line); return; }
    for (let i=0;i<line.length;i+=n) arr.push(line.slice(i, i+n));
  });
  return arr;
}

export async function uploadPdfToLibrary(fileName: string, pdfBytes: Uint8Array) {
  const uid = await currentUserId();
  const path = `${uid}/${fileName.replace(/\.pdf$/i,'')}.pdf`;
  const { error } = await supabase.storage.from('library').upload(path, pdfBytes, {
    contentType: 'application/pdf', upsert: true
  });
  if (error) throw error;
  return path;
}

export async function listLibrary() {
  const uid = await currentUserId();
  const { data, error } = await supabase.storage.from('library').list(uid, { limit: 100 });
  if (error) throw error;
  return data || [];
}

export async function getSignedUrl(path: string, expiresInSeconds = 60) {
  const { data, error } = await supabase.storage.from('library').createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl as string;
}
