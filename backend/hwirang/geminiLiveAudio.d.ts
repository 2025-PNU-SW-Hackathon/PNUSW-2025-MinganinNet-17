/**
 * Gemini Live API TypeScript 타입 정의
 */

export interface LiveAudioResponse {
  audioData: string;
  text: string;
  mimeType: string;
  source: string;
}

export interface LiveSessionConfig {
  responseModalities: string[];
  systemInstruction: string;
  speechConfig?: {
    voiceConfig?: {
      prebuiltVoiceConfig?: {
        voiceName: string;
      };
    };
  };
}

export interface AudioInput {
  data: string;
  mimeType: string;
}

export interface RealtimeInput {
  audio?: AudioInput;
}

export class GeminiLiveSession {
  constructor();
  connect(systemInstruction?: string): Promise<any>;
  sendAudio(audioData: string, mimeType?: string): Promise<void>;
  sendText(text: string): Promise<void>;
  waitForResponse(): Promise<LiveAudioResponse>;
  disconnect(): Promise<void>;
  processMessage(message: any): void;
}

export function generateNativeAudio(
  text: string, 
  systemInstruction?: string
): Promise<LiveAudioResponse>;

export function processAudioToAudio(
  audioData: string, 
  systemInstruction?: string, 
  audioMimeType?: string
): Promise<LiveAudioResponse>;

export function startOrGetConversationSession(systemInstruction?: string): Promise<GeminiLiveSession>;

export function endConversationSession(): Promise<void>;

declare const _default: {
  GeminiLiveSession: typeof GeminiLiveSession;
  generateNativeAudio: typeof generateNativeAudio;
  processAudioToAudio: typeof processAudioToAudio;
  startOrGetConversationSession: typeof startOrGetConversationSession;
  endConversationSession: typeof endConversationSession;
};

export default _default;