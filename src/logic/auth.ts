import { supabase } from '../lib/supabase';

const onlyDigits = (s:string) => s.replace(/\D/g,'');
const toE164KR = (raw: string) => {
  const d = onlyDigits(raw);
  if (!d) return '';
  if (d.startsWith('0')) return '+82' + d.slice(1);
  if (d.startsWith('82')) return '+' + d;
  return '+' + d;
};

// ===== Basic Auth helpers =====
export async function signUp(email: string, password: string, name?: string, birth?: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, birth, phone } },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPhoneCode(phoneFormatted: string) {
  // Edge Function으로 위임 (숫자만 전송)
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.functions.invoke('otp-send', { body: { phone } });
  if (error) throw error;
  if (!(data as any)?.ok) throw new Error((data as any)?.reason || 'SEND_FAILED');
}

export async function verifyPhoneCode(phoneFormatted: string, code: string) {
  // Edge Function으로 검증 (세션 생성 없이 검증만)
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.functions.invoke('otp-verify', { body: { phone, code } });
  if (error) throw error;
  if (!(data as any)?.ok) throw new Error((data as any)?.reason || 'VERIFY_FAILED');
  return true;
}

export async function signUpWithEmailAndProfile(params: {
  name: string; email: string; birth: string; phone: string; password: string;
}) {
  const { name, email, birth, phone, password } = params;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, birth, phone },
      emailRedirectTo: 'studysnap://auth-callback' // 원하면 딥링크
    }
  });
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function findAccountByPhoneOtp(phoneFormatted: string, code: string) {
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.functions.invoke('find-email-by-phone', { body: { phone, code } });
  if (error) throw error;
  if (!(data as any)?.ok) throw new Error((data as any)?.reason || 'LOOKUP_FAILED');
  return (data as any).emailMasked as string;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'studysnap://reset-password' // 딥링크/웹URL 등록 필요
  });
  if (error) throw error;
}
