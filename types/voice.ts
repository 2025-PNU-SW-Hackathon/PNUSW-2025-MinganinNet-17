export type VoiceChatState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceVisualizerProps {
  state: VoiceChatState;
  amplitude?: number;
}

export interface VoiceChatControlsProps {
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
  isPaused: boolean;
  disabled?: boolean;
}

export interface VoiceChatScreenProps {
  visible: boolean;
  onClose: () => void;
  onVoiceInput?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface VoiceStateConfig {
  title: string;
  subtitle: string;
  showMicIcon: boolean;
  allowInterrupt: boolean;
}

export const VOICE_STATE_CONFIG: Record<VoiceChatState, VoiceStateConfig> = {
  idle: {
    title: '음성 채팅',
    subtitle: '탭해서 말하기 시작',
    showMicIcon: true,
    allowInterrupt: false,
  },
  listening: {
    title: '듣고 있어요...',
    subtitle: '말씀해 주세요',
    showMicIcon: true,
    allowInterrupt: true,
  },
  processing: {
    title: '생각하고 있어요...',
    subtitle: '탭해서 취소',
    showMicIcon: false,
    allowInterrupt: true,
  },
  speaking: {
    title: '말하고 있어요...',
    subtitle: '탭해서 중단',
    showMicIcon: false,
    allowInterrupt: true,
  },
  error: {
    title: '오류',
    subtitle: '탭해서 다시 시도',
    showMicIcon: true,
    allowInterrupt: false,
  },
};