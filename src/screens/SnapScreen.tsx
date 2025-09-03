import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, ScrollView, Image, ActivityIndicator, Modal, TextInput, Alert, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, Asset } from 'react-native-image-picker';

// (AI 추출 기능 임시 비활성화) 추후 모델 연결 예정
const extractTextFromImage = async (_base64: string) => {
  await new Promise<void>(resolve=>setTimeout(()=>resolve(),700));
  return '현재 이미지 텍스트 추출 기능은 비활성화 상태입니다. 추후 업데이트에서 제공될 예정입니다.';
};

// Theme tokens (동일 팔레트)
const BG = '#F6F7FB';
const SURFACE = '#FFFFFF';
const CARD_SOFT = '#FDFEFE';
const ACCENT = '#FF8A00';
const ACCENT_SOFT = '#FFF1E0';
const INK = '#0B1220';
const SUBTLE = '#5B667A';
const BORDER = '#E6E8EE';
const DANGER = '#DC2626';
const SHADOW = {
  shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 0.5,
};

type PickedFile = {
  type: 'image' | 'pdf';
  name: string;
  uri: string;
  size?: number;
  pages?: number; // pdf 페이지 수 (간이 검증 — 실제 PDF 파싱 대신 placeholder)
  asset?: Asset;
};

export default function SnapScreen({ navigation }: any) {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [extracting, setExtracting] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [namingVisible, setNamingVisible] = useState(false);
  const [pdfName, setPdfName] = useState('스냅_노트');
  const [converting, setConverting] = useState(false);
  const [appAlert, setAppAlert] = useState<{ visible:boolean; title:string; message:string; buttons?: Array<{ text:string; onPress?:()=>void; style?:'cancel'|'default'|'destructive' }> }>({ visible:false, title:'', message:'' });

  // 스캔 애니메이션
  useEffect(() => {
    if (extracting) {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.timing(scanAnim, { toValue: 1, duration: 1300, useNativeDriver: true })
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [extracting, scanAnim]);

  // 파일 업로드 기능 제거(모듈 삭제) - placeholder
  const pickFile = () => {
    showAlert('기능 준비 중', '현재 버전에서는 파일 업로드 기능이 비활성화되어 있습니다.\n추후 업데이트에서 제공될 예정입니다.');
  };

  // 커스텀 알림 (앱 스타일 모달)
  const showAlert = (title: string, message: string, buttons?: Array<{ text:string; onPress?:()=>void; style?:'cancel'|'default'|'destructive' }>) => {
    setAppAlert({ visible:true, title, message, buttons });
  };
  const closeAlert = () => setAppAlert(a => ({ ...a, visible:false }));

  // react-native-image-picker 가 자체적으로 카메라 권한 요청을 트리거 (Android)
  const checkCameraPermission = async () => true;

  const takePhoto = async () => {
    try {
  await checkCameraPermission();

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: true,
        cameraType: 'back'
      });

      console.log('카메라 결과:', result);

      if (result.didCancel) {
        console.log('사용자가 카메라를 취소했습니다.');
        return;
      }

      if (result.errorCode) {
        if (result.errorCode === 'camera_unavailable') {
          showAlert('카메라 불가', '이 기기에서 카메라를 사용할 수 없어요.');
        } else if (result.errorCode === 'permission') {
          showAlert('권한 필요', '카메라 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.', [
            { text:'닫기', style:'cancel' },
            { text:'설정 열기', onPress: () => Linking.openSettings() }
          ]);
        } else {
          showAlert('카메라 오류', '카메라 실행 중 오류가 발생했어요. 다시 시도해주세요.');
        }
        return; 
      }

      const asset = result.assets?.[0];
      if (asset?.uri) {
        console.log('촬영된 이미지:', asset.uri);
        setFile({
          type: 'image',
          name: asset.fileName || 'camera.jpg',
          uri: asset.uri,
          size: asset.fileSize,
          asset
        });
      }
    } catch (error: any) {
  console.error('카메라 실행 오류:', error);
  showAlert('카메라 오류', '카메라를 실행할 수 없어요. 다시 시도해주세요.');
    }
  };

  const reset = () => {
    setFile(null);
    setExtractedText(null);
  };

  const startExtract = async () => {
    if (!file) return;
    setExtracting(true);
    setExtractedText(null);
    
    try {
      // 이미지를 Base64로 변환
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const extractedText = await extractTextFromImage(base64);
          setExtractedText(extractedText);
        } catch (error: any) {
          showAlert('추출 실패', error.message || '텍스트를 추출하는 데 실패했어요.');
        } finally {
          setExtracting(false);
        }
      };
      
      reader.onerror = () => {
        showAlert('이미지 오류', '이미지를 처리하는 중 문제가 발생했어요.');
        setExtracting(false);
      };
      
      reader.readAsDataURL(blob);
    } catch (error: any) {
      showAlert('로딩 오류', '이미지를 불러오는 중 문제가 발생했어요.');
      setExtracting(false);
    }
  };

  const openNaming = () => setNamingVisible(true);
  const cancelNaming = () => setNamingVisible(false);
  const confirmConvert = () => {
    setNamingVisible(false);
    setConverting(true);
    setTimeout(() => {
      setConverting(false);
      // 자료함 이동 placeholder
  showAlert('PDF 저장 완료', '자료함에 저장되었다고 가정합니다.\n파일명: ' + pdfName + '.pdf');
      reset();
    }, 1800);
  };

  const progressBar = (
    <View style={{ height:4, backgroundColor:'#ECEFF3', borderRadius:2, overflow:'hidden', marginTop:14 }}>
      <Animated.View style={{ width: scanAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }), backgroundColor:ACCENT, height:'100%' }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      {/* 상단 바 */}
      <View style={{ paddingTop: Platform.OS==='android' ? (StatusBar.currentHeight||0) : 0, borderBottomWidth:1, borderColor:BORDER, backgroundColor:BG }}>
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:10 }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (navigation && navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
              else reset();
            }}
            style={{ width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' }}
            hitSlop={{ top:8,bottom:8,left:8,right:8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={INK} />
          </TouchableOpacity>
          <Text style={{ flex:1, textAlign:'center', fontSize:18, fontWeight:'900', color:INK }}>스냅 정리</Text>
          {/* Reset / Close on right */}
          <TouchableOpacity
            onPress={reset}
            disabled={!file && !extractedText}
            style={{ width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center', opacity: (!file && !extractedText)?0.2:1 }}
            hitSlop={{ top:8,bottom:8,left:8,right:8 }}
          >
            <MaterialIcons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow:1, padding:20 }} showsVerticalScrollIndicator={false}>
        {!file && !extractedText && !extracting && (
          <View style={{ flex:1, justifyContent:'center', minHeight:600 }}>
            <Text style={{ fontSize:16, fontWeight:'900', color:INK, marginBottom:20, textAlign:'center' }}>무엇을 할까요?</Text>
            <View style={{ paddingHorizontal:16 }}>
              <TouchableOpacity onPress={takePhoto} style={{ width:'100%', backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:18, padding:20, marginBottom:16, flexDirection:'row', alignItems:'center', ...SHADOW }}>
                <View style={{ width:48, height:48, borderRadius:14, backgroundColor:ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER }}>
                  <MaterialIcons name="photo-camera" size={26} color={ACCENT} />
                </View>
                <View style={{ marginLeft:16, flex:1 }}>
                  <Text style={{ fontSize:16, fontWeight:'800', color:INK }}>사진 촬영하기</Text>
                  <Text style={{ fontSize:12, color:SUBTLE, marginTop:4, lineHeight:16 }}>문서나 필기 이미지를 촬영해요</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={SUBTLE} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={pickFile} style={{ width:'100%', backgroundColor:'#F3F4F6', borderWidth:1, borderColor:BORDER, borderRadius:18, padding:20, flexDirection:'row', alignItems:'center', opacity:0.7 }}>
                <View style={{ width:48, height:48, borderRadius:14, backgroundColor:'#E5E7EB', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER }}>
                  <MaterialIcons name="block" size={26} color={SUBTLE} />
                </View>
                <View style={{ marginLeft:16, flex:1 }}>
                  <Text style={{ fontSize:16, fontWeight:'800', color:SUBTLE }}>파일 업로드 (비활성화)</Text>
                  <Text style={{ fontSize:12, color:SUBTLE, marginTop:4, lineHeight:16 }}>추후 업데이트 예정</Text>
                </View>
                <MaterialIcons name="info" size={20} color={SUBTLE} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {file && !extracting && !extractedText && (
          <View>
            <Text style={{ fontSize:15, fontWeight:'800', color:INK, marginBottom:12 }}>선택된 {file.type === 'pdf' ? 'PDF' : '이미지'}</Text>
            <View style={{ backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:18, padding:16, ...SHADOW }}>
              {file.type === 'image' ? (
                <Image source={{ uri: file.uri }} style={{ width:'100%', height:260, borderRadius:12, backgroundColor:'#DDD' }} resizeMode="contain" />
              ) : (
                <View style={{ height:260, borderRadius:12, backgroundColor:'#FAFAFC', borderWidth:1, borderColor:BORDER, alignItems:'center', justifyContent:'center' }}>
                  <MaterialIcons name="picture-as-pdf" size={60} color={ACCENT} />
                  <Text style={{ fontSize:12, marginTop:8, color:SUBTLE }}>{file.pages} 페이지</Text>
                </View>
              )}
              <View style={{ flexDirection:'row', marginTop:14 }}>
                <TouchableOpacity onPress={()=>setFile(null)} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT_SOFT, borderWidth:1, borderColor:BORDER, alignItems:'center', marginRight:8 }}>
                  <Text style={{ color:ACCENT, fontWeight:'800' }}>다시 선택</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={startExtract} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'800' }}>텍스트 추출</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {extracting && (
          <View style={{ alignItems:'center', marginTop:40 }}>
            <View style={{ width:220, height:220, borderRadius:24, backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, alignItems:'center', justifyContent:'center', ...SHADOW }}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={{ marginTop:14, fontSize:13, color:SUBTLE, fontWeight:'600' }}>스캔중...</Text>
              {progressBar}
            </View>
            <Text style={{ fontSize:12, color:SUBTLE, marginTop:18 }}>이미지/문서를 분석하여 텍스트를 추출하고 있어요</Text>
          </View>
        )}

        {extractedText && !extracting && (
          <View>
            <Text style={{ fontSize:15, fontWeight:'800', color:INK, marginBottom:12 }}>추출 결과</Text>
            <View style={{ backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:18, padding:16, ...SHADOW }}>
              <ScrollView style={{ maxHeight:300 }}>
                <Text style={{ fontSize:13, lineHeight:20, color:INK }}>{extractedText}</Text>
              </ScrollView>
              <View style={{ flexDirection:'row', marginTop:14 }}>
                <TouchableOpacity onPress={()=>{ if(extractedText) { showAlert('복사됨', '클립보드에 복사되었습니다.'); } }} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT_SOFT, borderWidth:1, borderColor:BORDER, alignItems:'center', marginRight:8 }}>
                  <Text style={{ color:ACCENT, fontWeight:'800' }}>복사하기</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openNaming} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'800' }}>PDF 변환</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={reset} style={{ marginTop:12, alignSelf:'center', paddingVertical:6, paddingHorizontal:10 }}>
                <Text style={{ fontSize:11, color:SUBTLE }}>다시 시작</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {converting && (
          <View style={{ marginTop:40, alignItems:'center' }}>
            <View style={{ width:200, height:200, borderRadius:20, backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, alignItems:'center', justifyContent:'center', ...SHADOW }}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={{ marginTop:12, fontSize:13, color:SUBTLE, fontWeight:'600' }}>PDF 변환중...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 공통 알림 모달 */}
      <Modal visible={appAlert.visible} transparent animationType="fade" onRequestClose={closeAlert}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.25)', justifyContent:'center', padding:28 }}>
          <View style={{ backgroundColor:SURFACE, borderRadius:22, borderWidth:1, borderColor:BORDER, padding:22 }}>
            <Text style={{ fontSize:16, fontWeight:'900', color:INK }}>{appAlert.title}</Text>
            <Text style={{ fontSize:13, color:SUBTLE, lineHeight:20, marginTop:12 }}>{appAlert.message}</Text>
            <View style={{ flexDirection:'row', marginTop:22 }}>
              {(appAlert.buttons && appAlert.buttons.length > 0 ? appAlert.buttons : [{ text:'확인', style:'default' as const }]).map((b, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => { closeAlert(); b.onPress && b.onPress(); }}
                  style={{ flex:1, paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:b.style==='destructive'?DANGER:BORDER, backgroundColor:b.style==='cancel'?ACCENT_SOFT: (b.style==='destructive'? '#FFF' : ACCENT), alignItems:'center', marginLeft: idx===0?0:10 }}>
                  <Text style={{ fontSize:13, fontWeight:'800', color: b.style==='cancel'?ACCENT : (b.style==='destructive'? DANGER : '#FFF') }}>{b.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* 파일명 입력 모달 */}
      <Modal visible={namingVisible} transparent animationType="fade" onRequestClose={cancelNaming}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.28)', justifyContent:'center', padding:24 }}>
          <View style={{ backgroundColor:SURFACE, borderRadius:20, borderWidth:1, borderColor:BORDER, padding:20 }}>
            <Text style={{ fontSize:15, fontWeight:'800', color:INK }}>PDF 이름 설정</Text>
            <TextInput value={pdfName} onChangeText={setPdfName} style={{ marginTop:14, borderWidth:1, borderColor:BORDER, borderRadius:12, paddingHorizontal:14, paddingVertical:10, backgroundColor:'#FFF', fontSize:14 }} placeholder="파일 이름" />
            <View style={{ flexDirection:'row', marginTop:18 }}>
              <TouchableOpacity onPress={cancelNaming} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT_SOFT, borderWidth:1, borderColor:BORDER, alignItems:'center', marginRight:8 }}>
                <Text style={{ color:ACCENT, fontWeight:'800' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmConvert} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center' }}>
                <Text style={{ color:'#fff', fontWeight:'800' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
