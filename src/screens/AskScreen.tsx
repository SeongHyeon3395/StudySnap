import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StatusBar, Platform, TouchableOpacity, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Keyboard, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// THEME (재사용)
const BG = '#F6F7FB';
const SURFACE = '#FFFFFF';
const ACCENT = '#FF8A00';
const ACCENT_SOFT = '#FFF1E0';
const INK = '#0B1220';
const SUBTLE = '#5B667A';
const BORDER = '#E6E8EE';
const DANGER = '#DC2626';
const SHADOW = { shadowColor:'#000', shadowOpacity:0.02, shadowRadius:10, elevation:0.5 };

// 현재 AI 백엔드 비활성화 상태 (향후 연결 예정)
const GEMINI_KEY = '';
const GEMINI_TEXT_URL = '';

type ChatMessage = { id:string; role:'user'|'model'|'system'; text:string };

const DAILY_LIMIT = 5; // 하루 5회
const MAX_LEN = 500;   // 질문 500자 제한
const STORAGE_KEY = 'ASK_DAILY_STATE';

export default function AskScreen(){
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id:'sys1', role:'system', text:'무엇이든 물어보세요. 하루 5회 무료, 질문은 500자 이하입니다.'
  }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [today, setToday] = useState<string>('');
  const fadeWarn = useRef(new Animated.Value(0)).current;

  // 날짜 초기화 & 스토리지 로드
  useEffect(()=>{
    const init = async ()=>{
      const d = new Date();
      const day = d.toISOString().slice(0,10);
      setToday(day);
      try{
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if(raw){
          const parsed = JSON.parse(raw);
          if(parsed.date === day){ setDailyCount(parsed.count||0); }
          else { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({date:day, count:0})); }
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({date:day, count:0}));
        }
      }catch(e){ console.warn('load daily state fail', e); }
    };
    init();
  },[]);

  const persistCount = async (next:number)=>{
    try{ await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({date:today, count:next})); }catch{}
  };

  const canAsk = dailyCount < DAILY_LIMIT;
  const overLimit = !canAsk;
  const overLength = input.length > MAX_LEN;

  const scrollRef = useRef<FlatList<any>>(null);
  useEffect(()=>{ // 새 메시지에 스크롤
    if(scrollRef.current) setTimeout(()=> scrollRef.current?.scrollToEnd({animated:true}), 60);
  },[messages.length]);

  const buildPayload = () => null; // placeholder

  const sendQuestion = async () => {
    if(!input.trim() || overLength || overLimit || sending) return;
    // AI 비활성화 안내
    const userMsg:ChatMessage = { id:Date.now()+"_u", role:'user', text: input.slice(0,MAX_LEN) };
    setMessages(m=>[...m, userMsg]);
    setInput('');
    setSending(true);
    Keyboard.dismiss();
    try{
  await new Promise<void>(resolve=>setTimeout(()=>resolve(),600));
      const answer = '현재 AI 답변 기능은 비활성화되어 있습니다. 추후 업데이트에서 사용할 수 있어요.';
      setMessages(m=>[...m,{id:Date.now()+"_m", role:'model', text: answer}]);
      const next = dailyCount + 1; setDailyCount(next); persistCount(next);
    }catch(e:any){
      setMessages(m=>[...m,{id:Date.now()+"_e", role:'model', text:'오류가 발생했습니다: '+ (e.message||'') }]);
    }finally{ setSending(false); }
  };

  // 경고 애니메이션 (길이 초과 시)
  useEffect(()=>{
    Animated.timing(fadeWarn,{ toValue: overLength?1:0, duration:180, useNativeDriver:true }).start();
  },[overLength]);

  const renderItem = ({item}:{item:ChatMessage}) => {
    if(item.role==='system') return (
      <View style={{ alignSelf:'center', backgroundColor:'#ECEFF3', paddingVertical:8, paddingHorizontal:14, borderRadius:20, marginVertical:10 }}>
        <Text style={{ fontSize:11, color:SUBTLE, fontWeight:'600' }}>{item.text}</Text>
      </View>
    );
    const isUser = item.role==='user';
    return (
      <View style={{ paddingVertical:6 }}>
        <View style={{ alignSelf: isUser? 'flex-end':'flex-start', maxWidth:'85%', backgroundColor: isUser? ACCENT : SURFACE, borderRadius:18, borderWidth:1, borderColor: isUser? ACCENT : BORDER, paddingHorizontal:14, paddingVertical:10 }}>
          <Text style={{ fontSize:13, lineHeight:19, color: isUser? '#FFF': INK, fontWeight:isUser?'600':'500' }}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View style={{ paddingTop: Platform.OS==='android'? (StatusBar.currentHeight||0) : 0, borderBottomWidth:1, borderColor:BORDER, backgroundColor:BG }}>
        <View style={{ paddingHorizontal:16, paddingVertical:10, alignItems:'center', justifyContent:'center' }}>
          <Text style={{ fontSize:18, fontWeight:'900', color:INK }}>즉시 질문</Text>
          <Text style={{ position:'absolute', right:16, top:14, fontSize:11, color:SUBTLE, fontWeight:'600' }}>{dailyCount}/{DAILY_LIMIT}</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={Platform.OS==='ios'?0:0}>
        <FlatList
          ref={scrollRef}
            data={messages}
            keyExtractor={it=>it.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding:16, paddingBottom:140 }}
            showsVerticalScrollIndicator={false}
          />
        {/* Input Bar */}
        <View style={{ position:'absolute', left:0, right:0, bottom:0, padding:14, backgroundColor:BG, borderTopWidth:1, borderColor:BORDER }}>
          {!canAsk && (
            <View style={{ backgroundColor:'#FFE5E5', borderWidth:1, borderColor:'#FFB4B4', padding:10, borderRadius:12, marginBottom:10 }}>
              <Text style={{ fontSize:11, color:DANGER, fontWeight:'700' }}>오늘 무료 질문 한도를 모두 사용했어요. 내일 다시 시도해주세요.</Text>
            </View>
          )}
          <View style={{ flexDirection:'row', alignItems:'flex-end' }}>
            <View style={{ flex:1, marginRight:8 }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={canAsk? '질문을 입력하세요 (500자 이하)':'한도 초과'}
                placeholderTextColor={SUBTLE}
                multiline
                style={{ maxHeight:140, minHeight:48, paddingHorizontal:14, paddingVertical:12, backgroundColor:SURFACE, borderWidth:1, borderColor: overLength? DANGER : BORDER, borderRadius:16, fontSize:13, color:INK }}
                editable={canAsk && !sending}
              />
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:4 }}>
                <Animated.Text style={{ fontSize:10, fontWeight:'600', color:DANGER, opacity:fadeWarn }}>
                  500자를 초과했습니다.
                </Animated.Text>
                <Text style={{ fontSize:10, fontWeight:'600', color: overLength? DANGER : SUBTLE }}>{input.length}/{MAX_LEN}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={sendQuestion}
              disabled={sending || overLength || !canAsk || !input.trim()}
              style={{ width:52, height:48, borderRadius:14, backgroundColor: (sending || overLength || !canAsk || !input.trim())? '#E2E5EA': ACCENT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:(sending || overLength || !canAsk || !input.trim())? '#D3D6DB': ACCENT }}>
              {sending? <ActivityIndicator color={ACCENT} /> : <MaterialIcons name="send" size={20} color={ (sending || overLength || !canAsk || !input.trim())? SUBTLE : '#FFF'} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
