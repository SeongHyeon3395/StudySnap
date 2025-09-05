import { supabase } from '../lib/supabase';

const onlyDigits = (s:string) => s.replace(/\D/g,'');

export async function sendPhoneCode(phoneFormatted: string) {
  const phone = onlyDigits(phoneFormatted);
  const { error } = await supabase.auth.signInWithOtp({ phone, options:{ channel:'sms' }});
  if (error) throw error;
}

export async function verifyPhoneCode(phoneFormatted: string, code: string) {
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.auth.verifyOtp({ type:'sms', phone, token: code });
  if (error) throw error;
  // data.session이 생깁니다(해당 번호 계정으로 로그인된 상태)
  return data.session;
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
  // 코드 검증하면 해당 사용자로 로그인됨 → 이메일 확인 후 바로 로그아웃
  const session = await verifyPhoneCode(phoneFormatted, code);
  const email = session?.user?.email || '';
  await supabase.auth.signOut();
  if (!email) throw new Error('이 번호로 가입된 이메일이 없습니다.');
  // 마스킹
  const [id, dom] = email.split('@');
  const masked = (id?.slice(0,2) || '') + '***@' + dom;
  return masked;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'studysnap://reset-password' // 딥링크/웹URL 등록 필요
  });
  if (error) throw error;
}
