import React, { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';

const BG = '#F6F7FB';
const SURFACE = '#FFFFFF';
const ACCENT = '#FF8A00';
const BORDER = '#E6E8EE';
const INK = '#0B1220';
const SUBTLE = '#5B667A';
const DANGER = '#DC2626';
const SHADOW = { shadowColor:'#000', shadowOpacity:0.04, shadowRadius:18, elevation:4 } as const;

export interface AppAlertButton { text: string; style?: 'cancel'|'destructive'|'default'; onPress?: ()=>void; }
interface State { visible:boolean; title?:string; message?:string; buttons:AppAlertButton[] }
interface Ctx { alert:(title:string, message?:string, buttons?:AppAlertButton[])=>void }
const AlertCtx = createContext<Ctx|undefined>(undefined);

export const useAppAlert = () => {
  const c = useContext(AlertCtx);
  if(!c) throw new Error('useAppAlert outside provider');
  return c.alert;
};

export const AppAlertProvider = ({ children }: { children:React.ReactNode }) => {
  const [st, setSt] = useState<State>({ visible:false, buttons:[] });
  const opacity = React.useRef(new Animated.Value(0)).current;
  const alert = useCallback((title:string, message?:string, buttons:AppAlertButton[] = [{ text:'확인' }]) => {
    setSt({ visible:true, title, message, buttons });
    Animated.timing(opacity,{ toValue:1, duration:160, useNativeDriver:true }).start();
  }, []);
  const close = () => {
    Animated.timing(opacity,{ toValue:0, duration:140, useNativeDriver:true }).start(()=> setSt(s=>({ ...s, visible:false })));
  };
  const onPressBtn = (b:AppAlertButton) => {
    close();
    requestAnimationFrame(()=> b.onPress?.());
  };
  return (
    <AlertCtx.Provider value={{ alert }}>
      {children}
      <Modal visible={st.visible} transparent animationType="none" onRequestClose={close}>
        <Animated.View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.25)', opacity, justifyContent:'center', padding:28 }}>
          <View style={{ backgroundColor:SURFACE, borderRadius:24, borderWidth:1, borderColor:BORDER, padding:22, ...SHADOW }}>
            {!!st.title && <Text style={{ fontSize:16, fontWeight:'900', color:INK }}>{st.title}</Text>}
            {!!st.message && <Text style={{ marginTop:10, fontSize:13, lineHeight:19, color:SUBTLE }}>{st.message}</Text>}
            <View style={{ marginTop:22 }}>
              {st.buttons.map((b,i)=>{
                const isLast = i===st.buttons.length-1;
                let bg = '#FFF', col = INK, bd = BORDER;
                if (b.style==='destructive') { col = DANGER; bd='#F5C4C4'; bg='#FEF4F4'; }
                if (b.style==='cancel') { col = SUBTLE; }
                if (b.style==='default') { col = ACCENT; bg='#FFF1E0'; bd:'#FFE2C2'; }
                return (
                  <TouchableOpacity key={i} onPress={()=>onPressBtn(b)} activeOpacity={0.85} style={{ paddingVertical:14, paddingHorizontal:12, borderRadius:14, borderWidth:1, borderColor:bd, backgroundColor:bg, alignItems:'center', marginBottom:isLast?0:10 }}>
                    <Text style={{ fontSize:13, fontWeight:'800', color:col }}>{b.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Modal>
    </AlertCtx.Provider>
  );
};
