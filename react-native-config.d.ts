declare module 'react-native-config' {
  interface EnvConfig {
    GEMINI_API_KEY?: string;
  }
  const Config: EnvConfig;
  export default Config;
}
