
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Animated, Easing, Dimensions } from 'react-native';

type Props = { navigation?: any };

export default function LoginScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<'intro' | 'login'>('intro');
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;

  // 로그인 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwVisible, setPwVisible] = useState(false);

  // 모달 상태
  const [showSignUp, setShowSignUp] = useState(false);
  const [showFindAccount, setShowFindAccount] = useState(false);
  const [showFindPassword, setShowFindPassword] = useState(false);

  // 회원가입 입력
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suBirth, setSuBirth] = useState(''); // YYYY.MM.DD
  const [suPhone, setSuPhone] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suPassword2, setSuPassword2] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState('');

  // 계정/비번 찾기
  const [findEmail, setFindEmail] = useState('');
  const [findPhone, setFindPhone] = useState('');

  // THEME — Neutral + Orange Accent + Deep Navy
  const BG = '#F6F7FB';        // 뉴트럴 배경(차분한 라이트 그레이-블루)
  const SURFACE = '#FFFFFF';   // 서피스(카드/입력 배경)
  const CARD_SOFT = '#FDFEFE'; // 아주 옅은 서피스 톤
  const ACCENT = '#FF8A00';    // 포인트 오렌지(에너지/동기부여)
  const ACCENT_SOFT = '#FFF1E0'; // 오렌지 소프트 배경
  const INK = '#0B1220';       // 진한 네이비 텍스트(가독성)
  const SUBTLE = '#5B667A';    // 보조 텍스트(중간 그레이-블루)
  const BORDER = '#E6E8EE';    // 경계선(뉴트럴 라이트)

  const [showBackButton, setShowBackButton] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleNext = () => {
    if (phase === 'login') return;
    setPhase('login');
    setShowBackButton(true); // 즉시 표시
    setAnimating(true); // 애니메이션 진행
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setAnimating(false));
  };

  const handleBack = () => {
    if (phase === 'intro') return;
    // 누르자마자 숨김
    setShowBackButton(false);
    setAnimating(true);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPhase('intro');
      setAnimating(false);
    });
  };

  const onLoginPress = () => {
    if (!email || !password) {
      Alert.alert('로그인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    // TODO: 서버 로그인 연동
    Alert.alert('로그인', '로그인 성공(예시). 메인 화면으로 이동합니다.', [
      { text: '확인', onPress: () => navigation?.replace?.('Main') ?? null },
    ]);
  };

  const onSendCode = () => {
    if (!suPhone) {
      Alert.alert('인증', '휴대폰 번호를 입력하세요.');
      return;
    }
    // TODO: 인증코드 발송 API 연동
    setCodeSent(true);
    Alert.alert('인증', '인증코드를 전송했습니다. 6자리 코드를 입력하세요.');
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('02')) {
      // 서울번호 패턴 (선택적 확장) -> 02-XXXX-XXXX or 02-XXX-XXXX
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return digits.slice(0,2) + '-' + digits.slice(2);
      if (digits.length <= 9) return digits.slice(0,2) + '-' + digits.slice(2, digits.length-4) + '-' + digits.slice(-4);
      return digits.slice(0,2) + '-' + digits.slice(2, digits.length-4) + '-' + digits.slice(-4, digits.length);
    }
    // 휴대폰 (010 등) 3-4-4 기본
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return digits.slice(0,3) + '-' + digits.slice(3);
    return digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7,11);
  };

  const formatBirth = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0,8); // YYYYMMDD
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return digits.slice(0,4) + '.' + digits.slice(4);
    return digits.slice(0,4) + '.' + digits.slice(4,6) + '.' + digits.slice(6,8);
  };

  const onSignUp = () => {
    if (!suName || !suEmail || !suBirth || !suPhone) {
      Alert.alert('회원가입', '모든 필드를 입력해주세요.');
      return;
    }
    if (suBirth.length !== 10) { // YYYY.MM.DD
      Alert.alert('회원가입', '생년월일을 YYYY.MM.DD 형식으로 입력해주세요.');
      return;
    }
    const birthDigits = suBirth.replace(/\D/g, '');
    const by = parseInt(birthDigits.slice(0,4),10);
    const bm = parseInt(birthDigits.slice(4,6),10);
    const bd = parseInt(birthDigits.slice(6,8),10);
    if (by < 1900 || by > 2100 || bm < 1 || bm > 12 || bd < 1 || bd > 31) {
      Alert.alert('회원가입', '생년월일 값이 올바르지 않습니다.');
      return;
    }
    if (!suPassword || suPassword.length < 6) {
      Alert.alert('회원가입', '비밀번호는 6자 이상으로 설정해주세요.');
      return;
    }
    if (suPassword !== suPassword2) {
      Alert.alert('회원가입', '비밀번호가 서로 일치하지 않습니다.');
      return;
    }
    if (!codeSent || otp.length !== 6) {
      Alert.alert('회원가입', '휴대폰 인증을 완료해주세요. (6자리 코드)');
      return;
    }
    // TODO: 회원가입 API 연동
    Alert.alert('회원가입', '가입이 완료되었습니다. 로그인 해주세요.', [
      { text: '확인', onPress: () => setShowSignUp(false) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* 헤더 — 가운데 타이틀, 상태바 겹침 방지 */}
      <View
        style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
          backgroundColor: BG,
          borderBottomColor: BORDER,
          borderBottomWidth: 1,
        }}
      >
        <View style={{ height: 52, justifyContent: 'center' }}>
          {/* 뒤로가기 버튼 (로그인 화면에서만) */}
          {phase === 'login' && showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              style={{ position: 'absolute', left: 8, top: 8, padding: 8, borderRadius: 20 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="arrow-back-ios" size={22} color={ACCENT} />
            </TouchableOpacity>
          )}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: ACCENT, letterSpacing: 0.3 }}>찍공</Text>
          </View>
        </View>
      </View>

      {/* 본문 슬라이더(인트로 → 로그인) */}
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: BG }}>
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            width: screenWidth * 2,
            transform: [{ translateX }],
          }}
        >
          {/* ===== 인트로 페이지 (한 화면에 3카드) ===== */}
          <View style={{ width: screenWidth, position: 'relative', flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 22,
                paddingTop: 22,
                paddingBottom: 140, /* 버튼 공간 확보 */
                backgroundColor: BG,
                minHeight: '100%',
              }}
            >
            {/* 카드 1: 촬영 → 공부 */}
            <View
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 20,
                padding: 24,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 0.5,
              }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  backgroundColor: ACCENT_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <MaterialIcons name="photo-camera" size={32} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '900', color: INK }}>
                  한 번의 촬영으로 바로 공부
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: SUBTLE, marginTop: 8 }}>
                  교재·필기 사진을 찍으면 즉시 텍스트로 정리됩니다.
                </Text>
              </View>
            </View>

            {/* 카드 2: 즉시 질문 */}
            <View
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 20,
                padding: 24,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 0.5,
              }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  backgroundColor: ACCENT_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <MaterialIcons name="help-outline" size={32} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '900', color: INK }}>
                  모르는 건 즉시 질문
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: SUBTLE, marginTop: 8 }}>
                  한줄요약·쉬운설명·예시를 한 탭으로 받아보세요.
                </Text>
              </View>
            </View>

            {/* 카드 3: 스피드 퀴즈 */}
            <View
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 20,
                padding: 24,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 0.5,
              }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  backgroundColor: ACCENT_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <MaterialCommunityIcons name="flash-outline" size={40} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '900', color: INK }}>
                  5문항 스피드 퀴즈
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: SUBTLE, marginTop: 8 }}>
                  약점을 빠르게 점검하고 기억을 고정합니다.
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 20,
                padding: 24,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.02,
                shadowRadius: 10,
                elevation: 0.5,
              }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  backgroundColor: ACCENT_SOFT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <MaterialCommunityIcons name="robot-outline" size={36} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '900', color: INK }}>
                  AI 문제 생성
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: SUBTLE, marginTop: 8 }}>
                  AI로 생성해준 무작위 문제를 풀어보세요.
                </Text>
              </View>
            </View>

            {/* CTA: 다음 */}
            </ScrollView>
            {/* 고정 하단 NEXT 버튼 */}
            {phase === 'intro' && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: 22,
                  paddingBottom: Platform.OS === 'ios' ? 28 : 18,
                  paddingTop: 10,
                  backgroundColor: BG, // 배경색 통일
                }}
              >
                <TouchableOpacity
                  onPress={handleNext}
                  activeOpacity={0.9}
                  style={{
                    height: 56,
                    backgroundColor: ACCENT,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    shadowColor: '#000',
                    shadowOpacity: 0.02,
                    shadowRadius: 10,
                    elevation: 0.5,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#1A1A1A', marginRight: 6 }}>다음</Text>
                  <MaterialIcons name="arrow-forward" size={22} color={'#1A1A1A'} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ===== 로그인 페이지 ===== */}
          <KeyboardAvoidingView
            style={{ width: screenWidth, backgroundColor: BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={{ width: screenWidth }}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingTop: 26,
                paddingBottom: 80,
                backgroundColor: BG,
                minHeight: '100%',
                flexGrow: 1,
                justifyContent: 'center',
              }}
              keyboardShouldPersistTaps="handled"
            >
              {/* 제목/부제목 */}
              <Text style={{ fontSize: 24, fontWeight: '900', color: INK, textAlign: 'center' }}>로그인</Text>
              <Text style={{ fontSize: 13, color: SUBTLE, marginTop: 8, textAlign: 'center' }}>
                이메일과 비밀번호를 입력하세요.
              </Text>

              {/* 이메일 */}
              <View style={{ marginTop: 18 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>이메일</Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              {/* 비밀번호 (이메일과 간격 축소) */}
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>비밀번호</Text>
                <View
                  style={{
                    height: 50,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 14,
                    paddingRight: 8,
                  }}
                >
                  <TextInput
                    placeholder="******"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!pwVisible}
                    value={password}
                    onChangeText={setPassword}
                    style={{ flex: 1, color: INK }}
                  />
                  <TouchableOpacity
                    onPress={() => setPwVisible((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 18,
                    }}
                  >
                    <MaterialIcons
                      name={pwVisible ? 'visibility' : 'visibility-off'}
                      size={22}
                      color={SUBTLE}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity
                onPress={onLoginPress}
                activeOpacity={0.9}
                style={{
                  height: 52,
                  backgroundColor: ACCENT,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 22,
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 10,
                  elevation: 0.5,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A1A' }}>로그인</Text>
              </TouchableOpacity>

              {/* 하단 링크 */}
              <View
                style={{
                  marginTop: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TouchableOpacity onPress={() => setShowSignUp(true)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 13, color: INK, fontWeight: '800' }}>회원가입</Text>
                </TouchableOpacity>
                <Text style={{ color: '#D1D5DB', marginHorizontal: 10 }}>|</Text>
                <TouchableOpacity onPress={() => setShowFindAccount(true)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 13, color: INK, fontWeight: '800' }}>계정 찾기</Text>
                </TouchableOpacity>
                <Text style={{ color: '#D1D5DB', marginHorizontal: 10 }}>|</Text>
                <TouchableOpacity onPress={() => setShowFindPassword(true)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 13, color: INK, fontWeight: '800' }}>비밀번호 찾기</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 60 }} />
            </ScrollView>
            {/* 테스트 이동 버튼 */}
            {phase === 'login' && (
              <TouchableOpacity
                onPress={() => navigation?.replace?.('Main')}
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  backgroundColor: ACCENT,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 10,
                  elevation: 0.5,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1A1A1A' }}>로그인(테스트)</Text>
              </TouchableOpacity>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* ===== 회원가입 모달 ===== */}
      <Modal visible={showSignUp} animationType="slide" onRequestClose={() => setShowSignUp(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View
            style={{
              paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
              backgroundColor: BG,
              borderBottomColor: BORDER,
              borderBottomWidth: 1,
            }}
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '900', color: INK }}>회원가입</Text>
              <TouchableOpacity
                onPress={() => setShowSignUp(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#FFE4C2',
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="close" size={18} color={INK} />
                <Text style={{ color: INK, fontWeight: '800', marginLeft: 4 }}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 18, backgroundColor: BG }}>
              {/* 이름 */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>이름</Text>
                <TextInput
                  placeholder="홍길동"
                  placeholderTextColor="#9CA3AF"
                  value={suName}
                  onChangeText={setSuName}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              {/* 이메일 */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>이메일</Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={suEmail}
                  onChangeText={setSuEmail}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              {/* 생년/생일 */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>생년월일 (YYYY.MM.DD)</Text>
                <TextInput
                  placeholder="2002.03.10"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={suBirth}
                  onChangeText={(t) => setSuBirth(formatBirth(t))}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              {/* 비밀번호/확인 */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>비밀번호</Text>
                <TextInput
                  placeholder="6자 이상"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={suPassword}
                  onChangeText={setSuPassword}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>비밀번호 확인</Text>
                <TextInput
                  placeholder="비밀번호 다시 입력"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={suPassword2}
                  onChangeText={setSuPassword2}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              {/* 전화번호 + 인증 */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>전화번호</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    placeholder="010-0000-0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={suPhone}
                    onChangeText={(t) => setSuPhone(formatPhone(t))}
                    style={{
                      flex: 1,
                      height: 50,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 14,
                      backgroundColor: SURFACE,
                      color: INK,
                      marginRight: 10,
                    }}
                  />
                  <TouchableOpacity
                    onPress={onSendCode}
                    activeOpacity={0.9}
                    style={{
                      height: 50,
                      paddingHorizontal: 16,
                      backgroundColor: ACCENT,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      shadowColor: '#000',
                      shadowOpacity: 0.02,
                      shadowRadius: 10,
                      elevation: 0.5,
                    }}
                  >
                    <MaterialIcons name="sms" size={18} color={'#1A1A1A'} />
                    <Text style={{ color: '#1A1A1A', fontWeight: '900', marginLeft: 6 }}>인증코드 전송</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 인증 코드 */}
              {codeSent && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>인증코드 (6자리)</Text>
                  <TextInput
                    placeholder="------"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    style={{
                      height: 50,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 14,
                      backgroundColor: SURFACE,
                      color: INK,
                      letterSpacing: 4,
                      textAlign: 'center',
                    }}
                  />
                </View>
              )}

              {/* 가입 버튼 */}
              <TouchableOpacity
                onPress={onSignUp}
                activeOpacity={0.9}
                style={{
                  height: 52,
                  backgroundColor: ACCENT,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 22,
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 10,
                  elevation: 0.5,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A1A' }}>가입하기</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ===== 계정 찾기 모달 ===== */}
      <Modal visible={showFindAccount} animationType="slide" onRequestClose={() => setShowFindAccount(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View
            style={{
              paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
              backgroundColor: BG,
              borderBottomColor: BORDER,
              borderBottomWidth: 1,
            }}
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '900', color: INK }}>계정 찾기</Text>
              <TouchableOpacity
                onPress={() => setShowFindAccount(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#FFE4C2',
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="close" size={18} color={INK} />
                <Text style={{ color: INK, fontWeight: '800', marginLeft: 4 }}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
              <Text style={{ fontSize: 13, color: SUBTLE }}>
                등록된 전화번호 또는 이메일을 입력하면 계정을 찾아드려요.
              </Text>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>전화번호</Text>
                <TextInput
                  placeholder="010-0000-0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={findPhone}
                  onChangeText={(t) => setFindPhone(formatPhone(t))}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>이메일</Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={findEmail}
                  onChangeText={setFindEmail}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={() => Alert.alert('계정 찾기', '입력하신 정보로 계정을 확인하여 안내드릴게요.')}
                activeOpacity={0.9}
                style={{
                  height: 52,
                  backgroundColor: ACCENT,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 22,
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 10,
                  elevation: 0.5,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A1A' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ===== 비밀번호 찾기 모달 ===== */}
      <Modal visible={showFindPassword} animationType="slide" onRequestClose={() => setShowFindPassword(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View
            style={{
              paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
              backgroundColor: BG,
              borderBottomColor: BORDER,
              borderBottomWidth: 1,
            }}
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '900', color: INK }}>비밀번호 찾기</Text>
              <TouchableOpacity
                onPress={() => setShowFindPassword(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#FFE4C2',
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="close" size={18} color={INK} />
                <Text style={{ color: INK, fontWeight: '800', marginLeft: 4 }}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
              <Text style={{ fontSize: 13, color: SUBTLE }}>
                가입하신 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
              </Text>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>이메일</Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={findEmail}
                  onChangeText={setFindEmail}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (!findEmail) {
                    Alert.alert('비밀번호 찾기', '이메일을 입력해주세요.');
                    return;
                  }
                  Alert.alert('비밀번호 찾기', '입력하신 이메일로 안내를 보냈습니다.');
                }}
                activeOpacity={0.9}
                style={{
                  height: 52,
                  backgroundColor: ACCENT,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 22,
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 10,
                  elevation: 0.5,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A1A' }}>재설정 링크 보내기</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
