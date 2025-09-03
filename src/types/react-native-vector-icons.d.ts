// 통합 아이콘 타입 선언 (필요 최소 구성)
declare module 'react-native-vector-icons/Icon' {
  import { Component } from 'react';
  import { TextStyle } from 'react-native';
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | TextStyle[];
  }
  export class Icon extends Component<IconProps> {}
  export default Icon;
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  import { TextStyle } from 'react-native';
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | TextStyle[];
  }
  export default class MaterialIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextStyle } from 'react-native';
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | TextStyle[];
  }
  export default class MaterialCommunityIcons extends Component<IconProps> {}
}
