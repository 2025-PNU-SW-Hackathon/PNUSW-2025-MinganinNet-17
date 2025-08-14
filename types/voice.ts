export type VoiceChatState = 'idle' | 'connecting' | 'listening' | 'processing' | 'streaming' | 'speaking' | 'error';

export interface VoiceVisualizerProps {
  state: VoiceChatState;
  amplitude?: number;
}

export interface VoiceChatControlsProps {
  onPause: () => void;
  onResume: () => void;
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
    subtitle: '화면을 탭해서 대화를 시작하세요',
    showMicIcon: true,
    allowInterrupt: false,
  },
  connecting: {
    title: '연결 중...',
    subtitle: 'AI 코치와 연결하고 있어요',
    showMicIcon: false,
    allowInterrupt: false,
  },
  listening: {
    title: '듣고 있어요...',
    subtitle: '말씀을 마치고 화면을 탭하세요',
    showMicIcon: true,
    allowInterrupt: true,
  },
  processing: {
    title: '생각하고 있어요...',
    subtitle: 'AI가 답변을 준비하고 있습니다',
    showMicIcon: false,
    allowInterrupt: true,
  },
  streaming: {
    title: '답변을 생성하고 있어요...',
    subtitle: '',
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