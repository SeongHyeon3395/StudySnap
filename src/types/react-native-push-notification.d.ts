declare module 'react-native-push-notification' {
  interface ChannelObject {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: number;
    vibrate?: boolean;
  }
  interface LocalNotificationSchedule {
    channelId?: string;
    message: string;
    date: Date;
    allowWhileIdle?: boolean;
    id?: string | number;
    repeatType?: 'day' | 'week' | 'hour' | 'minute';
    repeatTime?: number;
  }
  interface PushNotificationObject {
    message: string;
    channelId?: string;
    id?: string | number;
  }
  type ChannelCallback = (created: boolean) => void;
  class PushNotificationClass {
    static createChannel(channel: ChannelObject, cb: ChannelCallback): void;
    static localNotificationSchedule(obj: LocalNotificationSchedule): void;
    static cancelLocalNotifications(details: { id: string | number }): void;
    static requestPermissions(): Promise<boolean>;
  }
  const PushNotification: typeof PushNotificationClass;
  export default PushNotification;
}
