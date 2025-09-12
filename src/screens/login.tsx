import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useAppAlert } from '../components/AppAlertProvider';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Animated, Easing, Dimensions } from 'react-native';
import { signInWithEmail, signUpWithEmailAndProfile, sendPhoneCode, verifyPhoneCode, findAccountByPhoneOtp, sendPasswordReset } from '../logic/auth';
type Props = { navigation?: any };
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }: Props) {
  const appAlert = useAppAlert();
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
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null); // 1분 재전송 쿨다운 체크용
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null); // 3분 만료 시각 (ms)
  const [otpRemaining, setOtpRemaining] = useState<number>(0); // 남은 초

  // 계정/비번 찾기
  const [findEmail, setFindEmail] = useState('');
  const [findPhone, setFindPhone] = useState('');
  // 계정 찾기 전용 인증 상태
  const [findCodeSent, setFindCodeSent] = useState(false);
  const [findOtp, setFindOtp] = useState('');
  const [findCodeSentAt, setFindCodeSentAt] = useState<number | null>(null);
  const findOtpExpireTimerRef = useRef<any>(null);
  // 전화번호 인증 완료 여부
  const [phoneVerified, setPhoneVerified] = useState(false);

  // 비밀번호 규칙 플래그
  const pwLenOk = suPassword.length >= 6 && suPassword.length <= 16;
  const pwMixOk = /[A-Za-z]/.test(suPassword) && /[0-9]/.test(suPassword);
  const pwSpecialOk = /[^A-Za-z0-9]/.test(suPassword);
  const pwAllOk = pwLenOk && pwMixOk && pwSpecialOk;
  const pwConfirmMismatch = suPassword2.length > 0 && suPassword !== suPassword2;
  const nameFilled = suName.length > 0;
  const nameValid = /^[A-Za-z가-힣]{2,}$/.test(suName);
  const emailFilled = suEmail.length > 0;
  const emailValid = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(suEmail);

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

  // OTP 남은 시간 카운트다운 (회원가입)
  useEffect(() => {
    if (!otpExpiresAt) { setOtpRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setOtpRemaining(left);
      if (left <= 0) {
        // 만료: UI 초기화 (alert 없이)
        setCodeSent(false);
        setOtp('');
        setOtpExpiresAt(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [otpExpiresAt]);

  // 1) 로그인
  const onLoginPress = async () => {
    try {
      if (!email || !password) { appAlert('로그인','이메일/비밀번호를 입력해주세요.'); return; }
      await signInWithEmail(email, password);
      navigation?.replace?.('Main');
    } catch (e:any) {
      appAlert('로그인 실패', e.message || String(e));
    }
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

  // KR 전화번호를 E.164(+82) 형식으로 변환
  const toE164KR = (raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (d.startsWith('0')) return '+82' + d.slice(1);
    if (d.startsWith('82')) return '+' + d;
    return '+' + d;
  };

  const renderPwRule = (ok: boolean, label: string) => (
    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      <MaterialIcons name={ok ? 'check' : 'close'} size={14} color={ok ? '#4F46E5' : '#EF4444'} />
      <Text style={{ fontSize: 11, marginLeft: 4, color: ok ? SUBTLE : '#EF4444' }}>{label}</Text>
    </View>
  );
  // 2) 회원가입 - 전화번호 인증코드 전송 (Edge Function: otp-send)
  const onSendCode = async () => {
    if (!suPhone) { appAlert('인증','휴대폰 번호를 입력하세요.'); return; }
    // 1분 재전송 쿨다운
    if (codeSentAt && Date.now() - codeSentAt < 60_000) {
      appAlert('재발송 제한','1분뒤 시도해 주세요');
      return;
    }
    try {
      const toDigits = (s:string)=> s.replace(/\D/g,'');
      const { data, error } = await supabase.functions.invoke('otp-send', { body: { phone: toDigits(suPhone) } });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any)?.reason || 'SEND_FAILED');
      setCodeSent(true);
      setCodeSentAt(Date.now());
      setOtp('');
      const expires = Date.now() + 180_000; // 3분
      setOtpExpiresAt(expires);
      appAlert('인증','인증번호를 보냈습니다.');
    } catch(e:any) {
      appAlert('전송 실패', e.message || String(e));
    }
  };
  // 전화번호 OTP 검증 (Edge Function: otp-verify)
  const onVerifyPhoneOtp = async () => {
    if (!suPhone || otp.length !== 6) { appAlert('인증','전화번호와 6자리 코드를 확인하세요.'); return; }
    try {
      const toDigits = (s:string)=> s.replace(/\D/g,'');
      const { data, error } = await supabase.functions.invoke('otp-verify', {
        body: { phone: toDigits(suPhone), code: otp }
      });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error(((data as any)?.reason) || 'VERIFY_FAILED');
      setPhoneVerified(true);
      appAlert('인증','성공적으로 인증되었습니다!');
    } catch(e:any) {
      appAlert('실패', e.message || String(e));
    }
  };

  // 3) 회원가입 - 가입 완료 (전화번호 인증은 선택이지만, 했으면 코드 확인)
  const onSignUp = async () => {
    try {
  // 개별 검증
  if (!suName) { appAlert('이름 오류','이름을 입력해주세요.'); return; }
  if (!/^[A-Za-z가-힣]{2,}$/.test(suName)) { appAlert('이름 형식','이름은 한글/영문 2자 이상, 숫자/기호 불가입니다.'); return; }
  if (!suEmail) { appAlert('이메일','이메일을 입력해주세요.'); return; }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(suEmail)) { appAlert('이메일 형식','이메일 형식이 올바르지 않습니다.'); return; }
  if (!suBirth) { appAlert('생년월일','생년월일을 입력해주세요.'); return; }
  if (!suPhone) { appAlert('전화번호','전화번호를 입력해주세요.'); return; }
  // 비밀번호 정책: 6~16자 / 영문자 & 숫자 포함 / 특수문자 1개 이상
  if (!suPassword) { appAlert('비밀번호','비밀번호를 입력해주세요.'); return; }
  if (!pwLenOk) { appAlert('비밀번호 길이','비밀번호는 6자 이상 16자 이하입니다.'); return; }
  if (!pwMixOk) { appAlert('비밀번호 조합','영문자와 숫자를 모두 포함해야 합니다.'); return; }
  if (!pwSpecialOk) { appAlert('비밀번호 특수문자','특수문자 1개 이상 포함해야 합니다.'); return; }
  if (pwConfirmMismatch) { appAlert('비밀번호 확인','비밀번호가 일치하지 않습니다.'); return; }
      // DB 중복(있으면 알림 후 중단)
      const duplicated = await (async () => {
        try {
          // profiles 테이블이 존재한다면 이메일/전화 중복 확인 (없으면 에러 → 무시)
          const emailCheck = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('email', suEmail);
          if (emailCheck.count && emailCheck.count > 0) {
            appAlert('중복 계정', '이미 가입되어있는 이메일 입니다.');
            return true;
          }
          const phoneNorm = toE164KR(suPhone);
          const phoneCheck = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .or(`phone.eq.${suPhone},phone.eq.${phoneNorm}` as any);
          if (phoneCheck.count && phoneCheck.count > 0) {
            appAlert('중복 계정', '이미 가입되어있는 전화번호 입니다.');
            return true;
          }
        } catch {}
        return false;
      })();
      if (duplicated) return;

      if (codeSent) {
        if (otp.length !== 6) { appAlert('회원가입','전화번호 인증코드를 입력하세요.'); return; }
        await verifyPhoneCode(suPhone, otp);
        setPhoneVerified(true);
      }
      try {
        await signUpWithEmailAndProfile({ name: suName, email: suEmail, birth: suBirth, phone: suPhone, password: suPassword });
      } catch (err:any) {
        const msg = (err?.message || '').toString().toLowerCase();
        if (msg.includes('already') || msg.includes('exists')) {
          appAlert('중복 계정', '이미 가입되어있는 이메일 입니다.');
          return;
        }
        throw err;
      }
      appAlert('회원가입','가입이 완료되었습니다.', [
        { text:'확인', onPress:()=> setShowSignUp(false) }
      ]);
    } catch (e:any) {
      appAlert('가입 실패', e.message || String(e));
    }
  };

  // 계정 찾기: 인증코드 전송
  // 4) 계정 찾기 - 인증코드 전송
  const onSendFindCode = async () => {
    try {
      if (!findPhone) { appAlert('인증','전화번호를 입력하세요.'); return; }
      // 1분 재전송 제한
      if (findCodeSentAt && Date.now() - findCodeSentAt < 60_000) {
        appAlert('재발송 제한','재발송은 1분 뒤에 가능해요.');
        return;
      }
      await sendPhoneCode(findPhone);
      setFindCodeSent(true);
      setFindCodeSentAt(Date.now());
      setFindOtp('');
      if (findOtpExpireTimerRef.current) clearTimeout(findOtpExpireTimerRef.current);
      findOtpExpireTimerRef.current = setTimeout(() => {
        setFindCodeSent(false);
        setFindOtp('');
        appAlert('인증 만료','3분이 지나 인증번호가 만료되었어요. 다시 전송해주세요.');
      }, 180_000);
      appAlert('인증','인증코드를 전송했습니다. 6자리 코드를 입력하세요.');
    } catch (e:any) {
      appAlert('인증 오류', e.message || String(e));
    }
  };

  // 계정 찾기 완료 처리 (모의)
  // 5) 계정 찾기 - 코드 확인 후 이메일 마스킹 표시
  const onFindAccountConfirm = async () => {
    try {
      if (!findPhone || !findCodeSent || findOtp.length !== 6) { appAlert('계정 찾기','전화번호와 6자리 코드를 확인해주세요.'); return; }
      const masked = await findAccountByPhoneOtp(findPhone, findOtp);
      appAlert('계정 찾기', `가입된 이메일은\n${masked}\n입니다.`);
    } catch(e:any) {
      appAlert('계정 찾기 실패', e.message || String(e));
    }
  };

  const closeFindAccount = () => {
    setShowFindAccount(false);
    setFindCodeSent(false);
    setFindOtp('');
    setFindPhone('');
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
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 4 }}>이름</Text>
                <TextInput
                  placeholder="홍길동"
                  placeholderTextColor="#9CA3AF"
                  value={suName}
                  onChangeText={(t)=> setSuName(t.replace(/[^A-Za-z가-힣]/g,''))}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: !nameFilled ? BORDER : (nameValid ? '#4F46E5' : '#EF4444'),
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
                {nameFilled && !nameValid && (
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>한글/영문만 2자 이상 (숫자/특수문자 불가)</Text>
                )}
              </View>

              {/* 이메일 */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 4 }}>이메일</Text>
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
                    borderColor: !emailFilled ? BORDER : (emailValid ? '#4F46E5' : '#EF4444'),
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
                {emailFilled && !emailValid && (
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>올바른 이메일 형식이 아닙니다.</Text>
                )}
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
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 4 }}>비밀번호</Text>
                <TextInput
                  placeholder="6~16자, 영문+숫자+특수문자"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={suPassword}
                  onChangeText={setSuPassword}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: !suPassword ? BORDER : (pwAllOk ? '#4F46E5' : '#EF4444'),
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
                {/* 비밀번호 규칙 체크 리스트 */}
                {suPassword.length > 0 && (
                  <View style={{ marginTop: 8, marginBottom: 2 }}>
                    {renderPwRule(pwLenOk, '6자 이상, 16자 이하')}
                    {renderPwRule(pwMixOk, '영문자와 숫자 포함')}
                    {renderPwRule(pwSpecialOk, '특수문자 1개 이상 포함')}
                  </View>
                )}
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 4 }}>비밀번호 확인</Text>
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
                    borderColor: !suPassword2 ? BORDER : (pwConfirmMismatch ? '#EF4444' : '#4F46E5'),
                    borderRadius: 14,
                    backgroundColor: SURFACE,
                    color: INK,
                  }}
                />
                {pwConfirmMismatch && (
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>비밀번호가 일치하지 않습니다.</Text>
                )}
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
                    <Text style={{ color: '#1A1A1A', fontWeight: '900', marginLeft: 6 }}>{codeSent ? '재전송' : '인증코드 전송'}</Text>
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
                  {!!otpExpiresAt && otpRemaining > 0 && (
                    <Text style={{ marginTop: 6, fontSize: 11, color: SUBTLE, textAlign:'right' }}>
                      남은 시간 {Math.floor(otpRemaining/60).toString().padStart(2,'0')}:{(otpRemaining%60).toString().padStart(2,'0')}
                    </Text>
                  )}
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
  <Modal visible={showFindAccount} animationType="slide" onRequestClose={closeFindAccount}>
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
        onPress={closeFindAccount}
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
                등록한 휴대폰 번호로 인증하면 이메일을 알려드려요.
              </Text>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>전화번호</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    placeholder="010-0000-0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={findPhone}
                    onChangeText={(t) => setFindPhone(formatPhone(t))}
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
                    onPress={onSendFindCode}
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
                    <Text style={{ color: '#1A1A1A', fontWeight: '900', marginLeft: 6 }}>{findCodeSent ? '재전송' : '인증코드'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {findCodeSent && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>인증코드 (6자리)</Text>
                  <TextInput
                    placeholder="------"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={findOtp}
                    onChangeText={setFindOtp}
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

              <TouchableOpacity
                onPress={onFindAccountConfirm}
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
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A1A' }}>계정 찾기</Text>
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
                onPress={async () => {
                  try {
                    if (!findEmail) { appAlert('비밀번호 찾기','이메일을 입력해주세요.'); return; }
                    await sendPasswordReset(findEmail);
                    appAlert('비밀번호 찾기','입력하신 이메일로 재설정 링크를 보냈습니다.');
                  } catch(e:any) {
                    appAlert('오류', e.message || String(e));
                  }
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
