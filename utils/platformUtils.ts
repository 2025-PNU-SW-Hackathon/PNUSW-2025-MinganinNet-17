import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * 웹 환경에서 지원되지 않는 기능들을 체크하는 유틸리티
 */
export const PlatformSupport = {
  // 오디오 녹음 지원 여부
  audioRecording: !isWeb,
  
  // 파일 시스템 접근 지원 여부
  fileSystem: !isWeb,
  
  // 알림 지원 여부
  notifications: !isWeb,
  
  // 네이티브 애니메이션 지원 여부
  nativeAnimation: !isWeb,
  
  // 음성 인식 지원 여부 (웹은 Web Speech API 사용 가능)
  speechRecognition: true,
  
  // TTS 지원 여부
  textToSpeech: true,
};

/**
 * 웹 환경에서 Web Speech API를 사용한 음성 인식
 */
export class WebSpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private lastInterimTime: number = 0;
  private interimDebounceDelay: number = 50; // 50ms debounce for faster response
  
  constructor() {
    if (isWeb) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ko-KR';
        this.recognition.maxAlternatives = 1;
        
        // 성능 최적화 설정
        this.recognition.serviceURI = ''; // 기본 서비스 사용
        
        // 음성 인식 시간 연장 설정 (말이 끝날 때까지 기다리기)
        if ('speechTimeout' in this.recognition) {
          (this.recognition as any).speechTimeout = 10000; // 10초
        }
        if ('speechTimeoutBuffer' in this.recognition) {
          (this.recognition as any).speechTimeoutBuffer = 5000; // 5초
        }
        
        // 더 관대한 무음 감지 설정
        if ('grammars' in this.recognition) {
          // 무음 감지를 더 관대하게 설정
        }
      }
    }
  }
  
  isSupported(): boolean {
    return isWeb && this.recognition !== null;
  }
  
  start(
    onInterimResult: (text: string) => void,
    onFinalResult: (text: string) => void,
    onError: (error: string) => void
  ) {
    if (!this.isSupported() || this.isListening) {
      return;
    }
    
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Immediate final result processing (no debounce)
      if (finalTranscript) {
        onFinalResult(finalTranscript);
        return; // Exit early for final results
      }
      
      // Debounced interim results for better performance
      if (interimTranscript) {
        const now = Date.now();
        if (now - this.lastInterimTime >= this.interimDebounceDelay) {
          this.lastInterimTime = now;
          onInterimResult(interimTranscript);
        }
      }
    };
    
    this.recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        console.log('음성 인식이 사용자에 의해 중단되었습니다.');
        this.isListening = false;
        return; // aborted는 정상적인 중단이므로 오류로 처리하지 않음
      }
      onError(`음성 인식 오류: ${event.error}`);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      onError('음성 인식을 시작할 수 없습니다.');
    }
  }
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.abort(); // stop() 대신 abort() 사용하여 즉시 중단
      this.isListening = false;
    }
  }
  
  forceStop() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }
  
  getIsListening(): boolean {
    return this.isListening;
  }
}

/**
 * 웹 환경에서 Web Speech API를 사용한 TTS
 */
export class WebTextToSpeech {
  speak(text: string, lang: string = 'ko-KR'): void {
    if (!isWeb || !('speechSynthesis' in window)) {
      console.warn('TTS not supported on this platform');
      return;
    }
    
    // 이전 음성 중지
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  }
  
  stop(): void {
    if (isWeb && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
  
  isSupported(): boolean {
    return isWeb && 'speechSynthesis' in window;
  }
}