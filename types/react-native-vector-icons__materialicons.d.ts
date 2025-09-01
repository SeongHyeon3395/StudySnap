declare module 'react-native-vector-icons/MaterialIcons' {
  import { Icon } from 'react-native-vector-icons/Icon';
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
