// src/screens/AskScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView, View, Text, StatusBar, Platform, TouchableOpacity, TextInput,
  ScrollView, Image, Alert, Animated, Easing
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, Asset, type ImageLibraryOptions, type CameraOptions } from 'react-native-image-picker';
import AsyncStorage from '../utils/safeAsyncStorage';

// ===== THEME (Main과 동일 팔레트) =====
const BG = '#F6F7FB';
const SURFACE = '#FFFFFF';
const CARD_SOFT = '#FDFEFE';
const ACCENT = '#FF8A00';
const ACCENT_SOFT = '#FFF1E0';
const INK = '#0B1220';
const SUBTLE = '#5B667A';
const BORDER = '#E6E8EE';

const SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.02,
  shadowRadius: 10,
  elevation: 0.5,
} as const;

// ===== 이미지 픽커 옵션 (타입 명시로 TS 추론 안정화) =====
const LIB_OPTS: ImageLibraryOptions = {
  mediaType: 'photo',
  selectionLimit: 1,
  includeExtra: false,
  maxWidth: 2048,
  maxHeight: 2048,
};

const CAM_OPTS: CameraOptions = {
  mediaType: 'photo',
  saveToPhotos: false,
  includeExtra: false,
  maxWidth: 2048,
  maxHeight: 2048,
};

const MAX_QUESTION_LEN = 300;
const DAILY_IMG_LIMIT = 3;
const QUOTA_USED_KEY = 'ASK_IMG_QUOTA_USED';
const QUOTA_DATE_KEY = 'ASK_IMG_QUOTA_DATE';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; imageUri?: string | null };

type Props = { navigation: any };

export default function AskScreen({ navigation }: Props) {
  // 메시지
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'm-welcome',
      role: 'assistant',
      text: '무엇이 궁금한가요? 텍스트로 질문하시거나 이미지를 첨부해 주세요. (이미지 질문은 하루 3회)',
    },
  ]);

  // 입력/첨부/상태
  const [input, setInput] = useState('');
  const [attachedUri, setAttachedUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // 이미지 질문 일일 카운트
  const [imgUsedToday, setImgUsedToday] = useState(0);

  // 타자 애니메이션 컨트롤
  const typingAnim = useRef(new Animated.Value(0)).current;

  // 스크롤 끝으로 이동
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollToEnd = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  // ====== 일일 이미지 카운트 로드/리셋 ======
  useEffect(() => {
    (async () => {
      try {
        const today = getTodayKey();
        const savedDate = await AsyncStorage.getItem(QUOTA_DATE_KEY);
        if (savedDate !== today) {
          await AsyncStorage.setItem(QUOTA_DATE_KEY, today);
          await AsyncStorage.setItem(QUOTA_USED_KEY, '0');
          setImgUsedToday(0);
        } else {
          const used = await AsyncStorage.getItem(QUOTA_USED_KEY);
          setImgUsedToday(Number(used || 0));
        }
      } catch {
        // 무시: 로컬 저장 실패 시 카운트 0으로 처리
        setImgUsedToday(0);
      }
    })();
  }, []);

  const incImageQuota = async () => {
    const next = imgUsedToday + 1;
    setImgUsedToday(next);
    try {
      await AsyncStorage.setItem(QUOTA_USED_KEY, String(next));
      await AsyncStorage.setItem(QUOTA_DATE_KEY, getTodayKey());
    } catch {}
  };

  // ====== 상단 바 ======
  const TopBar = () => (
    <View style={{ backgroundColor: BG, borderBottomColor: BORDER, borderBottomWidth: 1 }}>
      <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0, backgroundColor: BG }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 6, top: 10, padding: 6 }}>
            <MaterialIcons name="arrow-back" size={24} color={INK} />
          </TouchableOpacity>
          <Text style={{ fontSize: 19, fontWeight: '900', color: INK }}>질문하기</Text>
          {/* 오늘 이미지 질문 횟수 표시 */}
          <View style={{ position: 'absolute', right: 10, top: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFE8CC', borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: ACCENT }}>이미지 {imgUsedToday}/{DAILY_IMG_LIMIT}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // ====== 이미지 첨부 ======
  const canUseImageToday = () => imgUsedToday < DAILY_IMG_LIMIT;

  const pickFromLibrary = async () => {
    if (!canUseImageToday() && !attachedUri) {
      Alert.alert('제한', '이미지 질문은 오늘 3회까지 가능합니다.');
      return;
    }
    const res = await launchImageLibrary(LIB_OPTS);
    const asset = res.assets?.[0];
    if (asset?.uri) setAttachedUri(asset.uri);
  };

  const takePhoto = async () => {
    if (!canUseImageToday() && !attachedUri) {
      Alert.alert('제한', '이미지 질문은 오늘 3회까지 가능합니다.');
      return;
    }
    try {
      console.log('[AskScreen] launchCamera start');
      const res = await launchCamera(CAM_OPTS);
      console.log('[AskScreen] launchCamera result', res);
      if (res.didCancel) return;
      if (res.errorCode) {
        Alert.alert('카메라 오류', res.errorMessage || res.errorCode);
        return;
      }
      const asset = res.assets?.[0];
      if (asset?.uri) setAttachedUri(asset.uri);
      else console.warn('[AskScreen] No asset uri returned');
    } catch (e:any) {
      console.warn('[AskScreen] Camera exception', e);
      Alert.alert('카메라 실행 실패', '카메라를 열 수 없습니다. 권한 또는 기기 상태를 확인해주세요.');
    }
  };

  // ====== 전송 ======
  const handleSend = async () => {
    const text = input.trim();
    if (!text && !attachedUri) {
      Alert.alert('안내', '질문을 입력하거나 이미지를 첨부해 주세요.');
      return;
    }
    if (text.length > MAX_QUESTION_LEN) {
      Alert.alert('제한', `질문은 ${MAX_QUESTION_LEN}자까지 가능합니다.`);
      return;
    }
    if (attachedUri && !canUseImageToday()) {
      Alert.alert('제한', '이미지 질문은 오늘 3회까지입니다.');
      return;
    }

    // 사용자 메시지 추가
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      imageUri: attachedUri,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    scrollToEnd();

    // 이미지 질문 카운트 증가 (이미지 첨부가 있을 때만)
    if (attachedUri) await incImageQuota();

    // 첨부 초기화
    setAttachedUri(null);

    // ====== (TODO) Gemini API 호출 위치 ======
    // 여기에서 userMsg.text / userMsg.imageUri 를 사용해 백엔드 → Gemini 호출
    // 지금은 데모 응답을 typewriter 애니메이션으로 표시
    const answer = buildDemoAnswer(text, !!userMsg.imageUri);

    // 어시스턴트 메시지 빈껍데기 추가
    const aId = `a-${Date.now()}`;
    const assistantMsg: Msg = { id: aId, role: 'assistant', text: '' };
    setMessages((prev) => [...prev, assistantMsg]);
    scrollToEnd();

    // 타자 애니메이션
    typewrite(aId, answer, () => {
      setSending(false);
      scrollToEnd();
    });
  };

  // ====== 타이핑 애니메이션 구현 ======
  const typewrite = (msgId: string, full: string, onDone?: () => void) => {
    let i = 0;
    const total = full.length;
    const step = () => {
      // 길이에 따른 가변 배치 (긴 답변일수록 많이 건너뜀)
      const batch = total < 80 ? 3 : total < 160 ? 5 : 8; // 한번에 추가 글자 수
      i = Math.min(total, i + batch);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: full.slice(0, i) } : m));
      scrollToEnd();
      if (i < total) {
        setTimeout(step, getTypeSpeed(total));
      } else {
        onDone && onDone();
      }
    };
    step();
  };

  const getTypeSpeed = (len: number) => {
    // 더 빠른 전개: 기본 지연 크게 감소
    if (len < 80) return 6;   // 짧은 답변 거의 즉시
    if (len < 160) return 5;  // 중간 길이
    return 4;                 // 긴 답변
  };

  // ====== 말풍선 ======
  const Bubble = ({ msg }: { msg: Msg }) => {
    const isUser = msg.role === 'user';
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          backgroundColor: isUser ? ACCENT_SOFT : SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 16,
          padding: 12,
          marginVertical: 6,
          ...SHADOW,
        }}
      >
        {!!msg.imageUri && (
          <Image
            source={{ uri: msg.imageUri }}
            style={{ width: 180, height: 120, borderRadius: 10, marginBottom: msg.text ? 8 : 0 }}
            resizeMode="cover"
          />
        )}
        {!!msg.text && (
          <Text
            style={{
              color: INK,
              fontSize: 13,
              lineHeight: 20,
              letterSpacing: 0.2,
              fontWeight: isUser ? '800' : '600',
            }}
          >
            {msg.text}
          </Text>
        )}
      </View>
    );
  };

  // ====== 하단 입력창 ======
  const disabledSend = sending || (!input.trim() && !attachedUri);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <TopBar />

      {/* 채팅 목록 */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </ScrollView>

      {/* 하단 입력 영역 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 22 : 10,
          backgroundColor: BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
        }}
      >
        {/* 첨부 썸네일 */}
        {attachedUri && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              padding: 8,
            }}
          >
            <Image source={{ uri: attachedUri }} style={{ width: 52, height: 52, borderRadius: 8, marginRight: 10 }} />
            <Text style={{ flex: 1, color: SUBTLE, fontSize: 12 }}>이미지 첨부됨</Text>
            <TouchableOpacity onPress={() => setAttachedUri(null)}>
              <MaterialIcons name="close" size={20} color={SUBTLE} />
            </TouchableOpacity>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center', // 세로 중앙
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 14,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          {/* 카메라 */}
          <TouchableOpacity onPress={takePhoto} style={{ padding: 6, marginRight: 2 }} disabled={sending}>
            <MaterialIcons name="photo-camera" size={22} color={sending ? '#C7CDD8' : ACCENT} />
          </TouchableOpacity>

          {/* 앨범 */}
          <TouchableOpacity onPress={pickFromLibrary} style={{ padding: 6, marginRight: 4 }} disabled={sending}>
            <MaterialIcons name="image" size={22} color={sending ? '#C7CDD8' : ACCENT} />
          </TouchableOpacity>

      {/* 입력창 */}
      <TextInput
            value={input}
            onChangeText={(t) => {
              if (t.length <= MAX_QUESTION_LEN) setInput(t);
            }}
            placeholder="질문을 입력하세요 (최대 300자)"
            placeholderTextColor="#9CA3AF"
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 38,
              paddingHorizontal: 8,
              color: INK,
        textAlignVertical: 'center', // 안드로이드 세로 가운데
            }}
          />

          {/* 보내기 */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={disabledSend}
            style={{
              padding: 6,
              marginLeft: 4,
              opacity: disabledSend ? 0.5 : 1,
            }}
          >
            <MaterialIcons name="send" size={22} color={disabledSend ? '#C7CDD8' : ACCENT} />
          </TouchableOpacity>
        </View>

        {/* 하단 보조 정보 (글자수/이미지 남은 횟수) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 }}>
          <Text style={{ color: SUBTLE, fontSize: 11 }}>{input.length}/{MAX_QUESTION_LEN}</Text>
          <Text style={{ color: SUBTLE, fontSize: 11 }}>
            이미지 질문 오늘 {imgUsedToday}/{DAILY_IMG_LIMIT}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// === 유틸 ===
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return `${y}-${m}-${day}`;
}

// 데모 응답 빌더 (나중에 Gemini API로 교체)
function buildDemoAnswer(_q: string, withImage: boolean) {
  // 사용자 질문을 그대로 보여주지 않고, 항상 일정한 구조로 답변
  return (
    '데모 응답입니다 (실제 AI 비활성화 상태).\n' +
    (withImage
      ? '이미지 기반 질문으로 처리: 추후 실제 모델 연결 시 이미지 속 텍스트/수식/표를 읽어 설명할 수 있어요.\n'
      : '텍스트 기반 질문으로 처리: 추후 AI 연결 시 의미 분석/요약/관련 개념 확장이 가능합니다.\n') +
    '\n추천 활용 방식:\n' +
    '1. 핵심 키워드 2~3개만 추려 다시 질문하면 더 명확한 요약을 얻을 수 있어요.\n' +
    '2. "이 개념을 더 쉽게" 처럼 변환 지시어를 붙여 다양한 형태로 받아보세요.\n'
  );
}
