declare module 'react-native-document-picker' {
  import * as React from 'react';
  export interface DocumentPickerResponse {
    uri: string;
    name?: string | null;
    type?: string | null;
    size?: number | null;
    fileCopyUri?: string | null;
  }
  export interface PickOptions {
    type?: string[] | string;
    allowMultiSelection?: boolean;
    copyTo?: 'cachesDirectory' | 'documentDirectory';
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen' | 'overCurrentContext' | 'popover' | 'none';
  }
  export interface PickSingleOptions extends PickOptions {}
  const DocumentPicker: {
    pick: (options: PickOptions) => Promise<DocumentPickerResponse[]>;
    pickSingle: (options: PickSingleOptions) => Promise<DocumentPickerResponse>;
    isCancel: (err: unknown) => boolean;
    types: {
      images: string;
      pdf: string;
      allFiles: string;
    };
  };
  export default DocumentPicker;
}
