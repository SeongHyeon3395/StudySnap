// Fallback wrapper for AsyncStorage to prevent native null crash.
import RealAsyncStorage from '@react-native-async-storage/async-storage';

// 타입 최소 정의 (우리가 사용하는 메소드만)
export interface BasicAsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiGet?(keys: string[]): Promise<[string, string | null][]>;
  multiSet?(pairs: [string, string][]): Promise<void>;
}

let exported: BasicAsyncStorage;

try {
  // 네이티브 모듈 유효성 간단 검사
  if (!RealAsyncStorage || typeof RealAsyncStorage.getItem !== 'function') {
    throw new Error('Native AsyncStorage not available');
  }
  exported = RealAsyncStorage as unknown as BasicAsyncStorage;
} catch (e) {
  console.warn('[SafeAsyncStorage] Native module unavailable. Using in-memory fallback. Data will NOT persist.');
  const mem = new Map<string, string>();
  exported = {
    async getItem(key) { return mem.has(key) ? mem.get(key)! : null; },
    async setItem(key, value) { mem.set(key, value); },
    async removeItem(key) { mem.delete(key); },
    async multiGet(keys) { return keys.map(k => [k, mem.get(k) ?? null]); },
    async multiSet(pairs) { pairs.forEach(([k, v]) => mem.set(k, v)); },
  };
}

export default exported;
