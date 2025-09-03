import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Easing,
  BackHandler,
} from 'react-native';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();

// THEME — Neutral + Orange Accent + Deep Navy (로그인 화면과 동일 팔레트)
const BG = '#F6F7FB';          // 전체 배경
const SURFACE = '#FFFFFF';     // 카드/입력 배경
const CARD_SOFT = '#FDFEFE';   // 아주 옅은 서피스
const ACCENT = '#FF8A00';      // 포인트 오렌지
const ACCENT_SOFT = '#FFF1E0'; // 오렌지 소프트 배경
const INK = '#0B1220';         // 진한 텍스트(네이비)
const SUBTLE = '#5B667A';      // 보조 텍스트
const BORDER = '#E6E8EE';      // 경계선
const SUCCESS = '#16A34A';     // 완료(체크) 색상
const DANGER = '#DC2626';      // 위험(삭제 등)

// 통일된 그림자 (로그인 화면 기준)
const SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.02,
  shadowRadius: 10,
  elevation: 0.5,
} as const;

function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={{ backgroundColor: BG, borderBottomColor: BORDER, borderBottomWidth: 1 }}>
      <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0, backgroundColor: BG }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent:'center' }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ position:'absolute', left:6, top:10, padding:6 }} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <MaterialIcons name="arrow-back" size={24} color={INK} />
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 19, fontWeight: '900', color: INK, letterSpacing: 0.3, textAlign:'center' }}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

function HomeScreen({ navigation }: any) {
  // In-app toast message
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const [toast, setToast] = React.useState('');
  const showToast = (msg: string) => {
    setToast(msg);
    Animated.timing(toastOpacity, { toValue: 1, duration: 160, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      }, 1800);
    });
  };

  // Goals
  type Goal = { id: string; text: string; done: boolean };
  const [goals, setGoals] = React.useState<Goal[]>([
    { id: 'g1', text: '스냅 1개 정리', done: false },
    { id: 'g2', text: '퀴즈 5문항 풀기', done: false },
    { id: 'g3', text: '요약 1회 생성', done: true },
    { id: 'g4', text: '약점노트 업데이트', done: false },
  ]);
  const [editVisible, setEditVisible] = React.useState(false);
  const [showAllModal, setShowAllModal] = React.useState(false);

  const toggleGoal = (id: string) => setGoals(g => g.map(it => it.id === id ? { ...it, done: !it.done } : it));
  const addGoal = () => setGoals(g => [...g, { id: 'g' + Math.random().toString(36).slice(2,7), text: '새 목표', done: false }]);
  const updateGoalText = (id: string, text: string) => setGoals(g => g.map(it => it.id === id ? { ...it, text } : it));
  const deleteGoal = (id: string) => setGoals(g => g.filter(it => it.id !== id));

  const onPressCard = (type: 'snap' | 'ask' | 'quiz' | 'ai') => {
    if (type === 'snap') { navigation.navigate('Snap'); return; }
    if (type === 'ask') { navigation.navigate('Ask'); return; }
    if (type === 'quiz') showToast('스피드 퀴즈 준비중');
    if (type === 'ai') showToast('AI 문제 준비중');
  };

  const tiles: Array<{key:'snap'|'ask'|'quiz'|'ai'; label:string; desc:string; long:string; icon:React.ReactNode; type: 'snap'|'ask'|'quiz'|'ai'}> = [
    { key:'snap', label:'스냅 정리', desc:'찍고 정리', long:'사진을 찍고 PDF 변환 · 텍스트 추출 등을 할 수 있어요.', icon:<MaterialIcons name="photo-camera" size={24} color={ACCENT} />, type:'snap' },
    { key:'ask', label:'즉시 질문', desc:'바로 답변', long:'궁금한 점을 바로 물어보세요!', icon:<MaterialIcons name="help-outline" size={24} color={ACCENT} />, type:'ask' },
    { key:'quiz', label:'스피드 퀴즈', desc:'5문항', long:'생성된 문제를 바탕으로 빠르게 퀴즈를 풀어요.', icon:<MaterialCommunityIcons name="flash-outline" size={26} color={ACCENT} />, type:'quiz' },
    { key:'ai', label:'AI 문제생성', desc:'자동 생성', long:'AI가 학습 문제를 만들어줘요.', icon:<MaterialCommunityIcons name="robot-outline" size={24} color={ACCENT} />, type:'ai' },
  ];
  const visibleGoals = goals.slice(0,3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0, backgroundColor: BG, paddingHorizontal:20, paddingBottom:4 }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'flex-end' }}>
          <View style={{ marginRight:'auto' }}>
            <Text style={{ color: INK, fontSize:18, fontWeight:'900' }}>오늘도 집중해볼까요?</Text>
            <Text style={{ color: SUBTLE, fontSize:12, marginTop:4 }}>목표를 하나씩 완수해요</Text>
          </View>
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            {/* Plan Badge */}
            <View style={{ paddingHorizontal:10, paddingVertical:5, backgroundColor:'#FFE8CC', borderRadius:12, marginRight:8, borderWidth:1, borderColor:BORDER }}>
              <Text style={{ fontSize:10, fontWeight:'800', color: ACCENT, letterSpacing:0.5 }}>PREMIUM</Text>
            </View>
            <Text style={{ fontSize:13, fontWeight:'800', color: INK }}>사용자</Text>
          </View>
        </View>
      </View>

  <ScrollView style={{ flex:1 }} contentContainerStyle={{ paddingTop:6, paddingBottom:140 }} showsVerticalScrollIndicator={false}>
        <AdCarousel />

        {/* Goals Card (shows first 3) */}
  <View style={{ backgroundColor: SURFACE, borderRadius:20, borderWidth:1, borderColor:BORDER, padding:18, marginBottom:20, alignSelf:'center', width:'90%', ...SHADOW }}>
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:14 }}>
            <View style={{ width:50, height:50, borderRadius:16, backgroundColor: ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER, marginRight:14 }}>
              <MaterialIcons name="calendar-today" size={26} color={ACCENT} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:16, fontWeight:'900', color: INK }}>오늘 목표</Text>
              <TouchableOpacity onPress={() => setShowAllModal(true)} hitSlop={{ top:6, bottom:6, left:6, right:6 }}>
                <Text style={{ fontSize:12, color: ACCENT, marginTop:4, fontWeight:'700' }}>더 보기</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setEditVisible(true)} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor: ACCENT_SOFT, borderWidth:1, borderColor:BORDER }}>
              <Text style={{ color: ACCENT, fontWeight:'800', fontSize:12 }}>편집</Text>
            </TouchableOpacity>
          </View>
          {visibleGoals.map(g => (
            <View key={g.id} style={{ flexDirection:'row', alignItems:'center', paddingVertical:6 }}>
              <Text style={{ flex:1, fontSize:14, fontWeight:'600', color: g.done ? SUBTLE : INK, textDecorationLine: g.done ? 'line-through' : 'none' }} numberOfLines={1}>• {g.text}</Text>
              <TouchableOpacity onPress={() => toggleGoal(g.id)} style={{ width:26, height:26, borderRadius:8, borderWidth:1, borderColor: g.done ? SUCCESS : BORDER, backgroundColor: g.done ? SUCCESS : '#fff', alignItems:'center', justifyContent:'center' }}>
                {g.done && <MaterialIcons name="check" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          ))}
          {goals.length > 3 && (
            <TouchableOpacity onPress={() => setShowAllModal(true)} style={{ paddingVertical:4 }}>
              <Text style={{ fontSize:12, color: SUBTLE }}>… {goals.length - 3}개 더 있음</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tiles 2x2 (간격 축소 & 목표 카드 폭(90%) 정렬) */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', width:'90%', alignSelf:'center', marginTop:4 }}>
          {tiles.map(t => (
            <TouchableOpacity key={t.key} activeOpacity={0.9} onPress={() => onPressCard(t.type)} style={{ width:'48%', marginBottom:14 }}>
              <View style={{ backgroundColor: SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:20, padding:13, minHeight:165, justifyContent:'flex-start', alignItems:'center', ...SHADOW }}>
                <View style={{ width:52, height:52, borderRadius:15, backgroundColor: ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER, marginBottom:10 }}>
                  {t.icon}
                </View>
                <Text style={{ fontSize:14.5, fontWeight:'900', color: INK, textAlign:'center', width:'100%' }} numberOfLines={1}>{t.label}</Text>
                <Text style={{ fontSize:11, color: SUBTLE, marginTop:6, fontWeight:'600', textAlign:'center', lineHeight:16 }} numberOfLines={4}>{t.long}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
  </ScrollView>

      {/* All Goals Modal */}
  <Modal visible={showAllModal} animationType="fade" transparent onRequestClose={() => setShowAllModal(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.25)', justifyContent:'center', padding:24 }}>
          <View style={{ backgroundColor: SURFACE, borderRadius:20, borderWidth:1, borderColor:BORDER, padding:20, maxHeight:'80%', width:'100%' }}>
            <Text style={{ fontSize:16, fontWeight:'900', color: INK, marginBottom:12 }}>전체 목표</Text>
            <ScrollView style={{ maxHeight:340 }}>
              {goals.map(g => (
                <View key={g.id} style={{ flexDirection:'row', alignItems:'center', paddingVertical:8 }}>
                  <Text style={{ flex:1, fontSize:14, fontWeight:'600', color: g.done ? SUBTLE : INK, textDecorationLine: g.done ? 'line-through' : 'none' }}>• {g.text}</Text>
                  <TouchableOpacity onPress={() => toggleGoal(g.id)} style={{ width:26, height:26, borderRadius:8, borderWidth:1, borderColor: g.done ? SUCCESS : BORDER, backgroundColor: g.done ? SUCCESS : '#fff', alignItems:'center', justifyContent:'center' }}>
                    {g.done && <MaterialIcons name="check" size={18} color="#fff" />}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowAllModal(false)} style={{ marginTop:16, paddingVertical:12, borderRadius:12, backgroundColor: ACCENT, alignItems:'center' }}>
              <Text style={{ color:'#fff', fontWeight:'800' }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Goals Modal */}
      <Modal visible={editVisible} animationType="fade" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.25)', justifyContent:'center', padding:24 }}>
          <View style={{ backgroundColor: SURFACE, borderRadius:20, borderWidth:1, borderColor:BORDER, padding:18, maxHeight:'80%' }}>
            <Text style={{ fontSize:16, fontWeight:'900', color: INK, marginBottom:12 }}>목표 편집</Text>
            <ScrollView style={{ maxHeight:300 }}>
              {goals.map(g => (
                <View key={g.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:10 }}>
                      <TouchableOpacity onPress={() => toggleGoal(g.id)} style={{ width:28, height:28, borderRadius:8, borderWidth:1, borderColor: g.done ? SUCCESS : BORDER, backgroundColor: g.done ? SUCCESS : '#fff', alignItems:'center', justifyContent:'center', marginRight:10 }}>
                        {g.done && <MaterialIcons name="check" size={18} color="#fff" />}
                  </TouchableOpacity>
                  <TextInput value={g.text} onChangeText={tx => updateGoalText(g.id, tx)} style={{ flex:1, fontSize:14, paddingVertical:6, paddingHorizontal:10, borderWidth:1, borderColor:BORDER, borderRadius:10, backgroundColor:'#fff' }} placeholder="목표 입력" />
                  <TouchableOpacity onPress={() => deleteGoal(g.id)} style={{ marginLeft:8, padding:8 }}>
                    <MaterialIcons name="close" size={20} color={SUBTLE} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection:'row', marginTop:12 }}>
              <TouchableOpacity onPress={addGoal} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor: ACCENT_SOFT, borderWidth:1, borderColor:BORDER, alignItems:'center', marginRight:8 }}>
                <Text style={{ color: ACCENT, fontWeight:'800' }}>추가</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor: ACCENT, alignItems:'center' }}>
                <Text style={{ color:'#fff', fontWeight:'800' }}>완료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Animated.View pointerEvents={toast ? 'auto' : 'none'} style={{ position:'absolute', bottom:90, left:0, right:0, alignItems:'center', opacity:toastOpacity }}>
        <View style={{ backgroundColor: SURFACE, borderRadius:14, borderWidth:1, borderColor:BORDER, paddingHorizontal:16, paddingVertical:12, ...SHADOW, maxWidth:'80%' }}>
          <Text style={{ color: INK, fontSize:13, fontWeight:'600' }}>{toast}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// 광고 캐러셀 컴포넌트
function AdCarousel() {
  const width = Dimensions.get('window').width;
  const horizontalPadding = 20; // 좌우 패딩 (홈 섹션 전반)
  const cardWidth = width - horizontalPadding * 2;
  const ads: Array<{id:string; title:string; subtitle:string; accent?:string; bg?:string}> = [
    { id:'ad1', title:'AI 문제생성 10회 무료', subtitle:'첫 사용자 체험 기회', accent: ACCENT, bg: '#FFFFFF' },
    { id:'ad2', title:'곧 출시 · 스터디 플랜', subtitle:'개인 맞춤 일정 추천', accent: '#0B1220', bg: '#FFFFFF' },
  ];
  const [index, setIndex] = React.useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / cardWidth);
    if (i !== index) setIndex(i);
  };
  return (
    <View style={{ marginBottom: 22 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
      >
        {ads.map((ad, i) => (
          <View
            key={ad.id}
            style={{
              width: cardWidth,
              marginRight: i === ads.length - 1 ? 0 : 14,
              backgroundColor: ad.bg || '#FFF',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: BORDER,
              paddingVertical: 30,
              paddingHorizontal: 26,
              justifyContent: 'center',
              overflow: 'hidden',
              ...SHADOW,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '900', color: INK, lineHeight: 30, letterSpacing: -0.5 }}>
              {ad.title}
            </Text>
            <Text style={{ fontSize: 13, color: SUBTLE, marginTop: 10, fontWeight: '600' }}>{ad.subtitle}</Text>
            <Text style={{ position:'absolute', bottom:8, right:12, fontSize:9, color:'#9AA2AF', fontWeight:'600' }}>광고</Text>
          </View>
        ))}
      </ScrollView>
      {/* 인디케이터 */}
      <View style={{ flexDirection:'row', justifyContent:'center', marginTop:12 }}>
        {ads.map((a,i)=>(
          <View key={a.id} style={{ width: i===index?18:6, height:6, borderRadius:3, backgroundColor: i===index?ACCENT:'#D5D9E1', marginHorizontal:3 }} />
        ))}
      </View>
    </View>
  );
}

function LibraryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <TopBar title="자료함" />
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MaterialIcons name="folder-open" size={40} color={ACCENT} />
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '900', color: INK }}>자료가 비어있어요</Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: SUBTLE, textAlign: 'center' }}>
          홈에서 촬영하거나 노트를 만들면 여기에 모여요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function PlanScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <TopBar title="플랜" />
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MaterialIcons name="event-note" size={40} color={ACCENT} />
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '900', color: INK }}>시험 일정을 등록해보세요</Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: SUBTLE, textAlign: 'center' }}>
          일정에 맞춰 하루 학습량을 자동 배분해 드릴게요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SettingsScreen() {
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const [toast, setToast] = React.useState('');
  const width = Dimensions.get('window').width;
  const currentPlan: 'free' | 'standard' | 'premium' = 'premium'; // 테스트 계정 고정
  const plans: Array<{key:'free'|'standard'|'premium'; label:string; highlight?:boolean; desc:string; color?:string}> = [
    { key:'free', label:'FREE', desc:'기본 기능', color:'#9AA2AF' },
    { key:'standard', label:'STANDARD', desc:'추가 기능', color:'#586174' },
    { key:'premium', label:'PREMIUM', desc:'모든 기능', color:ACCENT },
  ];
  // 로컬 상태 (서버 동기화 전 임시)
  const [appLock, setAppLock] = React.useState(false);              // 계정 & 보안
  const [dailyReminder, setDailyReminder] = React.useState(true);   // 알림
  const [weeklyReport, setWeeklyReport] = React.useState(false);    // 알림
  const [examAlert, setExamAlert] = React.useState(true);           // 알림
  const [dataOptIn, setDataOptIn] = React.useState(false);          // 개인정보
  // 사용량 (샘플 값)
  const uploadsToday = 12; const uploadLimit = 30;
  // 현재 뷰 (null = 루트)
  type SettingsSection = 'account'|'subscription'|'notifications'|'privacy'|'about';
  const [section, setSection] = React.useState<SettingsSection|null>(null);
  const [renderingSection, setRenderingSection] = React.useState<SettingsSection|null>(null); // 애니메이션 표시용
  const showToast = (msg: string) => {
    setToast(msg);
    Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      }, 1600);
    });
  };
  const Toggle = ({ value, onToggle }: { value:boolean; onToggle:()=>void }) => (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={{ width:50, height:28, borderRadius:18, padding:3, backgroundColor: value?ACCENT_SOFT:'#F0F2F6', borderWidth:1, borderColor:value?ACCENT:BORDER, justifyContent:'center' }}>
      <Animated.View style={{ alignSelf: value?'flex-end':'flex-start', width:22, height:22, borderRadius:11, backgroundColor: value?ACCENT:'#FFFFFF', borderWidth:1, borderColor:BORDER }} />
    </TouchableOpacity>
  );
  const Card = ({ children, style } : { children:React.ReactNode; style?:any }) => (
    <View style={[{ backgroundColor:SURFACE, borderRadius:16, borderWidth:1, borderColor:BORDER, padding:14, ...SHADOW }, style]}>{children}</View>
  );
  // 섹션 타이틀 맵 (TopBar 표기용)
  const sectionTitleMap: Record<SettingsSection,string> = {
    account: '계정 & 보안',
    subscription: '구독 & 사용량',
    notifications: '알림',
    privacy: '개인정보 & 데이터',
    about: '앱 정보 & 지원',
  };
  // 루트 항목 정의
  const rootItems: Array<{key:SettingsSection; title:string; desc:string; icon:string}> = [
    { key:'account', title:'계정 & 보안', desc:'프로필 · 비밀번호 · 기기', icon:'person' },
    { key:'subscription', title:'구독 & 사용량', desc:'플랜 · 업로드 한도', icon:'workspace-premium' },
    { key:'notifications', title:'알림', desc:'목표 · 리포트 · 일정', icon:'notifications-active' },
    { key:'privacy', title:'개인정보 & 데이터', desc:'내보내기 · 캐시 · 동의', icon:'privacy-tip' },
    { key:'about', title:'앱 정보 & 지원', desc:'버전 · 약관 · 문의', icon:'info' },
  ];

  // 화면 이탈 시 루트로 리셋
  // 슬라이드 애니메이션 값 (0 = 루트, 1 = 섹션)
  const sectionAnim = React.useRef(new Animated.Value(0)).current;
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setSection(null);
        setRenderingSection(null);
        sectionAnim.setValue(0);
      };
    }, [sectionAnim])
  );

  // 섹션별 렌더
  const renderSection = () => {
    if (!renderingSection) return null;
    if (renderingSection === 'account') return (
      <Card>
        <View style={{ flexDirection:'row', alignItems:'center', marginBottom:16 }}>
          <View style={{ flex:1 }}>
            <Text style={{ color: INK, fontSize:14, fontWeight:'800' }}>사용자</Text>
            <Text style={{ color: SUBTLE, fontSize:12, marginTop:4 }}>example@domain.com</Text>
          </View>
          <TouchableOpacity onPress={()=>showToast('프로필 편집 준비중')} style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:10, backgroundColor:ACCENT_SOFT, borderWidth:1, borderColor:BORDER }}>
            <Text style={{ fontSize:12, fontWeight:'700', color:ACCENT }}>편집</Text>
          </TouchableOpacity>
        </View>
        {[
          { k:'연동 계정 관리', a:() => showToast('OAuth 연동 준비중') },
          { k:'비밀번호 변경', a:() => showToast('비밀번호 변경 준비중') },
          { k:'모든 기기 로그아웃', a:() => showToast('전체 로그아웃 준비중') },
        ].map(item => (
          <TouchableOpacity key={item.k} onPress={item.a} style={{ paddingVertical:10 }}>
            <Text style={{ color: INK, fontSize:13, fontWeight:'600' }}>{item.k}</Text>
          </TouchableOpacity>
        ))}
  <View style={{ paddingVertical:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <Text style={{ color: INK, fontSize:13, fontWeight:'600' }}>앱 잠금 (지문/Face ID)</Text>
          <Toggle value={appLock} onToggle={()=>setAppLock(v=>!v)} />
        </View>
        <TouchableOpacity onPress={()=>showToast('계정 삭제 플로우 준비중')} style={{ paddingVertical:12, marginTop:4 }}>
          <Text style={{ color: DANGER, fontSize:13, fontWeight:'700' }}>계정 삭제</Text>
        </TouchableOpacity>
      </Card>
    );
  if (renderingSection === 'subscription') return (
      <Card>
        <View style={{ flexDirection:'row', alignItems:'center', marginBottom:10 }}>
          <Text style={{ color: INK, fontSize:14, fontWeight:'800', flex:1 }}>현재 구독플랜</Text>
          <View style={{ paddingHorizontal:10, paddingVertical:5, backgroundColor:'#FFE8CC', borderRadius:12, borderWidth:1, borderColor:BORDER }}>
            <Text style={{ fontSize:10, fontWeight:'800', color: ACCENT }}>{currentPlan.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={{ color: SUBTLE, fontSize:12 }}>Premium 테스트 계정 · 업그레이드 기능 준비중</Text>
        <View style={{ flexDirection:'row', marginTop:12 }}>
          {plans.map(p=>{ const active=p.key===currentPlan; return (
            <TouchableOpacity key={p.key} onPress={()=>showToast(active?'현재 플랜입니다':'변경 준비중')} style={{ flex:1, marginRight:8, paddingVertical:10, borderRadius:12, borderWidth:1, borderColor:active?ACCENT:BORDER, backgroundColor:active?ACCENT_SOFT:'#FFF', alignItems:'center' }}>
              <Text style={{ fontSize:11, fontWeight:'800', color:p.color||INK }}>{p.label}</Text>
            </TouchableOpacity>
          );})}
        </View>
        <TouchableOpacity onPress={()=>showToast('구독 관리(스토어) 이동 준비중')} style={{ marginTop:12 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:ACCENT }}>구독 관리</Text>
        </TouchableOpacity>
        <View style={{ marginTop:20 }}>
          <Text style={{ fontSize:12, fontWeight:'700', color:SUBTLE }}>오늘 업로드 {uploadsToday}/{uploadLimit}</Text>
          <View style={{ height:8, borderRadius:4, backgroundColor:'#ECEFF3', marginTop:6, overflow:'hidden' }}>
            <View style={{ width:`${Math.min(100, uploadsToday/uploadLimit*100)}%`, backgroundColor:ACCENT, height:'100%' }} />
          </View>
        </View>
        <TouchableOpacity onPress={()=>showToast('월간 통계 준비중')} style={{ marginTop:16 }}>
          <Text style={{ fontSize:12, color:ACCENT, fontWeight:'700' }}>월간 이용 통계</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>showToast('영수증 / 결제내역 준비중')} style={{ marginTop:10 }}>
          <Text style={{ fontSize:12, color:ACCENT, fontWeight:'700' }}>영수증 / 결제내역</Text>
        </TouchableOpacity>
      </Card>
    );
  if (renderingSection === 'notifications') return (
      <Card>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8 }}>
          <View>
            <Text style={{ fontSize:13, fontWeight:'600', color:INK }}>일일 목표 리마인더</Text>
            <TouchableOpacity onPress={()=>showToast('시간 설정 준비중')} style={{ marginTop:4 }}>
              <Text style={{ fontSize:11, color:ACCENT, fontWeight:'600' }}>08:00 변경</Text>
            </TouchableOpacity>
          </View>
          <Toggle value={dailyReminder} onToggle={()=>setDailyReminder(v=>!v)} />
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:INK }}>주간 리포트</Text>
          <Toggle value={weeklyReport} onToggle={()=>setWeeklyReport(v=>!v)} />
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:INK }}>시험 일정 알림</Text>
          <Toggle value={examAlert} onToggle={()=>setExamAlert(v=>!v)} />
        </View>
      </Card>
    );
  if (renderingSection === 'privacy') return (
      <Card>
        <TouchableOpacity onPress={()=>showToast('데이터 내보내기 준비중')} style={{ paddingVertical:10 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:INK }}>데이터 내보내기 (PDF/텍스트)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>showToast('캐시 삭제 준비중')} style={{ paddingVertical:10 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:INK }}>캐시 삭제</Text>
        </TouchableOpacity>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:INK }}>모델 개선용 데이터 활용 동의</Text>
          <Toggle value={dataOptIn} onToggle={()=>setDataOptIn(v=>!v)} />
        </View>
      </Card>
    );
  if (renderingSection === 'about') return (
      <Card>
        <TouchableOpacity onPress={()=>showToast('변경 로그 준비중')} style={{ paddingTop:4 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:ACCENT }}>변경 로그</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>showToast('약관 보기 준비중')} style={{ paddingTop:8 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:ACCENT }}>서비스 이용약관</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>showToast('개인정보 처리방침 준비중')} style={{ paddingTop:8 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:ACCENT }}>개인정보 처리방침</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>showToast('피드백 메일 준비중')} style={{ paddingTop:8 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:ACCENT }}>문의 / 피드백</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>showToast('오픈소스 라이선스 준비중')} style={{ paddingTop:8 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:ACCENT }}>오픈소스 라이선스</Text>
        </TouchableOpacity>
      </Card>
    );
    return null;
  };
  // 섹션 진입/복귀 애니메이션
  const openSection = (key: SettingsSection) => {
    setRenderingSection(key);
    setSection(key); // 즉시 헤더 반영
    requestAnimationFrame(() => {
      Animated.timing(sectionAnim, { toValue:1, duration:260, easing:Easing.out(Easing.cubic), useNativeDriver:true }).start();
    });
  };
  const goBack = () => {
    setSection(null); // 헤더 즉시 '설정'으로
    Animated.timing(sectionAnim, { toValue:0, duration:240, easing:Easing.out(Easing.cubic), useNativeDriver:true }).start(()=>{
      setRenderingSection(null);
    });
  };
  // 안드로이드 하드웨어 뒤로가기 처리: 섹션 내부라면 루트로
  React.useEffect(() => {
    const onHardwareBack = () => {
      if (renderingSection) {
        goBack();
        return true; // 기본 동작 방지
      }
      return false; // 기본 (탭/앱) 뒤로가기 진행
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [renderingSection, goBack]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <TopBar title={section ? sectionTitleMap[section] : '설정'} onBack={section ? goBack : undefined} />
      <View style={{ flex:1, backgroundColor:BG, position:'relative' }}>
        {/* 루트 목록 */}
        <ScrollView
          style={{ flex:1 }}
          contentContainerStyle={{ paddingBottom:120 }}
          showsVerticalScrollIndicator={false}
          pointerEvents={section ? 'none':'auto'}
        >
          <View>
            {rootItems.map((it, idx) => (
              <TouchableOpacity
                key={it.key}
                onPress={()=>openSection(it.key)}
                activeOpacity={0.8}
                style={{
                  backgroundColor:SURFACE,
                  borderTopWidth: idx===0 ? 0 : 1,
                  borderBottomWidth:1,
                  borderColor:BORDER,
                  paddingVertical:18,
                  paddingHorizontal:20,
                  flexDirection:'row',
                  alignItems:'center',
                }}>
                <View style={{ width:50, height:50, borderRadius:14, backgroundColor:ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER, marginRight:18 }}>
                  <MaterialIcons name={it.icon as any} size={24} color={ACCENT} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:16, fontWeight:'900', color:INK, textAlign:'left' }}>{it.title}</Text>
                  <Text style={{ fontSize:12, color:SUBTLE, marginTop:6 }}>{it.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={SUBTLE} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ marginTop:40, alignItems:'center' }}>
            <Text style={{ fontSize:11, color:SUBTLE, fontWeight:'600' }}>버전 1.0.0</Text>
          </View>
        </ScrollView>
        {/* 섹션 화면 (슬라이드) */}
    {renderingSection && (
          <Animated.View
            style={{
              position:'absolute',
              top:0,
              left:0,
              right:0,
              bottom:0,
              backgroundColor:BG,
              transform:[{ translateX: sectionAnim.interpolate({ inputRange:[0,1], outputRange:[width,0] }) }],
            }}
      pointerEvents={renderingSection ? 'auto':'none'}
          >
            <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20, paddingBottom:140 }} showsVerticalScrollIndicator={false}>
              {renderSection()}
              <View style={{ marginTop:40, alignItems:'center' }}>
                <Text style={{ fontSize:11, color:SUBTLE, fontWeight:'600' }}>버전 1.0.0</Text>
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </View>
      <Animated.View pointerEvents={toast ? 'auto' : 'none'} style={{ position:'absolute', bottom:90, left:0, right:0, alignItems:'center', opacity:toastOpacity }}>
        <View style={{ backgroundColor: SURFACE, borderRadius:14, borderWidth:1, borderColor:BORDER, paddingHorizontal:16, paddingVertical:12, ...SHADOW, maxWidth:'80%' }}>
          <Text style={{ color: INK, fontSize:13, fontWeight:'600' }}>{toast}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// Snap & Ask Screen 동적 import (탭 초기 로드 가볍게)
const SnapScreen = React.lazy(() => import('../screens/SnapScreen'));
const AskScreen = React.lazy(() => import('../screens/AskScreen'));

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown:false }}>
      <HomeStackNav.Screen name="HomeRoot" component={HomeScreen} />
  <HomeStackNav.Screen name="Snap" component={SnapScreen} />
  <HomeStackNav.Screen name="Ask" component={AskScreen} />
    </HomeStackNav.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: INK,
        tabBarInactiveTintColor: SUBTLE,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: BORDER,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: '자료함',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="folder" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarLabel: '플랜',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="event-note" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
