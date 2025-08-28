import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  AppState,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import VoiceVisualizer from './VoiceVisualizer';
import VoiceChatControls from './VoiceChatControls';
import { VoiceChatState, VOICE_STATE_CONFIG } from '../types/voice';
import { useHabitStore } from '../lib/habitStore';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import { koreanTextStyle } from '../utils/koreanUtils';
import { useIsDebugMode } from '../src/config/debug';
// import { processVoiceWithPolling } from '../services/supabaseVoiceService'; // 기존 폴링 방식 제거

// Supabase 클라이언트 import 추가
import { supabase } from '../backend/supabase/client';

// --- Props and other interfaces remain the same ---
export interface VoiceChatScreenProps {
  visible: boolean;
  mode: 'goalSetting' | 'home' | 'report';
  onClose: () => void;
  onComplete: (data: any) => void;
  onError?: (error: string) => void;
  onSwitchToText?: () => void;
  enableStepProgression?: boolean;
  isNewGoal?: boolean; // 새로운 목표 추가 여부
}

interface GoalSettingStepData {
  habitName?: string;
  goalPeriod?: string;
  availableTime?: string;
  difficultyReason?: string;
  restrictedApps?: string;
  persona?: 'Easy' | 'Medium' | 'Hard';
}

const STEP_TITLES: Record<number, string> = {
    1: '당신이 이루고 싶은 목표는 무엇인가요?',
    2: '목표를 언제까지 달성하고 싶으신가요?',
    3: '언제 시간을 내서 실천하고 싶으신가요?',
    4: '이 습관을 형성하는 데 어려운 점이 있나요?',
    5: '어떤 앱을 제한하고 싶으신가요?',
    6: '어떤 코칭 스타일을 원하시나요?'
};

const getSystemInstructionForMode = (mode: VoiceChatScreenProps['mode'], currentStep?: number): string => {
    // This function seems complex but correct, so we'll keep it as is.
    const basePrompt = `You are '루티' (Routy), a friendly Korean habit coach.\n\nRULES: Korean only, ALWAYS speak numbers in Korean (삼개월, 백만원, 여섯시, 일곱시, 여덟시), NEVER use English numbers, summarize as "~~가 목표시군요", one question at a time, handle interruptions, 2-3 sentences max.\n\nCRITICAL: When speaking, use Korean numbers: 삼개월, 백만원, 여섯시, 일곱시, 여덟시, 아홉시, 열시, 열한시, 열두시\n\nEMOTION: ALWAYS use "와!", "오!", "화이팅!", "음...", "아..." and "!", "?"\n\nCRITICAL: NEVER create routines, plans, or projects. Your ONLY job is to collect information.`;
    // ... (rest of the function is omitted for brevity but should be kept)
    return basePrompt;
};

const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({
  visible,
  mode,
  onClose,
  onComplete,
  onError,
  onSwitchToText,
  enableStepProgression = true,
  isNewGoal = false, // 새로운 목표 추가 여부
}) => {
  const [currentState, setCurrentState] = useState<VoiceChatState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState(''); // AI 응답 텍스트 별도 저장
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // --- Recording & Playback State ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const fullResponseTextRef = useRef('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { addMessageToHistory, conversationHistory } = useHabitStore();

  // --- Debug Mode State ---
  const isDebugMode = useIsDebugMode();

  // --- Goal Setting State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [progressValue, setProgressValue] = useState(0);
  const shouldEnableStepProgression = mode === 'goalSetting' && enableStepProgression;

  // --- Session Management for Context Persistence ---
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [conversationMemory, setConversationMemory] = useState<string>(''); // 대화 기억 추가

  // --- Animations ---
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const textFadeAnim = useSharedValue(0);
  
  // Animation values for UI components
  const visualizerFadeAnim = useSharedValue(1);
  const buttonsFadeAnim = useSharedValue(1);

  // 세션 초기화 함수
  const initializeSession = useCallback(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setSessionStartTime(new Date());
    
    // 새로운 목표 추가인 경우 대화 기록 초기화
    if (isNewGoal) {
      useHabitStore.getState().clearConversationHistory();
      setConversationMemory('');
      console.log('[음성채팅] 새로운 목표 추가 모드 - 대화 기록 초기화');
    } else {
      // 기존 대화 기록 유지
      const store = useHabitStore.getState();
      const history = store.conversationHistory;
      if (history.length > 0) {
        const recentMessages = history.slice(-10).map(msg => `${msg.role}: ${msg.text}`).join('\n');
        setConversationMemory(recentMessages);
        console.log('[음성채팅] 기존 대화 기록 로드:', recentMessages.length, '자');
      } else {
        console.log('[음성채팅] 기존 대화 기록 없음');
      }
    }
    
    console.log('[음성채팅] 새로운 세션 시작:', newSessionId, '새로운 목표:', isNewGoal);
  }, [isNewGoal]);

  // 세션 정리 함수
  const cleanupSession = useCallback(() => {
    setSessionId(null);
    setSessionStartTime(null);
    // 대화 기록도 정리 (새로운 세션을 위해)
    useHabitStore.getState().clearConversationHistory();
    console.log('[음성채팅] 세션 정리 완료');
  }, []);

  // 컴포넌트가 마운트되거나 mode가 변경될 때 세션 초기화
  useEffect(() => {
    if (visible && mode) {
      // 이전 세션 정리 후 새로운 세션 시작
      cleanupSession();
      
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState.match(/inactive|background/) && visible) {
          // AppState 변경 시에도 세션 유지 (대화가 끝날 때까지)
          // endSession().then(() => onClose());
          onClose();
        }
      });
      return () => subscription.remove();
    }
  }, [visible, mode, onClose]);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
      textFadeAnim.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
      
      
      startSession();
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
      textFadeAnim.value = withTiming(0, { duration: 200 });
      
      
      // 세션을 즉시 종료하지 않고 유지 (대화가 끝날 때까지)
      // endSession();
    }
  }, [visible]);

  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (recordingRef.current) await stopRecording();
    setLiveTranscript(''); // 이전 기록 초기화
    try {
        if (Platform.OS === 'web') {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            userMediaStream.current = stream;
            
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            recordingRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            recorder.start(250);
        } else {
            await Audio.requestPermissionsAsync();
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            recordingRef.current = recording;
            await recordingRef.current.startAsync();
        }
        setCurrentState('listening');
    } catch (err) {
      console.error('[음성채팅] 녹음 시작 실패', err);
      setCurrentState('error');
    }
  };

  const resampleBuffer = (audioBuffer: AudioBuffer, targetSampleRate: number): Int16Array => {
    const sourceSampleRate = audioBuffer.sampleRate;
    const sourceData = audioBuffer.getChannelData(0);
    if (sourceSampleRate === targetSampleRate) {
        const pcmData = new Int16Array(sourceData.length);
        for (let i = 0; i < sourceData.length; i++) {
            let val = Math.max(-1, Math.min(1, sourceData[i]));
            pcmData[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
        }
        return pcmData;
    }

    const sourceLength = sourceData.length;
    const targetLength = Math.round(sourceLength * (targetSampleRate / sourceSampleRate));
    const resampledData = new Int16Array(targetLength);
    
    for (let i = 0; i < targetLength; i++) {
        const srcIndex = (i / targetLength) * sourceLength;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.ceil(srcIndex);
        const weight = srcIndex - srcIndexFloor;

        const sample1 = sourceData[srcIndexFloor] || 0;
        const sample2 = sourceData[srcIndexCeil] || 0;
        
        const interpolatedSample = sample1 + (sample2 - sample1) * weight;
        
        let pcmSample = Math.max(-1, Math.min(1, interpolatedSample));
        pcmSample = pcmSample < 0 ? pcmSample * 0x8000 : pcmSample * 0x7FFF;
        resampledData[i] = pcmSample;
    }
    return resampledData;
  }

  const stopRecordingAndSend = async () => {
    if (!recordingRef.current) return;
    
    setCurrentState('processing');
    
    try {
      let base64Audio = '';
      let mimeType = 'audio/pcm;rate=16000';

      if (Platform.OS === 'web') {
        if (recordingRef.current.state === 'recording') {
          recordingRef.current.stop();
        }
        if (audioChunksRef.current.length === 0) {
          console.warn('[음성채팅] 녹음된 오디오 데이터가 없습니다.');
          setCurrentState('idle');
          return;
        }
        
        // 너무 짧은 음성 체크 (최소 0.5초)
        const totalDuration = audioChunksRef.current.length * 0.25; // 250ms chunks
        if (totalDuration < 0.5) {
          console.warn('[음성채팅] 음성이 너무 짧습니다. 다시 말해주세요.');
          setCurrentState('idle');
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const pcmData = resampleBuffer(audioBuffer, 16000);
        
        let binary = '';
        const bytes = new Uint8Array(pcmData.buffer);
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        base64Audio = btoa(binary);

      } else {
        const recording = recordingRef.current;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (!uri) throw new Error('녹음 URI를 찾을 수 없습니다.');
        
        // 모바일에서도 최소 녹음 시간 체크
        const recordingDuration = recording.getStatusAsync ? await recording.getStatusAsync() : null;
        if (recordingDuration && recordingDuration.durationMillis < 500) {
          console.warn('[음성채팅] 음성이 너무 짧습니다. 다시 말해주세요.');
          setCurrentState('idle');
          return;
        }
        
        base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      }
      
      recordingRef.current = null;

      if (sessionRef.current && base64Audio) {
        await sessionRef.current.sendAudio(base64Audio, mimeType);
        
        const response = await sessionRef.current.waitForResponse();
        
        // 응답 디버깅 로그
        console.log('[음성채팅] AI 응답 받음:', {
          hasResponse: !!response,
          hasText: !!response?.text,
          hasUserInput: !!response?.userInput,
          userInput: response?.userInput,
          text: response?.text,
          textLength: response?.text?.length
        });
        
        // 응답 유효성 검사
        if (!response || !response.text || response.text.trim().length === 0) {
          console.warn('[음성채팅] AI 응답이 비어있습니다. 다시 시도해주세요.');
          setCurrentState('idle');
          return;
        }
        
        // 너무 짧은 응답 체크 (최소 3글자)
        if (response.text.trim().length < 3) {
          console.warn('[음성채팅] AI 응답이 너무 짧습니다. 다시 시도해주세요.');
          setCurrentState('idle');
          return;
        }
        
        // Add messages to the global store
        if ((response as any).userInput && (response as any).userInput.trim().length > 0) {
          addMessageToHistory({ role: 'user', text: (response as any).userInput });
        } else {
          // userInput이 비어있으면 사용자가 말한 내용을 추정하여 추가
          console.log('[음성채팅] userInput이 비어있음, 사용자 입력 추정');
          addMessageToHistory({ role: 'user', text: '사용자 음성 입력' });
        }
        
        // AI 응답에서 구조화된 부분 제거하고 사용자에게는 자연스러운 대화만 보여주기
        let displayText = response.text;
        if (response.text.includes('목표:') && response.text.includes('기간:') && response.text.includes('시간:')) {
          // 구조화된 부분을 제거하고 자연어 부분만 남기기
          const naturalPart = response.text.split('목표:')[0].trim();
          if (naturalPart) {
            displayText = naturalPart;
            console.log('[음성채팅] 구조화된 부분 제거됨, 자연어 부분만 표시:', displayText);
          }
        }
        
        // Start typewriter animation instead of immediately adding to history
        console.log('[음성채팅] 타이프라이터 애니메이션 시작:', displayText);
        startTypewriterAnimation(displayText);

        // 실시간 단계 감지 (모든 AI 응답에서 실행)
        processResponseForStepDetection(response.text);

        // 중간 응답에서는 정보 추출하지 않음 - 최종 정리 단계에서만 추출
        if (response.text.includes('정리해볼게요') || response.text.includes('맞나요?')) {
          console.log('[음성채팅] 최종 정리 단계 감지 - 정보 추출 진행');
          const updatedGoalData = extractFinalGoalInfo(response.text);
          console.log('[음성채팅] 최종 목표 데이터 추출 완료:', updatedGoalData);
        } else {
          console.log('[음성채팅] 중간 응답 - 정보 추출 건너뜀');
        }

        // 메시지 카운터 증가
        // messageCountRef.current += 1; // 이 부분은 제거되었으므로 주석 처리

        // 3번째 응답 후 성능 최적화 (대화 맥락 유지)
        // if (messageCountRef.current >= 3) { // 이 부분은 제거되었으므로 주석 처리
        //   console.log('[음성채팅] 3번째 응답 완료, 성능 최적화 시작');
        //   setTimeout(() => {
        //     optimizePerformance();
        //   }, 1000); // 1초 후 최적화
        // }

        setLiveTranscript('');

        // AI 음성 응답 재생
        if (response.audioData) {
          console.log('[음성채팅] AI 음성 응답 재생 시작 (타이핑 애니메이션과 동시)');
          await playAudio(response.audioData, response.mimeType, response.text);
        } else {
          console.log('[음성채팅] AI 음성 응답 데이터 없음, 타이핑 애니메이션만 표시');
          // 음성이 없어도 대화 완료 감지
          if (mode === 'goalSetting' && isConversationComplete(response.text)) {
            console.log('[음성채팅] AI 음성 없음, 대화 완료 감지됨! 골 스텝 5로 이동합니다.');
            await handleConversationComplete();
          }
          setCurrentState('idle');
        }

        // 대화 완료 감지는 음성 재생이 끝난 후에만 실행
        // playAudio 함수에서 재생 완료 시 콜백으로 처리
      } else {
        setCurrentState('idle');
      }
    } catch (error) {
      console.error('[음성채팅] 발화 처리 실패:', error);
      setCurrentState('error');
      
      // 에러 발생 시 상태 복구
      setTimeout(() => {
        initializeSession();
      }, 100);
    }
    return () => {
      if (!visible) {
        cleanupSession();
      }
    };
  }, [visible, mode, initializeSession, cleanupSession]);

  // --- 새로운 비동기 작업 처리 함수 ---
  const processVoiceWithNewAsyncMethod = useCallback(async (base64Audio: string) => {
    try {
      console.log('[음성채팅] 새로운 비동기 방식으로 음성 처리 시작...');
      console.log('[음성채팅] 오디오 데이터 길이:', base64Audio.length);
      console.log('[음성채팅] 현재 대화 기억:', conversationMemory.length, '자');
      console.log('[음성채팅] 새로운 목표 모드:', isNewGoal);
      
      // Supabase 클라이언트 상태 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[음성채팅] 인증 상태:', { 
        user: user?.id ? '인증됨' : '인증 안됨', 
        userId: user?.id,
        authError: authError?.message 
      });
      
      // 1. 함수 호출 (빠른 응답)
      console.log('[음성채팅] ai-voice-chat 함수 호출 시작...');
      // 사용자 목표 정보 가져오기
      let userGoals = null;
      try {
        const { data: goals, error: goalsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user?.id);
        
        if (goalsError) {
          console.error('[음성채팅] 목표 조회 오류:', goalsError);
        } else {
          userGoals = goals;
          console.log('[음성채팅] 사용자 목표 조회 완료:', userGoals?.length || 0, '개');
        }
      } catch (error) {
        console.error('[음성채팅] 목표 조회 중 오류:', error);
      }
      
      // 화면별 맥락 정보 전달 (목표 정보 포함)
      const context = {
        screen: mode === 'home' ? 'home' : mode, // 'goalSetting', 'home', 'report'
        currentStep: mode === 'goalSetting' ? currentStep : (shouldEnableStepProgression ? currentStep : undefined),
        hasGoal: mode === 'home', // home 화면에서는 목표가 있다고 가정
        isDebugMode: isDebugMode, // 디버그 모드 상태 추가
        userGoals: (mode === 'goalSetting' || isNewGoal) ? [] : userGoals, // 새로운 목표 추가 모드일 때는 기존 목표 정보 완전 무시
        sessionId: sessionId, // 세션 ID 추가
        sessionStartTime: sessionStartTime, // 세션 시작 시간 추가
        isNewGoal: isNewGoal, // 새로운 목표 추가 여부
        conversationMemory: conversationMemory // 대화 기억 추가
      };

      console.log('[음성채팅] 전송할 컨텍스트:', {
        screen: context.screen,
        currentStep: context.currentStep,
        isNewGoal: context.isNewGoal,
        userGoalsLength: context.userGoals?.length || 0,
        conversationMemoryLength: context.conversationMemory?.length || 0
      });

      const { data, error } = await supabase.functions.invoke('ai-voice-chat', {
        body: { 
          audio: base64Audio,
          context: context
        },
      });

      if (error) {
        console.error('[음성채팅] 함수 호출 실패:', error);
        console.error('[음성채팅] 에러 상세 정보:', {
          name: error.name,
          message: error.message,
          status: error.status,
          details: error.details
        });
        throw new Error(`음성 처리 실패: ${error.message}`);
      }

      // 2. 함수로부터 '진동벨(jobId)'과 텍스트 결과를 즉시 받음
      const { jobId, userText, responseText, goalSettingComplete, nextScreen, collectedGoalInfo } = data;
      console.log('[음성채팅] 작업 ID 받음:', jobId);
      
      // 목표 설정 완료 체크
      if (goalSettingComplete && mode === 'goalSetting') {
        console.log('[음성채팅] 🎯 목표 설정 완료됨! onComplete 콜백 호출');
        console.log('[음성채팅] 🎯 완료 데이터:', {
          goalSettingComplete,
          nextScreen,
          collectedGoalInfo,
          userText,
          responseText
        });
        
        // 즉시 onComplete 콜백 호출
        if (onComplete) {
          onComplete({
            goalSettingComplete: true,
            nextScreen: nextScreen || 'goalSettingStep5',
            collectedGoalInfo: collectedGoalInfo || {},
            userText: userText,
            responseText: responseText
          });
        }
        
        // 상태 초기화
        setCurrentState('idle');
        setDisplayedText('');
        setAiResponseText('');
        return; // 더 이상 진행하지 않음
      }
      
      // 3. 사용자 텍스트와 AI 응답을 즉시 UI에 표시
      addMessageToHistory({ role: 'user', text: userText });
      setAiResponseText(responseText); // AI 응답 텍스트 저장 (화면에는 아직 표시 안함)
      fullResponseTextRef.current = responseText;
      
      // 대화 기억 업데이트 (새로운 정보 추가)
      const newMemory = `${conversationMemory}\n사용자: ${userText}\nAI: ${responseText}`.trim();
      setConversationMemory(newMemory);
      console.log('[음성채팅] 대화 기억 업데이트:', newMemory.length, '자');
      
      // 화면에는 "생각중이에요" 상태 유지
      
      // 4. 즉시 ai-voice-finish 함수 호출 (트리거 대신)
      console.log('[음성채팅] ai-voice-finish 함수 직접 호출 시작...');
      try {
        const finishResult = await supabase.functions.invoke('ai-voice-finish', {
          body: { 
            record: {
              job_id: jobId,
              response_text: responseText
            },
            context: {
              isDebugMode: isDebugMode
            }
          }
        });
        
        if (finishResult.error) {
          console.error('[음성채팅] ai-voice-finish 호출 실패:', finishResult.error);
          throw new Error(`음성 생성 실패: ${finishResult.error.message}`);
        }
        
        console.log('[음성채팅] ai-voice-finish 호출 성공:', finishResult.data);
        
        // 5. 디버그 모드에 따른 처리 분기
        if (isDebugMode) {
          // 디버그 모드: DB 폴링 건너뛰기, 실제 오디오 데이터로 음성 재생
          console.log('[음성채팅] 디버그 모드 - DB 폴링 건너뛰기, 실제 오디오 데이터로 음성 재생');
          
          // ai-voice-finish 응답에서 오디오 데이터 확인
          console.log('[음성채팅] 디버그 모드 - 응답 데이터 상세 분석:', {
            hasData: !!finishResult.data,
            hasAudioData: !!finishResult.data?.audioData,
            audioDataLength: finishResult.data?.audioData?.length || 0,
            mimeType: finishResult.data?.mimeType,
            isDebugMode: finishResult.data?.isDebugMode,
            rawDataType: typeof finishResult.data, // 데이터 타입 확인
            // Base64 데이터는 너무 길어서 로그에서 제거
          });

          // 응답 데이터가 문자열인 경우 파싱 시도
          let parsedData = finishResult.data;
          if (typeof finishResult.data === 'string') {
            try {
              parsedData = JSON.parse(finishResult.data);
              console.log('[음성채팅] 디버그 모드 - 문자열 파싱 완료:', parsedData);
            } catch (parseError) {
              console.error('[음성채팅] 디버그 모드 - 문자열 파싱 실패:', parseError);
            }
          }

          // audioData가 직접 있거나 data 속성 안에 있을 수 있음
          const audioData = parsedData?.audioData || parsedData?.data?.audioData;
          const mimeType = parsedData?.mimeType || parsedData?.data?.mimeType;

          if (audioData) {
            console.log('[음성채팅] 디버그 모드 - 오디오 데이터 받음, 음성 재생 시작');

            try {
              console.log('[음성채팅] 디버그 모드 - Base64 디코딩 시작');

              // Base64 문자열 패딩 확인 및 수정
              let paddedAudioData = audioData;
              while (paddedAudioData.length % 4 !== 0) {
                paddedAudioData += '=';
              }
              console.log('[음성채팅] 디버그 모드 - Base64 패딩 완료, 길이:', paddedAudioData.length);

              // Base64 오디오 데이터를 Uint8Array로 변환
              const decodedData = atob(paddedAudioData);
              console.log('[음성채팅] 디버그 모드 - Base64 디코딩 완료, 길이:', decodedData.length);

              const uint8Array = Uint8Array.from(decodedData, c => c.charCodeAt(0));
              console.log('[음성채팅] 디버그 모드 - Uint8Array 생성 완료, 길이:', uint8Array.length);

              // 음성 재생이 실제로 시작될 때만 상태 변경
              console.log('[음성채팅] 디버그 모드 - 음성 재생 시작, 상태 변경');
              setCurrentState('speaking');
              setDisplayedText(aiResponseText);

              // Base64 데이터를 직접 data URI로 사용하여 음성 재생
              const dataUri = `data:audio/wav;base64,${audioData}`;
              console.log('[음성채팅] 디버그 모드 - Data URI 생성 완료, 길이:', dataUri.length);

              const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: dataUri },
                { shouldPlay: true }
              );
              setSound(newSound);
              newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  console.log('[음성채팅] 디버그 모드 - 음성 재생 완료');
                  newSound.unloadAsync();
                  setSound(null);
                  setCurrentState('idle');
                  setDisplayedText('');
                  setAiResponseText('');
                }
              });

            } catch (audioError) {
              console.error('[음성채팅] 디버그 모드 - 음성 재생 오류:', audioError);
              setCurrentState('idle');
              setDisplayedText('');
              setAiResponseText('');
            }
          } else {
            console.log('[음성채팅] 디버그 모드 - 오디오 데이터 없음, 시뮬레이션으로 처리');
            // 3초 후 자동으로 idle 상태로 복귀 (음성 재생 완료 시뮬레이션)
            setTimeout(() => {
              console.log('[음성채팅] 디버그 모드 - 음성 재생 완료 시뮬레이션');
              setCurrentState('idle');
              setDisplayedText('');
              setAiResponseText('');
            }, 3000);
          }

          return; // 디버그 모드에서는 여기서 종료
        }
        
        // 프로덕션 모드: 폴링 방식으로 빠르게 상태 확인 (0.3초마다)
        let checkStatus: any = null;
        let timeoutId: any = null;
        
        const startPolling = () => {
          // 기존 폴링이 있다면 중지
          if (checkStatus) {
            clearInterval(checkStatus);
            checkStatus = null;
          }
          
          // 기존 타임아웃이 있다면 중지
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          checkStatus = setInterval(async () => {
            try {
              const { data: jobData, error: jobError } = await supabase
                .from('voice_processing_jobs')
                .select('status, audio_url, error_message')
                .eq('job_id', jobId)
                .single();
              
              if (jobError) {
                console.error('[음성채팅] 작업 상태 확인 실패:', jobError);
                return;
              }
              
              console.log('[음성채팅] 작업 상태 확인 중:', jobData.status);
              
              if (jobData.status === 'completed' && jobData.audio_url) {
                console.log('[음성채팅] 드디어 음성 생성 완료!', jobData.audio_url);
                
                // 폴링과 타임아웃 모두 중지
                if (checkStatus) {
                  clearInterval(checkStatus);
                  checkStatus = null;
                }
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }
                
                // 6. 오디오 URL을 사용하여 음성 재생
                try {
                  if (sound) {
                    await sound.unloadAsync();
                  }
                  
                  // 음성 재생 시작 시 상태 변경
                  setCurrentState('speaking'); // "말하고 있어요" 상태
                  setDisplayedText(aiResponseText); // AI 응답 텍스트를 subtitle에 표시
                  
                  const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: jobData.audio_url },
                    { shouldPlay: true }
                  );
                  
                  setSound(newSound);
                  newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                      console.log('[음성채팅] 음성 재생 완료');
                      newSound.unloadAsync();
                      setSound(null);
                      setCurrentState('idle');
                      setDisplayedText(''); // 텍스트 초기화
                      setAiResponseText(''); // AI 응답 텍스트 초기화
                    }
                  });
                  
                } catch (audioError) {
                  console.error('[음성채팅] 음성 재생 실패:', audioError);
                  setCurrentState('idle');
                  setDisplayedText('');
                  setAiResponseText('');
                }
                
              } else if (jobData.status === 'failed') {
                console.error('[음성채팅] 음성 생성 실패:', jobData.error_message);
                
                // 폴링과 타임아웃 모두 중지
                if (checkStatus) {
                  clearInterval(checkStatus);
                  checkStatus = null;
                }
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }
                
                setDisplayedText('음성 생성에 실패했어요. 다시 시도해주세요.');
                setCurrentState('error');
              }
              
            } catch (checkError) {
              console.error('[음성채팅] 작업 상태 확인 중 오류:', checkError);
              
              // 오류 발생 시에도 폴링과 타임아웃 모두 중지
              if (checkStatus) {
                clearInterval(checkStatus);
                checkStatus = null;
              }
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
            }
          }, 300);
          
          // 10초 후에도 완료되지 않으면 타임아웃
          timeoutId = setTimeout(() => {
            if (checkStatus) {
              clearInterval(checkStatus);
              checkStatus = null;
            }
            console.log('[음성채팅] 음성 생성 타임아웃');
          }, 10000);
        };
        
        // 폴링 시작
        startPolling();
        
      } catch (finishError) {
        console.error('[음성채팅] ai-voice-finish 처리 실패:', finishError);
        setDisplayedText('음성 생성에 실패했어요. 다시 시도해주세요.');
        setCurrentState('error');
      }
      
    } catch (error) {
      console.error('[음성채팅] 새로운 비동기 방식 처리 실패:', error);
      setCurrentState('error');
      setDisplayedText('오류가 발생했어요. 다시 시도해주세요.');
    }
  }, [addMessageToHistory, sound, sessionId, sessionStartTime, mode, currentStep, shouldEnableStepProgression, isDebugMode, isNewGoal, conversationMemory]);



  // --- Audio Playback Logic (기존과 동일) ---
  const playAudio = useCallback(async (base64Data: string, onFinish: () => void) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Data}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          onFinish();
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('[음성채팅] 오디오 재생 실패:', error);
      onFinish();
    }
  }, [sound]);

  useEffect(() => {
    const playNextInQueue = async () => {
      if (audioQueue.length > 0 && !isPlayingAudio) {
        setIsPlayingAudio(true);
        const nextAudioChunk = audioQueue[0];
        await playAudio(nextAudioChunk, () => {
          setAudioQueue(prev => prev.slice(1));
          setIsPlayingAudio(false);
        });
      }
    };
    playNextInQueue();
  }, [audioQueue, isPlayingAudio, playAudio]);

  // --- Recording Logic (기존과 동일) ---
  
  // 마이크 테스트 함수
  const testMicrophone = async () => {
    try {
      console.log('[마이크 테스트] 시작...');
      setDisplayedText('마이크 테스트 중...');
      
      // 1. 권한 확인
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setDisplayedText('마이크 권한이 필요해요!');
        return;
      }
      
      // 2. 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // 3. 테스트 녹음 시작 (3초)
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      let maxMetering = -100;
      let hasAudioSignal = false;
      
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          console.log('[마이크 테스트] 녹음 중...', {
            metering: status.metering,
            duration: status.durationMillis
          });
          
          if (status.metering && status.metering > maxMetering) {
            maxMetering = status.metering;
          }
          
          if (status.metering && status.metering > -60) {
            hasAudioSignal = true;
          }
          
          // 실시간 피드백
          if (status.metering && status.metering > -20) {
            setDisplayedText('🎤 음성 레벨: 매우 좋음!');
          } else if (status.metering && status.metering > -40) {
            setDisplayedText('🎤 음성 레벨: 좋음');
          } else if (status.metering && status.metering > -60) {
            setDisplayedText('🎤 음성 레벨: 보통');
          } else {
            setDisplayedText('🎤 음성 레벨: 낮음 (마이크 확인 필요)');
          }
        }
        
        if (status.isDoneRecording) {
          console.log('[마이크 테스트] 완료!', {
            maxMetering,
            hasAudioSignal,
            duration: status.durationMillis
          });
          
          // 결과 분석
          if (hasAudioSignal && maxMetering > -40) {
            setDisplayedText('✅ 마이크 정상 작동! 음성이 잘 들려요.');
          } else if (hasAudioSignal) {
            setDisplayedText('⚠️ 마이크는 작동하지만 음성이 작아요. 더 크게 말해주세요.');
          } else {
            setDisplayedText('🚨 마이크에서 음성이 들리지 않아요! 마이크 설정을 확인해주세요.');
          }
          
          // 3초 후 원래 상태로 복원
          setTimeout(() => {
            setDisplayedText('마이크 테스트 완료');
          }, 3000);
        }
      });
      
      // 4. 3초 후 자동 정지
      setTimeout(async () => {
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) {
          console.error('[마이크 테스트] 정지 실패:', err);
        }
      }, 3000);
      
    } catch (err) {
      console.error('[마이크 테스트] 실패:', err);
      setDisplayedText('마이크 테스트에 실패했어요.');
    }
  };
  
  const startRecording = async () => {
    try {
      console.log('[음성채팅] 녹음 시작 준비...');
      
      // 1. 권한 요청 (더 강력한 권한 체크)
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setDisplayedText('마이크 권한이 필요해요. 설정에서 마이크 권한을 허용해주세요.');
        setCurrentState('error');
        return;
      }
      console.log('[음성채팅] 마이크 권한 확인됨');

      // 2. 오디오 모드 설정 (더 강력한 설정)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      console.log('[음성채팅] 오디오 모드 설정 완료');
      
      // 3. 고품질 녹음 옵션 생성 (더 높은 품질 + 마이크 감도 향상)
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          sampleRate: 44100,        // 44.1kHz (CD 품질)
          numberOfChannels: 1,      // 모노
          bitRate: 320000,          // 320kbps (최고 품질)
          // 마이크 감도 향상 설정
          gainControl: 1,           // 자동 게인 컨트롤 활성화
          echoCancellation: false,  // 에코 캔슬레이션 비활성화 (음성 품질 향상)
          noiseSuppression: false,  // 노이즈 서프레션 비활성화 (음성 품질 향상)
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          sampleRate: 44100,        // 44.1kHz
          numberOfChannels: 1,      // 모노
          bitRate: 320000,          // 320kbps
        },
      };
      
      console.log('[음성채팅] 녹음 옵션:', recordingOptions);
      
      // 4. 녹음 시작
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      
      // 5. 녹음 상태 모니터링 설정 (더 상세한 모니터링)
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          console.log('[음성채팅] 녹음 중...', {
            duration: status.durationMillis,
            metering: status.metering,
            isRecording: status.isRecording
          });
          
          // 음성 레벨에 따른 실시간 피드백
          if (status.metering && status.metering > -20) {
            console.log('✅ 음성 레벨 매우 좋음');
            setDisplayedText('음성이 잘 들리고 있어요!');
          } else if (status.metering && status.metering > -40) {
            console.log('✅ 음성 레벨 정상');
            setDisplayedText('음성이 들리고 있어요');
          } else if (status.metering && status.metering > -60) {
            console.log('⚠️ 음성 레벨 낮음');
            setDisplayedText('음성이 조금 작아요. 더 크게 말해주세요.');
          } else if (status.metering && status.metering < -60) {
            console.warn('🚨 음성 레벨 매우 낮음 - 마이크 문제 가능성');
            setDisplayedText('음성이 들리지 않아요! 마이크를 확인해주세요.');
          }
        }
        
        if (status.isDoneRecording) {
          console.log('[음성채팅] 녹음 완료!', {
            duration: status.durationMillis
          });
        }
      });
      
      setRecording(newRecording);
      setCurrentState('listening');
      setDisplayedText('말씀해주세요...');
      console.log('[음성채팅] 최고품질 녹음 시작 완료! (44.1kHz, 320kbps)');

    } catch (err) {
      console.error('[음성채팅] 녹음 시작 실패:', err);
      setCurrentState('error');
      setDisplayedText('녹음 시작에 실패했어요. 마이크 권한을 확인해주세요.');
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) {
      console.log('[음성채팅] 녹음 인스턴스가 없습니다.');
      return;
    }

    console.log('[음성채팅] 녹음 중지 및 전송 시작...');
    setCurrentState('processing');
    setDisplayedText('');
    fullResponseTextRef.current = '';

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null); // Clear the recording state

      if (!uri) {
        throw new Error('녹음된 파일의 URI를 찾을 수 없습니다.');
      }

      console.log('[음성채팅] 녹음 완료, URI:', uri);
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 새로운 비동기 방식 사용 (프롬프트 제거로 최적화)
      await processVoiceWithNewAsyncMethod(base64Audio);

    } catch (error) {
      console.error('[음성채팅] 녹음 처리 실패:', error);
      setCurrentState('error');
      setDisplayedText('오류가 발생했어요. 다시 시도해주세요.');
    }
  };

  // --- Session and UI Logic ---
  const handleMainAreaPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (recording) {
      stopRecordingAndSend();
    } else if (currentState === 'idle' || currentState === 'error') {
      startRecording();
    }
  }, [recording, currentState]);

  const cleanUp = useCallback(async () => {
    console.log('[음성채팅] 정리 작업 수행...');
    if (recording) {
      await recording.stopAndUnloadAsync().catch(e => console.error("정리 중 녹음 중지 오류:", e));
      setRecording(null);
    }
    if (sound) {
      await sound.unloadAsync().catch(e => console.error("정리 중 사운드 로드 오류:", e));
      setSound(null);
    }
    // Reset audio mode
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
    }).catch(e => console.error("정리 중 오디오 모드 리셋 오류:", e));
  }, [recording, sound]);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1);
      scaleAnim.value = withSpring(1);
      textFadeAnim.value = withTiming(1);
      setCurrentState('idle');
    } else {
      fadeAnim.value = withTiming(0);
      scaleAnim.value = withTiming(0.8);
      textFadeAnim.value = withTiming(0);
      cleanUp();
    }
  }, [visible]);

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        cleanUp();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [cleanUp]);

  const handleClose = useCallback(() => {
    cleanUp().then(() => onClose());
  }, [cleanUp, onClose]);

  const modalStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textFadeAnim.value }));
  const styles = createStyles(colors);
  const config = VOICE_STATE_CONFIG[currentState] || VOICE_STATE_CONFIG.idle;

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={handleClose} statusBarTranslucent={true}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.modalContainer, modalStyle]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Step progress UI can be kept as is */}
          <TouchableOpacity style={styles.mainArea} onPress={handleMainAreaPress} activeOpacity={0.95}>
            <Animated.View style={[styles.statusContainer, textStyle]}>
              <Text style={[styles.titleText, koreanTextStyle(config.title)]}>{config.title}</Text>
              <Text style={[styles.subtitleText, koreanTextStyle(displayedText || config.subtitle)]}>
                {currentState === 'speaking' ? aiResponseText : (displayedText || config.subtitle)}
              </Text>
            </Animated.View>
            <View style={styles.visualizerContainer}>
              <VoiceVisualizer state={isPaused ? 'idle' : currentState} />
            </View>
          </TouchableOpacity>
          <VoiceChatControls onPause={() => setIsPaused(true)} onResume={() => setIsPaused(false)} isPaused={isPaused} />
          
          <TouchableOpacity style={styles.reportButton} onPress={onSwitchToText || handleClose}>
            <MaterialIcons name="description" size={35} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

// --- Styles remain the same ---
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  mainArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.screen.paddingHorizontal },
  statusContainer: { position: 'absolute', top: 120, alignItems: 'center', width: '100%', backgroundColor: colors.card, borderRadius: Spacing.layout.borderRadius.lg, paddingVertical: 24, paddingHorizontal: Spacing.xl, marginHorizontal: Spacing.lg },
  titleText: { fontSize: 50, fontWeight: '600', color: colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitleText: { fontSize: 25, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm, paddingHorizontal: Spacing.lg, lineHeight: 25 * 1.5 },
  visualizerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', maxHeight: 400, marginTop: Spacing['6xl'] },
  reportButton: { position: 'absolute', bottom: 40, right: 24, width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  stepProgressContainer: { paddingTop: Spacing['7xl'], paddingHorizontal: Spacing.screen.paddingHorizontal, paddingBottom: Spacing.md, backgroundColor: colors.background },
  stepIndicatorContainer: { alignItems: 'center', marginBottom: Spacing.md },
  stepIndicatorText: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xs },
  stepDescriptionText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, textAlign: 'center', opacity: 0.8 },
  progressBarContainer: { height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: 'hidden', marginHorizontal: Spacing.lg },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  testButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: Spacing.layout.borderRadius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border },
  testButtonText: { fontSize: 16, fontWeight: '500', color: colors.text, marginLeft: Spacing.sm },
  micStatusContainer: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: colors.surface,
    borderRadius: Spacing.layout.borderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  micStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  micStatusSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

});

export default VoiceChatScreen;