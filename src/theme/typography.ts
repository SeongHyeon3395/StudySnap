// 공통 타이포그래피 설정
// 실제 폰트 파일명을 추가한 후 내부 PostScript 이름으로 교체하세요.
// 예: PretendardRounded-Bold.ttf 추가 후 이름이 'PretendardRounded-Bold' 라면 ROUNDED_BOLD 값을 그대로 사용.
export const Fonts = {
  ROUNDED_BOLD: 'RoundedBold', // TODO: 실제 설치된 폰트 내부 이름으로 교체
  ROUNDED_REGULAR: 'RoundedRegular',
};

export const fontRoundedBold = { fontFamily: Fonts.ROUNDED_BOLD } as const;
export const fontRoundedRegular = { fontFamily: Fonts.ROUNDED_REGULAR } as const;
