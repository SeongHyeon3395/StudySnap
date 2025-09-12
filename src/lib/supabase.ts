import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { SUPABASE_URL as ENV_URL, SUPABASE_ANON_KEY as ENV_ANON } from './env'

// Settings → API 값 사용 (env.ts에 정의되어 있어야 합니다)
const SUPABASE_URL = ENV_URL || '당신의 Project URL'
const SUPABASE_ANON = ENV_ANON || '당신의 anon public key'

const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // RN 환경에서는 true일 경우 이슈 발생
  },
})

// 개발 편의: URL/키가 설정되지 않았으면 경고 로그
if (!SUPABASE_URL || SUPABASE_URL.includes('당신의') || !SUPABASE_ANON || SUPABASE_ANON.includes('당신의')) {
  // eslint-disable-next-line no-console
  console.warn('[Supabase] Project URL / anon key가 설정되지 않았습니다. src/lib/supabase.ts 를 확인하세요.');
}

// 통일: default와 named를 모두 export
export default client
export const supabase = client
