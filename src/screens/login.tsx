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
  const [suBirthYear, setSuBirthYear] = useState('');
  const [suBirthMD, setSuBirthMD] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suPassword2, setSuPassword2] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState('');

  // 계정/비번 찾기
  const [findEmail, setFindEmail] = useState('');
  const [findPhone, setFindPhone] = useState('');

  // THEME
  const BG = '#FFFDF6';        // 아이보리 톤 배경
  const CARD = '#FFF6D8';      // 카드 배경(미세하게 진한 톤)
  const ACCENT = '#FFCF33';    // 포인트 옐로
  const INK = '#0F172A';       // 진한 잉크(남색 계열)
  const SUBTLE = '#475569';    // 보조 텍스트
  const BORDER = '#E5E7EB';    // 경계선
  const WHITE = '#FFFFFF';

  const handleNext = () => {
    if (phase === 'login') return;
    setPhase('login');
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
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

  const onSignUp = () => {
    if (!suName || !suEmail || !suBirthYear || !suBirthMD || !suPhone) {
      Alert.alert('회원가입', '모든 필드를 입력해주세요.');
      return;
    }
    if (suBirthYear.length !== 4 || suBirthMD.length !== 4) {
      Alert.alert('회원가입', '생년은 YYYY, 생일은 MMDD 형식으로 입력해주세요.');
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

      {/* 헤더(중앙 제목) - 상태표시줄과 겹치지 않도록 SafeArea + 추가 패딩 */}
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
            justifyContent: 'center', // 중앙 정렬
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '800', color: INK, letterSpacing: 0.3 }}>
            StudySnap
          </Text>
        </View>
      </View>

      {/* 본문 슬라이더 */}
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: BG }}>
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            width: screenWidth * 2,
            transform: [{ translateX }],
          }}
        >
          {/* 인트로 페이지 */}
          <ScrollView
            style={{ width: screenWidth }}
            contentContainerStyle={{
              paddingHorizontal: 22,
              paddingTop: 22,
              paddingBottom: 30,
              backgroundColor: BG,
              minHeight: '100%',
            }}
          >
          {/* 카드 1 */}
          <View
            style={{
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: ACCENT,
              borderRadius: 18,
              padding: 20,
              marginBottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                backgroundColor: WHITE,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                borderWidth: 1,
                borderColor: ACCENT,
              }}
            >
              <MaterialIcons name="camera-alt" size={30} color={ACCENT} />
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

          {/* 카드 2 */}
          <View
            style={{
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: ACCENT,
              borderRadius: 18,
              padding: 20,
              marginBottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                backgroundColor: WHITE,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                borderWidth: 1,
                borderColor: ACCENT,
              }}
            >
              <MaterialIcons name="help-outline" size={30} color={ACCENT} />
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

          {/* 카드 3 */}
          <View
            style={{
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: ACCENT,
              borderRadius: 18,
              padding: 20,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                backgroundColor: WHITE,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                borderWidth: 1,
                borderColor: ACCENT,
              }}
            >
              <MaterialIcons name="quiz" size={30} color={ACCENT} />
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

          {/* CTA: 다음 (본문 하단에만 배치) */}
          <View style={{ height: 18 }} />
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.9}
              style={{
                height: 54,
                backgroundColor: ACCENT,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900', color: INK, marginRight: 6 }}>다음</Text>
              <MaterialIcons name="arrow-forward" size={20} color={INK} />
            </TouchableOpacity>
          </ScrollView>

          {/* 로그인 페이지 */}
          <KeyboardAvoidingView
            style={{ width: screenWidth, backgroundColor: BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={{ width: screenWidth }}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingTop: 26,
                paddingBottom: 40,
                backgroundColor: BG,
                minHeight: '100%',
              }}
              keyboardShouldPersistTaps="handled"
            >
            {/* 제목/부제목 중앙 정렬 */}
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
                  backgroundColor: WHITE,
                  color: INK,
                }}
              />
            </View>

            {/* 비밀번호 (이메일과 간격 축소) */}
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>비밀번호</Text>
              <View
                style={{
                  height: 50,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 14,
                  backgroundColor: WHITE,
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
                  <MaterialIcons name={pwVisible ? 'visibility' : 'visibility-off'} size={22} color={SUBTLE} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 로그인 버튼 (중앙 정렬 느낌을 위해 가로 꽉 채우고 텍스트 중앙) */}
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
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900', color: INK }}>로그인</Text>
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
            </ScrollView>
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
                  backgroundColor: '#FFECA6',
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

          <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                    backgroundColor: WHITE,
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
                    backgroundColor: WHITE,
                    color: INK,
                  }}
                />
              </View>

              {/* 생년/생일 */}
              <View style={{ marginTop: 12, flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>태어난 년도 (YYYY)</Text>
                  <TextInput
                    placeholder="2001"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={suBirthYear}
                    onChangeText={setSuBirthYear}
                    style={{
                      height: 50,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 14,
                      backgroundColor: WHITE,
                      color: INK,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>생일 (MMDD)</Text>
                  <TextInput
                    placeholder="0315"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={suBirthMD}
                    onChangeText={setSuBirthMD}
                    style={{
                      height: 50,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 14,
                      backgroundColor: WHITE,
                      color: INK,
                    }}
                  />
                </View>
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
                    backgroundColor: WHITE,
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
                    backgroundColor: WHITE,
                    color: INK,
                  }}
                />
              </View>

              {/* 전화번호 + 인증 */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>전화번호</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TextInput
                    placeholder="01012345678"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={suPhone}
                    onChangeText={setSuPhone}
                    style={{
                      flex: 1,
                      height: 50,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 14,
                      backgroundColor: WHITE,
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
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <MaterialIcons name="sms" size={18} color={INK} />
                    <Text style={{ color: INK, fontWeight: '900', marginLeft: 6 }}>인증코드 전송</Text>
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
                      backgroundColor: WHITE,
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
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: INK }}>가입하기</Text>
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
                  backgroundColor: '#FFECA6',
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

          <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
              <Text style={{ fontSize: 13, color: SUBTLE }}>
                등록된 전화번호 또는 이메일을 입력하면 계정을 찾아드려요.
              </Text>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, color: SUBTLE, marginBottom: 8 }}>전화번호</Text>
                <TextInput
                  placeholder="01012345678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={findPhone}
                  onChangeText={setFindPhone}
                  style={{
                    height: 50,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 14,
                    backgroundColor: WHITE,
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
                    backgroundColor: WHITE,
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
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: INK }}>확인</Text>
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
                  backgroundColor: '#FFECA6',
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

          <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                    backgroundColor: WHITE,
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
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: INK }}>재설정 링크 보내기</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
