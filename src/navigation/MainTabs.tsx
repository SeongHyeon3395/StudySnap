import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
} from 'react-native';

const Tab = createBottomTabNavigator();

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

// 통일된 그림자 (로그인 화면 기준)
const SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.02,
  shadowRadius: 10,
  elevation: 0.5,
} as const;

function TopBar({ title }: { title: string }) {
  return (
    <View style={{ backgroundColor: BG, borderBottomColor: BORDER, borderBottomWidth: 1 }}>
      <View
        style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
          backgroundColor: BG,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '900', color: INK, letterSpacing: 0.3 }}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

function HomeScreen() {
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
    if (type === 'snap') showToast('스냅 정리 준비중');
    if (type === 'ask') showToast('즉시 질문 준비중');
    if (type === 'quiz') showToast('스피드 퀴즈 준비중');
    if (type === 'ai') showToast('AI 문제 준비중');
  };

  const tiles: Array<{key:string; label:string; desc:string; icon:React.ReactNode; type: 'snap'|'ask'|'quiz'|'ai'}> = [
    { key:'snap', label:'스냅 정리', desc:'찍고 정리', icon:<MaterialIcons name="photo-camera" size={24} color={ACCENT} />, type:'snap' },
    { key:'ask', label:'즉시 질문', desc:'바로 답변', icon:<MaterialIcons name="help-outline" size={24} color={ACCENT} />, type:'ask' },
    { key:'quiz', label:'스피드 퀴즈', desc:'5문항', icon:<MaterialCommunityIcons name="flash-outline" size={26} color={ACCENT} />, type:'quiz' },
    { key:'ai', label:'AI 문제', desc:'자동 생성', icon:<MaterialCommunityIcons name="robot-outline" size={24} color={ACCENT} />, type:'ai' },
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
            <View style={{ width:40, height:40, borderRadius:20, backgroundColor: ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER, marginRight:10, ...SHADOW }}>
              <Text style={{ fontWeight:'900', color: ACCENT }}>S</Text>
            </View>
            <Text style={{ fontSize:13, fontWeight:'800', color: INK }}>사용자</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:0, paddingTop:6, paddingBottom:140 }}>
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

        {/* Tiles */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center' }}>
          {tiles.map(t => (
            <TouchableOpacity key={t.key} activeOpacity={0.9} onPress={() => onPressCard(t.type)} style={{ width:'44%', marginHorizontal:'3%', marginBottom:18 }}>
              <View style={{ backgroundColor: SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:18, padding:14, minHeight:130, justifyContent:'space-between', ...SHADOW }}>
                <View style={{ width:52, height:52, borderRadius:14, backgroundColor: ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER, marginBottom:12 }}>
                  {t.icon}
                </View>
                <View>
                  <Text style={{ fontSize:14, fontWeight:'900', color: INK }} numberOfLines={1}>{t.label}</Text>
                  <Text style={{ fontSize:11, color: SUBTLE, marginTop:4 }} numberOfLines={1}>{t.desc}</Text>
                </View>
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
    { id:'ad1', title:'AI 문제 10회 무료', subtitle:'첫 사용자 체험 기회', accent: ACCENT, bg: '#FFFFFF' },
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
  const showToast = (msg: string) => {
    setToast(msg);
    Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      }, 1600);
    });
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <TopBar title="설정" />
      <View style={{ flex: 1, backgroundColor: BG, padding: 20 }}>
        <View style={{ backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: INK, fontSize: 15, fontWeight: '900' }}>계정</Text>
          <Text style={{ color: SUBTLE, fontSize: 13, marginTop: 6 }}>example@domain.com</Text>
        </View>
        <TouchableOpacity
          onPress={() => showToast('로그아웃 준비중')}
          style={{ height: 50, backgroundColor: ACCENT, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
          activeOpacity={0.9}
        >
          <Text style={{ color: '#1A1A1A', fontWeight: '900', fontSize: 15 }}>로그아웃</Text>
        </TouchableOpacity>
      </View>
      <Animated.View pointerEvents={toast ? 'auto' : 'none'} style={{ position:'absolute', bottom:90, left:0, right:0, alignItems:'center', opacity:toastOpacity }}>
        <View style={{ backgroundColor: SURFACE, borderRadius:14, borderWidth:1, borderColor:BORDER, paddingHorizontal:16, paddingVertical:12, ...SHADOW, maxWidth:'80%' }}>
          <Text style={{ color: INK, fontSize:13, fontWeight:'600' }}>{toast}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
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
        component={HomeScreen}
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
