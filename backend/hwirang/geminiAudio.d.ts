export interface AudioResponse {
  text: string;
  audio?: string;
  audioUrl?: string;
  audioData?: string;
  audioMimeType?: string;
  error: boolean;
}

export interface ReportData {
  reflection: string;
  feedback: string;
}

export declare function audioToBase64(audioUri: string): Promise<string>;

export declare function sendAudioMessage(
  audioUri: string,
  conversationContext: 'goal-setting' | 'daily-report' | 'weekly-report',
  step: string,
  textInput?: string
): Promise<AudioResponse>;

export declare function sendAudioMessageWithVoice(
  audioUri: string,
  conversationContext: 'goal-setting' | 'daily-report' | 'weekly-report',
  step: string,
  textInput?: string,
  requestAudio?: boolean
): Promise<AudioResponse>;

export declare function generateWebSpeech(text: string, lang?: string): Promise<void>;
export declare function stopWebSpeech(): void;

export declare function generateNativeTTS(text: string, voiceName?: string): Promise<string | null>;
export declare function generateSpeechFromText(text: string, voiceName?: string): Promise<string | null>;