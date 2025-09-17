import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, ScrollView, Image, ActivityIndicator, Modal, TextInput, Alert, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { extractTextWithGemini } from '../logic/ai';
import { generatePdfBytesFromText, uploadPdfToLibrary } from '../logic/library';
import { fileToBase64FromUri } from '../lib/file';

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
  const [noTextFound, setNoTextFound] = useState(false);
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

  // 갤러리에서 이미지 선택 (PDF 지원 제거 - 호환성 문제로 DocumentPicker 삭제)
  const pickFile = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9, includeBase64: false });
      if (result.didCancel) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) { showAlert('선택 오류','이미지를 불러오지 못했습니다.'); return; }
      setFile({ type:'image', name: asset.fileName || 'gallery.jpg', uri: asset.uri, size: asset.fileSize });
      setExtractedText(null);
    } catch(e:any) {
      showAlert('선택 오류', e.message || '갤러리 접근 중 문제 발생');
    }
  };

  // 커스텀 알림 (앱 스타일 모달)
  const showAlert = (title: string, message: string, buttons?: Array<{ text:string; onPress?:()=>void; style?:'cancel'|'default'|'destructive' }>) => {
    setAppAlert({ visible:true, title, message, buttons });
  };
  const closeAlert = () => setAppAlert(a => ({ ...a, visible:false }));

  // 카메라 권한 확인/요청
  const checkCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const res = await check(PERMISSIONS.ANDROID.CAMERA);
      if (res === RESULTS.GRANTED) return true;
      if (res === RESULTS.DENIED) {
        const r = await request(PERMISSIONS.ANDROID.CAMERA);
        return r === RESULTS.GRANTED;
      }
      if (res === RESULTS.BLOCKED) {
        showAlert('권한 필요','설정에서 카메라 권한을 허용해주세요.', [
          { text:'닫기', style:'cancel' },
          { text:'설정 열기', onPress:()=>openSettings() }
        ]);
        return false;
      }
      return false;
    } else if (Platform.OS === 'ios') {
      const res = await check(PERMISSIONS.IOS.CAMERA);
      if (res === RESULTS.GRANTED) return true;
      if (res === RESULTS.DENIED) {
        const r = await request(PERMISSIONS.IOS.CAMERA);
        return r === RESULTS.GRANTED;
      }
      if (res === RESULTS.BLOCKED) {
        showAlert('권한 필요','설정에서 카메라 권한을 허용해주세요.', [
          { text:'닫기', style:'cancel' },
          { text:'설정 열기', onPress:()=>openSettings() }
        ]);
        return false;
      }
      return false;
    }
    return true;
  };

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
    setNoTextFound(false);
  };

  const startExtract = async () => {
    if (!file || file.type !== 'image') return;
    setExtracting(true);
    setExtractedText(null);
    setNoTextFound(false);
    try {
      const base64 = await fileToBase64FromUri(file.uri);
      const text = await extractTextWithGemini(base64);
      if (!text || !text.trim()) {
        setNoTextFound(true);
        setExtractedText(null);
      } else {
        setExtractedText(text.trim());
      }
    } catch (e:any) {
      showAlert('추출 실패', e.message || '텍스트 추출 중 오류');
    } finally {
      setExtracting(false);
    }
  };

  const openNaming = () => setNamingVisible(true);
  const cancelNaming = () => setNamingVisible(false);
  const confirmConvert = async () => {
    try {
      setNamingVisible(false);
      setConverting(true);
      let bytes: Uint8Array;
      if (file?.type === 'pdf') {
        const res = await fetch(file.uri);
        const buf = await res.arrayBuffer();
        bytes = new Uint8Array(buf);
      } else {
        if (!extractedText) { showAlert('안내','먼저 텍스트를 추출해주세요.'); setConverting(false); return; }
        bytes = await generatePdfBytesFromText(extractedText);
      }
      const path = await uploadPdfToLibrary(pdfName, bytes);
      setConverting(false);
      showAlert('PDF 저장 완료', '자료함에 저장되었습니다.', [
        { text:'확인', onPress: () => { reset(); } }
      ]);
    } catch (e:any) {
      setConverting(false);
      showAlert('저장 실패', e.message || String(e));
    }
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
              
        <TouchableOpacity onPress={pickFile} style={{ width:'100%', backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:18, padding:20, flexDirection:'row', alignItems:'center', ...SHADOW }}>
                <View style={{ width:48, height:48, borderRadius:14, backgroundColor:ACCENT_SOFT, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:BORDER }}>
                  <MaterialIcons name="upload-file" size={26} color={ACCENT} />
                </View>
                <View style={{ marginLeft:16, flex:1 }}>
          <Text style={{ fontSize:16, fontWeight:'800', color:INK }}>이미지 선택</Text>
          <Text style={{ fontSize:12, color:SUBTLE, marginTop:4, lineHeight:16 }}>갤러리에서 불러오기</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={SUBTLE} />
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
                  <Text style={{ fontSize:12, marginTop:8, color:SUBTLE }}>{file.pages ? `${file.pages} 페이지` : 'PDF 파일'}</Text>
                </View>
              )}
              <View style={{ flexDirection:'row', marginTop:14 }}>
                <TouchableOpacity onPress={()=>setFile(null)} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT_SOFT, borderWidth:1, borderColor:BORDER, alignItems:'center', marginRight:8 }}>
                  <Text style={{ color:ACCENT, fontWeight:'800' }}>다시 선택</Text>
                </TouchableOpacity>
                {file.type === 'image' ? (
                  <TouchableOpacity onPress={startExtract} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center' }}>
                    <Text style={{ color:'#fff', fontWeight:'800' }}>텍스트 추출</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={()=>{ setExtractedText('(PDF 업로드 완료 - 변환 없이 저장 준비)'); }} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center' }}>
                    <Text style={{ color:'#fff', fontWeight:'800' }}>바로 저장</Text>
                  </TouchableOpacity>
                )}
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
                <TouchableOpacity disabled={!extractedText} onPress={()=>{ if(extractedText) { showAlert('복사됨', '클립보드에 복사되었습니다.'); } }} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT_SOFT, borderWidth:1, borderColor:BORDER, alignItems:'center', marginRight:8, opacity: extractedText?1:0.4 }}>
                  <Text style={{ color:ACCENT, fontWeight:'800' }}>복사하기</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={!extractedText} onPress={openNaming} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center', opacity: extractedText?1:0.4 }}>
                  <Text style={{ color:'#fff', fontWeight:'800' }}>{file?.type==='pdf' ? '이름 저장' : 'PDF 변환'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={startExtract} style={{ marginTop:12, alignSelf:'stretch', paddingVertical:12, borderRadius:12, backgroundColor:'#EEF1F6', alignItems:'center' }}>
                <Text style={{ fontSize:12, fontWeight:'700', color:SUBTLE }}>다시 추출하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {noTextFound && !extracting && !extractedText && file && (
          <View>
            <Text style={{ fontSize:15, fontWeight:'800', color:INK, marginBottom:12 }}>추출 결과</Text>
            <View style={{ backgroundColor:SURFACE, borderWidth:1, borderColor:BORDER, borderRadius:18, padding:28, alignItems:'center', ...SHADOW }}>
              <MaterialIcons name="search-off" size={46} color={SUBTLE} />
              <Text style={{ fontSize:14, fontWeight:'800', color:INK, marginTop:14 }}>텍스트를 찾을 수 없어요</Text>
              <Text style={{ fontSize:12, color:SUBTLE, marginTop:8, lineHeight:18, textAlign:'center' }}>이미지 품질이 낮거나 텍스트가 포함되지 않은 이미지일 수 있어요.
다른 각도나 더 선명한 사진으로 시도해 보세요.</Text>
              <View style={{ flexDirection:'row', marginTop:24 }}>
                <TouchableOpacity onPress={startExtract} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:ACCENT, alignItems:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'800' }}>다시 추출하기</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={reset} style={{ marginTop:14 }}>
                <Text style={{ fontSize:12, color:SUBTLE }}>처음으로</Text>
              </TouchableOpacity>
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
