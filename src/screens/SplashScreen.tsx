import React, { useEffect, useMemo, useRef } from 'react';
import { SafeAreaView, View, Text, StatusBar, Platform, Animated } from 'react-native';
import { Easing } from 'react-native';

type Props = { navigation: any };

export default function SplashScreen({ navigation }: Props) {
  // THEME
  const BG = '#FFFFFF';      // 스플래시는 흰 배경
  const ACCENT = '#FF8A00';  // 기존 포인트 오렌지
  const INK = '#0B1220';     // 진한 네이비 텍스트

  const phrase = '찍고 공부하자';
  const chars = useMemo(() => phrase.split(''), []); // ['찍','고',' ','공','부','하','자']

  // 각 글자용 애니메이션 값
  const opacities = useRef(chars.map(() => new Animated.Value(0))).current;
  const translateYs = useRef(chars.map(() => new Animated.Value(8))).current;

  // 하단 브랜드("찍공") 애니메이션 값
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(6)).current;

  // 로딩 점 애니메이션 값 ( . . . )
  const dotValues = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  const startDotLoop = () => {
    dotValues.forEach((val, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 180),
          Animated.timing(val, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(180 * (dotValues.length - idx)),
        ])
      ).start();
    });
  };

  useEffect(() => {
    // 글자 하나씩 순차 등장
    const perChar = chars.map((_, i) =>
      Animated.parallel([
        Animated.timing(opacities[i], {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateYs[i], {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    let timer: ReturnType<typeof setTimeout> | null = null;

    Animated.stagger(80, perChar).start(() => {
      // "찍공" 페이드 인
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 로딩 점 애니메이션 시작
        startDotLoop();
        // 1.5초 뒤 로그인 화면으로 이동 (뒤로가기 못 돌아오게 replace)
        timer = setTimeout(() => navigation.replace('Login'), 1500);
      });
    });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [chars, navigation, opacities, translateYs, brandOpacity, brandTranslateY]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
        }}
      >
        {/* 상단: "찍고 공부하자" (한 글자씩) */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
  {chars.map((ch, idx) =>
            ch === ' ' ? (
              <View key={`sp-${idx}`} style={{ width: 12 }} />
            ) : (
              <Animated.Text
                key={`ch-${idx}`}
                style={{
                  fontSize: 25,
                  fontWeight: '900', // 더 두껍게
                  color: INK,
                  transform: [{ translateY: translateYs[idx] }],
                  opacity: opacities[idx],
                  marginRight: 2,
                }}
              >
                {ch}
              </Animated.Text>
            )
          )}
        </View>

        {/* 하단: "찍공" (페이드 인) */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Animated.Text
            style={{
              fontSize: 28,
              color: ACCENT,
              fontWeight: '900',
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            }}
          >
            찍공
          </Animated.Text>
          {/* 로딩 점 */}
          <View style={{ flexDirection: 'row', marginTop: 6, height: 14 }}>
            {dotValues.map((v, i) => (
              <Animated.Text
                key={`dot-${i}`}
                style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: ACCENT,
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }),
                  marginHorizontal: 3,
                  transform: [
                    {
                      translateY: v.interpolate({ inputRange: [0, 1], outputRange: [2, -1] }),
                    },
                  ],
                }}
              >
                ·
              </Animated.Text>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
