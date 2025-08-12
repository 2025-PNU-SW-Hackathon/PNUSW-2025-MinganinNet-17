import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import VoiceVisualizer from './VoiceVisualizer';
import VoiceChatControls from './VoiceChatControls';
import { VoiceChatState, VOICE_STATE_CONFIG } from '../types/voice';
import { pcmToWavDataUri } from '../utils/audioUtils';
import { useHabitStore } from '../lib/habitStore';
import {
  GeminiLiveSession,
  startOrGetConversationSession,
  endConversationSession,
} from '../backend/hwirang/geminiLiveAudio';

export interface VoiceChatScreenProps {
  visible: boolean;
  mode: 'goalSetting' | 'plan' | 'report';
  onClose: () => void;
  onComplete: (data: any) => void;
  onError?: (error: string) => void;
  onSwitchToText?: () => void; // 텍스트 모드로 전환하는 콜백 추가
}

const getSystemInstructionForMode = (mode: VoiceChatScreenProps['mode']): string => {
  const basePrompt = `You are '루티' (Routy), a friendly Korean habit coach.

RULES: Korean only, ALWAYS speak numbers in Korean (삼개월, 백만원, 여섯시, 일곱시, 여덟시), NEVER use English numbers, summarize as "~~가 목표시군요", one question at a time, handle interruptions, 2-3 sentences max.

CRITICAL: When speaking, use Korean numbers: 삼개월, 백만원, 여섯시, 일곱시, 여덟시, 아홉시, 열시, 열한시, 열두시

EMOTION: ALWAYS use "와!", "오!", "화이팅!", "음...", "아..." and "!", "?"

CRITICAL: NEVER create routines, plans, or projects. Your ONLY job is to collect information.`;

  const goalSettingFlow = `
FLOW: Start with "안녕하세요, 루티에요!" → Ask name → Ask goal → Smart detect info → Fill gaps → Confirm → End

RULES: 
1. ALWAYS start with "안녕하세요, 루티에요! 앞으로 편하게 부를 수 있도록 뭐라고 불러드리면 좋을까요?"
2. After getting name: "[이름]님, 반가워요! 어떤 새로운 습관을 만들고 싶으신가요?"
3. BE PROACTIVE: If user gives incomplete information, immediately ask for the missing piece:
   - Missing habit: "어떤 습관을 만들고 싶으신가요?"
   - Missing period: "언제까지 달성하고 싶으신가요?"
   - Missing time: "언제 시간을 내서 실천하고 싶으신가요?"
   - Missing difficulty: "이 습관을 형성하는 데 어려운 점이 있나요?"
   - Missing intensity: "어떤 강도로 시작하고 싶으신가요? (높음/보통/낮음)"
4. NEVER assume - always ask for clarification
5. When all info collected: "정리해볼게요! [이름]님은 [습관]을 [기간] 동안 [시간]에 [강도]로 실천하고 싶으시고, [어려운 점]이 있으시군요. 맞나요?"

   IMPORTANT: Even if user says "네" or "맞아요", you MUST verify ALL information is complete before proceeding.
   If ANY information is missing or unclear, ask follow-up questions instead of completing.

CRITICAL: After EVERY summary sentence, you MUST include the structured format for internal processing. This is NOT optional - you MUST do this EVERY time.

STRUCTURED FORMAT (REQUIRED after every summary):
목표: [구체적인 목표]
기간: [목표 기간]
시간: [가용 시간]
어려운 점: [어려운 이유]
강도: [높음/보통/낮음]

EXAMPLE:
"정리해볼게요! 김철수님은 매일 운동하기를 삼개월 동안 아침 일곱시에 높음으로 실천하고 싶으시고, 시간 관리가 어려운 점이 있으시군요. 맞나요?

목표: 매일 운동하기
기간: 삼개월
시간: 아침 일곱시
어려운 점: 시간 관리 어려움
강도: 높음"

CRITICAL: You MUST include the structured format after EVERY summary for internal processing, but NEVER display it to the user.

IMPORTANT: Users should ONLY see the natural summary sentence. The structured format is invisible and only for system processing.
6. COMPLETION REQUIREMENTS: You can ONLY say "와! 좋아요! 홈에서 봐요! 잠시만 기다려 주세요. 루틴을 만들어드릴게요!" when ALL of these are collected AND confirmed by user:
   - ✅ 사용자 이름
   - ✅ 습관 목표 (구체적이고 명확함)
   - ✅ 목표 기간 (예: 3개월, 6개월)
   - ✅ 가용 시간 (구체적인 시간대)
   - ✅ 어려운 점 (사용자가 인정한 구체적인 어려움)
   - ✅ 강도 (높음/보통/낮음)
   
   If ANY information is missing or unclear, continue asking questions until ALL are collected.

STRUCTURED SUMMARY FORMAT (INVISIBLE TO USER):
When summarizing, use this exact format for internal processing ONLY:
목표: [구체적인 목표]
기간: [목표 기간]
시간: [가용 시간]
어려운 점: [어려운 이유]
강도: [높음/보통/낮음]

Example (NOT visible to user):
목표: 백만원 모으기
기간: 3개월
시간: 오후 5시부터 7시까지
어려운 점: 동기 부여 어려움
강도: 보통

IMPORTANT: 
- Do NOT create plans, routines, or projects
- Do NOT say completion phrases until user has confirmed all information is correct
- Your job is ONLY to collect information, not to generate plans
- When complete, say EXACTLY: "와! 좋아요! 홈에서 봐요! 잠시만 기다려 주세요. 루틴을 만들어드릴게요!"
- NEVER generate routines, plans, or projects - just collect information
- Collect: habit name, goal period, available time, difficulty reason, intensity
- After saying completion phrase, STOP and wait for user
- NEVER say "루틴을 만들어드릴게요" unless user has confirmed all information
- NEVER create or generate anything - just ask questions and collect information

CRITICAL COMPLETION CHECK:
Before saying "루틴을 만들어드릴게요", verify you have:
1. 사용자 이름 (예: "김철수님")
2. 구체적인 습관 목표 (예: "매일 운동하기", "백만원 모으기")
3. 명확한 목표 기간 (예: "3개월", "6개월")
4. 구체적인 가용 시간 (예: "오후 5시부터 7시까지", "아침 7시")
5. 사용자가 인정한 어려운 점 (예: "동기 부여 어려움", "시간 관리 어려움")
6. 명확한 강도 (예: "높음", "보통", "낮음")

ABSOLUTE RULE: If you see "사용자 응답 대기" in ANY field, you CANNOT complete. You MUST continue asking questions until ALL fields have concrete values!

EXAMPLES:
- User says name "김철수" → "[이름]님, 반가워요! 어떤 새로운 습관을 만들고 싶으신가요?"
- "삼개월 동안 매일 운동하기" → "삼개월 동안 매일 운동하기가 목표시군요! 언제 시간을 내서 실천하고 싶으신가요?"
- "아침 일곱시에" → "아침 일곱시에 운동하기 좋은 시간이네요! 이 습관을 형성하는 데 어려운 점이 있나요?"

COMPLETE SUMMARY EXAMPLE:
"정리해볼게요! 김철수님은 매일 운동하기를 삼개월 동안 아침 일곱시에 높음으로 실천하고 싶으시고, 시간 관리가 어려운 점이 있으시군요. 맞나요?"

REMEMBER: You MUST include the structured format after EVERY summary, but NEVER show it to the user!
IMPORTANT: The structured format is ONLY for internal processing and should NEVER be visible to users.

CRITICAL FINAL REMINDER:
- EVERY summary MUST include the structured format
- The structured format is MANDATORY, not optional
- Users will NEVER see the structured format
- The structured format is ONLY for system processing
- If you don't include the structured format, the system cannot work properly

EMOTION: "와! 좋아요!", "화이팅!", "음... 그렇군요"
- NEVER show the structured format to users
- Users should ONLY see natural Korean conversation
- The structured format is for system processing only
- If you accidentally show the format, apologize and rephrase naturally

FINAL COMPLETION RULE:
You can ONLY complete the conversation when ALL 6 pieces of information are collected AND confirmed by the user. If you see "사용자 응답 대기" or any unclear information, you MUST continue asking questions. Do NOT rush to completion!

COMPLETION VERIFICATION:
Before saying "루틴을 만들어드릴게요", you MUST have:
- ✅ 사용자 이름 (구체적인 이름, "사용자님"은 불충분)
- ✅ 습관 목표 (구체적이고 명확함, "와!" 같은 감탄사 제외)
- ✅ 목표 기간 (구체적인 기간)
- ✅ 가용 시간 (구체적인 시간대)
- ✅ 어려운 점 (사용자가 인정한 구체적인 어려움)
- ✅ 강도 (높음/보통/낮음 중 하나)

ABSOLUTE BLOCK: If ANY field contains "사용자 응답 대기", you are BLOCKED from completing. You MUST ask follow-up questions!`;

  const planFlow = `
FLOW: Ask goals → Prioritize → Set time → Confirm → End

RULES: Stay on topic, summarize input, handle interruptions

EMOTION: "와! 좋아요!", "화이팅!"`;

  const reportFlow = `
FLOW: Ask experience → Guide reflection → Create summary → End with insight

RULES: Stay on topic, summarize input, handle interruptions

EMOTION: "음... 그렇군요", "힘내세요!"`;

  switch (mode) {
    case 'goalSetting':
      return basePrompt + goalSettingFlow;
    case 'plan':
      return basePrompt + planFlow;
    case 'report':
      return basePrompt + reportFlow;
    default:
      return basePrompt;
  }
};

const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({
  visible,
  mode,
  onClose,
  onComplete,
  onError,
  onSwitchToText,
}) => {
  const [currentState, setCurrentState] = useState<VoiceChatState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  // Use Zustand store for conversation history
  const { conversationHistory, addMessageToHistory } = useHabitStore();

  // 구조화된 목표 데이터 저장 (기존 useHabitStore 구조와 동일)
  const [goalData, setGoalData] = useState({
    habitName: '',        // 습관 이름
    goalPeriod: '',       // 목표 기간
    availableTime: '',    // 가용 시간
    difficultyReason: '', // 어려운 이유
    intensity: '',        // 강도
    isComplete: false
  });

  // 새로운 대화 시작 시 데이터 초기화
  const resetGoalData = useCallback(() => {
    const initialData = {
      habitName: '',
      goalPeriod: '',
      availableTime: '',
      difficultyReason: '',
      intensity: '',
      isComplete: false
    };
    setGoalData(initialData);
    console.log('[음성채팅] 목표 데이터 초기화됨');
  }, []);

  // 최종 정리 단계에서만 정보 추출하는 함수
  const extractFinalGoalInfo = useCallback((aiResponse: string) => {
    console.log('[음성채팅] 최종 정보 추출 시작:', aiResponse);
    
    // 루틴 생성 방지
    if (aiResponse.includes('루틴을 만들') || aiResponse.includes('계획을 생성') || aiResponse.includes('프로젝트를 만들')) {
      console.warn('[음성채팅] AI가 루틴 생성을 시도함 - 방지됨');
      return goalData;
    }
    
    const finalGoalData = {
      habitName: '',
      goalPeriod: '',
      availableTime: '',
      difficultyReason: '',
      intensity: '',
      isComplete: false
    };
    
    // AI 응답에서 최종 정리된 정보 추출
    if (aiResponse.includes('정리해볼게요') || aiResponse.includes('맞나요?')) {
      console.log('[음성채팅] 최종 정리 단계 감지 - 정보 추출 진행');
      
      // 습관 목표 추출 - 구조화된 형식 우선, 자연어 패턴 백업
      let habitName = '';
      
      // 패턴 1: 구조화된 형식에서 "목표:" 추출 (우선순위 최고)
      if (aiResponse.includes('목표:') && aiResponse.includes('기간:') && aiResponse.includes('시간:')) {
        const goalMatch = aiResponse.match(/목표:\s*([^\n]+)/);
        if (goalMatch) {
          habitName = goalMatch[1].trim();
          console.log('[음성채팅] 구조화된 형식에서 목표 추출됨:', habitName);
        }
      }
      
      // 패턴 2: 자연어에서 "~을/를 ~하고 싶으시고" 형태
      if (!habitName) {
        const wantPattern = aiResponse.match(/([가-힣\s]+(?:을|를))\s+([가-힣\s]+(?:하고|하며|하면서))\s+싶으시고/);
        if (wantPattern) {
          habitName = wantPattern[1].trim() + ' ' + wantPattern[2].replace('하고', '하기').replace('하며', '하기').replace('하면서', '하기');
        }
      }
      
      // 패턴 3: 자연어에서 "~을/를 ~하기" 형태
      if (!habitName) {
        const directPattern = aiResponse.match(/([가-힣\s]+(?:을|를))\s+([가-힣\s]+(?:하기|운동|독서|절약|저축|모으기))/);
        if (directPattern) {
          habitName = directPattern[1].trim() + ' ' + directPattern[2].trim();
        }
      }
      
      if (habitName) {
        // 불필요한 텍스트 제거
        habitName = habitName.replace(/^(와!|오!|아!|음\.\.\.|아\.\.\.)\s*/, '');
        habitName = habitName.replace(/^([가-힣]+님은?)\s*/, '');
        habitName = habitName.replace(/^([가-힣]+이?)\s*/, '');
        habitName = habitName.replace(/^(삼개월|육개월|구개월|일년)\s*동안\s*/, '');
        habitName = habitName.replace(/^(한달|두달|세달|네달|다섯달|여섯달)\s*동안\s*/, '');
        habitName = habitName.replace(/^(오후|오전|아침|저녁|새벽)\s*/, '');
        habitName = habitName.replace(/^(다섯시|일곱시|여섯시|여덟시|아홉시|열시|열한시|열두시)\s*/, '');
        habitName = habitName.replace(/^(높음|보통|낮음)\s*/, '');
        habitName = habitName.replace(/^(어려운\s*점|부족|어려움)\s*/, '');
        
        finalGoalData.habitName = habitName;
        console.log('[음성채팅] 습관 목표 추출됨 (정리됨):', finalGoalData.habitName);
      }
      
      // 목표 기간 추출
      const periodMatch = aiResponse.match(/(삼개월|육개월|구개월|일년|한달|두달|세달|네달|다섯달|여섯달)/);
      if (periodMatch) {
        let period = periodMatch[1];
        
        // 한국어 숫자를 아라비아 숫자로 변환
        period = period.replace(/삼개월/, '3개월');
        period = period.replace(/육개월/, '6개월');
        period = period.replace(/구개월/, '9개월');
        period = period.replace(/일년/, '1년');
        period = period.replace(/한달/, '1개월');
        period = period.replace(/두달/, '2개월');
        period = period.replace(/세달/, '3개월');
        period = period.replace(/네달/, '4개월');
        period = period.replace(/다섯달/, '5개월');
        period = period.replace(/여섯달/, '6개월');
        
        // 기간 형식 정리 (예: "3개월" → "3개월")
        period = period.trim();
        
        finalGoalData.goalPeriod = period;
        console.log('[음성채팅] 목표 기간 추출됨 (정리됨):', finalGoalData.goalPeriod);
      }
      
      // 가용 시간 추출 - 구조화된 형식 우선, 자연어 패턴 백업
      let availableTime = '';
      
      // 패턴 1: 구조화된 형식에서 "시간:" 추출 (우선순위 최고)
      if (aiResponse.includes('목표:') && aiResponse.includes('기간:') && aiResponse.includes('시간:')) {
        const timeMatch = aiResponse.match(/시간:\s*([^\n]+)/);
        if (timeMatch) {
          let time = timeMatch[1].trim();
          
          // 한국어 숫자를 아라비아 숫자로 변환
          time = time.replace(/한시/g, '1시');
          time = time.replace(/두시/g, '2시');
          time = time.replace(/세시/g, '3시');
          time = time.replace(/네시/g, '4시');
          time = time.replace(/다섯시/g, '5시');
          time = time.replace(/여섯시/g, '6시');
          time = time.replace(/일곱시/g, '7시');
          time = time.replace(/여덟시/g, '8시');
          time = time.replace(/아홉시/g, '9시');
          time = time.replace(/열시/g, '10시');
          time = time.replace(/열한시/g, '11시');
          time = time.replace(/열두시/g, '12시');
          
          // 시간 형식 정리
          time = time.replace(/부터\s*/, '-');
          time = time.replace(/\s*까지/, '');
          
          availableTime = time;
          console.log('[음성채팅] 구조화된 형식에서 시간 추출됨:', availableTime);
        }
      }
      
      // 패턴 2: 자연어에서 시간 추출 (백업용)
      if (!availableTime) {
        const naturalTimeMatch = aiResponse.match(/(오후|오전|아침|저녁|새벽)\s*([가-힣\s]+시부터\s*[가-힣\s]+시까지)/);
        if (naturalTimeMatch) {
          let time = naturalTimeMatch[1] + ' ' + naturalTimeMatch[2];
          
          // 한국어 숫자를 아라비아 숫자로 변환
          time = time.replace(/한시/g, '1시');
          time = time.replace(/두시/g, '2시');
          time = time.replace(/세시/g, '3시');
          time = time.replace(/네시/g, '4시');
          time = time.replace(/다섯시/g, '5시');
          time = time.replace(/여섯시/g, '6시');
          time = time.replace(/일곱시/g, '7시');
          time = time.replace(/여덟시/g, '8시');
          time = time.replace(/아홉시/g, '9시');
          time = time.replace(/열시/g, '10시');
          time = time.replace(/열한시/g, '11시');
          time = time.replace(/열두시/g, '12시');
          
          // 시간 형식 정리
          time = time.replace(/부터\s*/, '-');
          time = time.replace(/\s*까지/, '');
          
          availableTime = time;
        }
      }
      
      if (availableTime) {
        finalGoalData.availableTime = availableTime;
        console.log('[음성채팅] 가용 시간 추출됨 (정리됨):', finalGoalData.availableTime);
      }
      
      // 강도 추출
      const intensityMatch = aiResponse.match(/(높음|보통|낮음)/);
      if (intensityMatch) {
        finalGoalData.intensity = intensityMatch[1];
        console.log('[음성채팅] 강도 추출됨:', finalGoalData.intensity);
      }
      
      // 어려운 점 추출 - 구조화된 형식 우선, 자연어 패턴 백업
      let difficultyReason = '';
      
      // 패턴 1: 구조화된 형식에서 "어려운 점:" 추출 (우선순위 최고)
      if (aiResponse.includes('목표:') && aiResponse.includes('기간:') && aiResponse.includes('시간:')) {
        const difficultyMatch = aiResponse.match(/어려운\s*점:\s*([^\n]+)/);
        if (difficultyMatch) {
          difficultyReason = difficultyMatch[1].trim();
          console.log('[음성채팅] 구조화된 형식에서 어려운 점 추출됨:', difficultyReason);
        }
      }
      
      // 패턴 2: 자연어에서 "동기 부여가 어려운 점" 같은 구체적 패턴
      if (!difficultyReason) {
        const motivationMatch = aiResponse.match(/(동기\s*부여가\s*어려운\s*점)/);
        if (motivationMatch) {
          difficultyReason = motivationMatch[1].trim();
        }
      }
      
      // 패턴 3: 자연어에서 "~가 어려운 점" 형태
      if (!difficultyReason) {
        const difficultyMatch = aiResponse.match(/([가-힣\s]+(?:가\s+어려운\s*점|이\s+어려운\s*점))/);
        if (difficultyMatch) {
          difficultyReason = difficultyMatch[1].trim();
        }
      }
      
      if (difficultyReason) {
        // 불필요한 텍스트 제거
        difficultyReason = difficultyReason.replace(/^(와!|오!|아!|음\.\.\.|아\.\.\.)\s*/, '');
        difficultyReason = difficultyReason.replace(/^([가-힣]+님은?)\s*/, '');
        difficultyReason = difficultyReason.replace(/^([가-힣]+이?)\s*/, '');
        difficultyReason = difficultyReason.replace(/^(삼개월|육개월|구개월|일년)\s*동안\s*/, '');
        difficultyReason = difficultyReason.replace(/^(한달|두달|세달|네달|다섯달|여섯달)\s*동안\s*/, '');
        
        finalGoalData.difficultyReason = difficultyReason;
        console.log('[음성채팅] 어려운 점 추출됨 (정리됨):', finalGoalData.difficultyReason);
      }
    }
    
    // 목표 데이터 업데이트
    setGoalData(finalGoalData);
    console.log('[음성채팅] 최종 목표 데이터 업데이트:', finalGoalData);
    
    return finalGoalData;
  }, []);



  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const recordingRef = useRef<any>(null);
  const playerRef = useRef<Audio.Sound | null>(null);
  const userMediaStream = useRef<MediaStream | null>(null);

  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const textFadeAnim = useSharedValue(0);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
        if (Platform.OS === 'web') {
            if (recordingRef.current.state === 'recording') {
                recordingRef.current.stop();
            }
        } else {
            if (recordingRef.current.isRecording) {
              await recordingRef.current.stopAndUnloadAsync();
            }
        }
    } catch (error) {
        console.error('[음성채팅] 녹음 중지 오류:', error);
    }
    recordingRef.current = null;
  }, []);

  const stopPlayback = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.unloadAsync();
      playerRef.current = null;
    }
  }, []);

  // 대화 완료 감지 함수
  const isConversationComplete = (text: string): boolean => {
    console.log('[음성채팅] isConversationComplete 호출됨. 텍스트:', text);
    
    // 루티가 "루틴을 만들어드릴게요"라고 말하면 골 스텝 5로 이동
    const completionPhrases = [
      '루틴을 만들어드릴게요',
      '루틴을 만들어 드릴게요',
      '홈에서 봐요!',
      '잠시만 기다려 주세요',
      '정리해볼게요! 맞나요?',
      '그럼 이제 홈으로'
    ];
    
    // 계획 생성이나 중간 요약은 완료로 인식하지 않음 (더 구체적으로)
    const excludePhrases = [
      '프로젝트를 만들',
      '계획을 생성',
      '루틴을 만들',
      '목표를 설정',
      '습관을 만들',
      '운동 계획',
      '달성 계획',
      '생성 계획'
    ];
    
    // "루틴을 만들어드릴게요"가 포함되어 있으면 확실히 완료 (최우선)
    if (text.includes('루틴을 만들어드릴게요')) {
      console.log('[음성채팅] 완료 신호 감지: "루틴을 만들어드릴게요"');
      return true;
    }
    
    // "루틴을 만들어 드릴게요"가 포함되어 있으면 확실히 완료
    if (text.includes('루틴을 만들어 드릴게요')) {
      console.log('[음성채팅] 완료 신호 감지: "루틴을 만들어 드릴게요"');
      return true;
    }
    
    // "홈에서 봐요!"가 포함되어 있으면 확실히 완료
    if (text.includes('홈에서 봐요!')) {
      console.log('[음성채팅] 완료 신호 감지: "홈에서 봐요!"');
      return true;
    }
    
    // "와! 좋아요!"와 "루틴을 만들어드릴게요"가 함께 있으면 완료
    if (text.includes('와! 좋아요!') && text.includes('루틴을 만들어드릴게요')) {
      console.log('[음성채팅] 완료 신호 감지: "와! 좋아요!" + "루틴을 만들어드릴게요"');
      return true;
    }
    
    // "잠시만 기다려 주세요"와 "루틴을 만들어 드릴게요"가 함께 있으면 완료
    if (text.includes('잠시만 기다려 주세요') && text.includes('루틴을 만들어 드릴게요')) {
      console.log('[음성채팅] 완료 신호 감지: "잠시만 기다려 주세요" + "루틴을 만들어 드릴게요"');
      return true;
    }
    
    // 제외할 내용이 포함되어 있으면 완료가 아님 (루틴 완료 신호 이후에만 체크)
    if (excludePhrases.some(phrase => text.includes(phrase))) {
      console.log('[음성채팅] 제외 구문 감지됨:', excludePhrases.find(phrase => text.includes(phrase)));
      return false;
    }
    
    // 다른 완료 신호도 확인
    const hasCompletion = completionPhrases.some(phrase => text.includes(phrase));
    if (hasCompletion) {
      console.log('[음성채팅] 완료 신호 감지:', text);
    } else {
      console.log('[음성채팅] 완료 신호 없음. 텍스트에 포함된 구문들:', completionPhrases.filter(phrase => text.includes(phrase)));
    }
    return hasCompletion;
  };

  // 정보 수집 완성도 검증 함수
  const validateInformationCompleteness = (): { isComplete: boolean; missingInfo: string[]; summary: string } => {
    const messages = conversationHistory.filter(m => m.role === 'user');
    const fullText = messages.map(m => m.text).join(' ');
    
    let missingInfo: string[] = [];
    let summary = '';
    
    if (mode === 'goalSetting') {
      // 필수 정보 체크
      const hasName = /[가-힣]{2,4}님|[가-힣]{2,4}씨|[가-힣]{2,4}/.test(fullText);
      const hasGoal = /목표|하고 싶|달성|습관|만들|계획/.test(fullText);
      const hasPeriod = /[0-9]+개월|[0-9]+주|[0-9]+일|언제까지|기간|동안/.test(fullText);
      const hasAmount = /[0-9]+만원|[0-9]+kg|[0-9]+시간|[0-9]+페이지|얼마나|몇/.test(fullText);
      const hasMethod = /방법|어떻게|무엇으로|알바|운동|독서|투자|절약/.test(fullText);
      
      if (!hasName) missingInfo.push('사용자 이름');
      if (!hasGoal) missingInfo.push('목표 내용');
      if (!hasPeriod) missingInfo.push('목표 기간');
      if (!hasAmount) missingInfo.push('목표 수치/양');
      if (!hasMethod) missingInfo.push('구체적인 방법');
      
      // 요약 생성
      const nameMatch = fullText.match(/([가-힣]{2,4})님|([가-힣]{2,4})씨|([가-힣]{2,4})/);
      const goalMatch = fullText.match(/([가-힣\s]+(?:하기|하기|달성|습관))/);
      const periodMatch = fullText.match(/([0-9]+개월|[0-9]+주|[0-9]+일)/);
      const amountMatch = fullText.match(/([0-9]+만원|[0-9]+kg|[0-9]+시간|[0-9]+페이지)/);
      const methodMatch = fullText.match(/(알바|운동|독서|투자|절약|헬스|러닝)/);
      
      summary = `${nameMatch?.[1] || nameMatch?.[2] || nameMatch?.[3] || '사용자'}님이 ${goalMatch?.[1] || '목표'}를 ${periodMatch?.[1] || '정해진 기간'} 동안 ${amountMatch?.[1] || '정해진 양'}만큼 ${methodMatch?.[1] || '선택한 방법'}으로 달성하고 싶어하세요.`;
    }
    
    const isComplete = missingInfo.length === 0;
    
    return { isComplete, missingInfo, summary };
  };

  // 누락된 정보에 대한 질문 생성
  const generateFollowUpQuestion = (missingInfo: string[]): string => {
    if (missingInfo.length === 0) return '';
    
    const questions = {
      '사용자 이름': '앞으로 편하게 부를 수 있도록 뭐라고 불러드리면 좋을까요?',
      '목표 내용': '어떤 새로운 습관을 만들고 싶으신가요?',
      '목표 기간': '언제까지 달성하고 싶으신가요?',
      '목표 수치/양': '구체적으로 얼마나 달성하고 싶으신가요?',
      '구체적인 방법': '어떤 방법으로 달성하고 싶으신가요?',
      '선호하는 시간대': '언제 실행하고 싶으신가요?',
      '현재 상황/어려움': '현재 어떤 상황이신가요?'
    };
    
    const firstMissing = missingInfo[0];
    return questions[firstMissing as keyof typeof questions] || '추가 정보가 필요해요.';
  };

  // 대화 완료 시 처리 함수
  const handleConversationComplete = async () => {
    try {
      console.log('[음성채팅] handleConversationComplete 시작');
      setCurrentState('processing');
      
      // 목표 데이터 유효성 검사
      if (!goalData.habitName || goalData.habitName === '') {
        console.warn('[음성채팅] 습관 이름이 비어있음 - 대화 완료 처리 중단');
        setCurrentState('idle');
        return;
      }
      
      if (!goalData.goalPeriod || goalData.goalPeriod === '') {
        console.warn('[음성채팅] 목표 기간이 비어있음 - 대화 완료 처리 중단');
        setCurrentState('idle');
        return;
      }
      
      // 구조화된 목표 데이터 사용
      const finalGoalData = {
        ...goalData,
        transcript: conversationHistory.map(m => `${m.role}: ${m.text}`).join('\n'),
        mode: 'goalSetting',
        source: 'voice',
        timestamp: new Date().toISOString(),
        isVoiceComplete: true // 음성 채팅 완료 플래그
      };
      
      console.log('[음성채팅] 최종 목표 데이터:', finalGoalData);
      
      // mode에 따라 다른 처리
      if (mode === 'goalSetting') {
        // 목표 설정 모드: GoalSettingStep5로 이동 신호
        console.log('[음성채팅] 목표 설정 모드 완료 - GoalSettingStep5로 이동 신호');
        onComplete({
          ...finalGoalData,
          action: 'GOAL_SETTING_COMPLETE'
        });
      } else if (mode === 'plan') {
        // 홈화면 모드: 홈화면으로 돌아가기 신호
        console.log('[음성채팅] 홈화면 모드 완료 - 홈화면으로 돌아가기 신호');
        onComplete({
          ...finalGoalData,
          action: 'PLAN_COMPLETE_GO_HOME'
        });
      } else {
        // 리포트 모드 등: 기존 방식대로 처리
        console.log('[음성채팅] 다른 모드 완료 - 기존 방식으로 처리');
        onComplete(finalGoalData);
      }
      
    } catch (error) {
      console.error('[음성채팅] 대화 완료 처리 실패:', error);
      setCurrentState('error');
    }
  };

  const endSession = useCallback(async () => {
    await stopRecording();
    await stopPlayback();
    if (userMediaStream.current) {
        userMediaStream.current.getTracks().forEach(track => track.stop());
        userMediaStream.current = null;
    }
    await endConversationSession();
    sessionRef.current = null;
  }, [stopRecording, stopPlayback]);

  const startSession = useCallback(async () => {
    // 이미 세션이 있고 연결된 상태라면 재사용
    if (sessionRef.current && sessionRef.current.isConnected) {
      setCurrentState('idle');
      return;
    }
    
    setCurrentState('connecting');
    setLiveTranscript('');
    
    // 새로운 세션 시작 시 목표 데이터 초기화
    resetGoalData();

    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, interruptionModeIOS: 2, interruptionModeAndroid: 2 });
      }
      const systemInstruction = getSystemInstructionForMode(mode);
      const session = await startOrGetConversationSession(systemInstruction);
      sessionRef.current = session;
      setCurrentState('idle');
    } catch (e) {
      console.error('[음성채팅] 세션 시작 실패:', e);
      onError?.('음성 세션 시작에 실패했습니다.');
      setCurrentState('error');
    }
  }, [mode, onError, resetGoalData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && visible) {
        // AppState 변경 시에도 세션 유지 (대화가 끝날 때까지)
        // endSession().then(() => onClose());
        onClose();
      }
    });
    return () => subscription.remove();
  }, [visible, onClose]);

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
        
        addMessageToHistory({ role: 'model', text: displayText });

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
          console.log('[음성채팅] AI 음성 응답 재생 시작');
          await playAudio(response.audioData, response.mimeType, response.text);
        } else {
          console.log('[음성채팅] AI 음성 응답 데이터 없음, 텍스트만 표시');
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
        setCurrentState('idle');
      }, 2000);
    }
  };

  const playAudio = async (base64Data: string, mimeType?: string, responseText?: string) => {
    await stopPlayback();
    if (!base64Data) {
      setCurrentState('idle');
      return;
    }

    try {
      const rateMatch = mimeType?.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

      const wavDataUri = pcmToWavDataUri(base64Data, sampleRate);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavDataUri },
        { shouldPlay: true }
      );
      playerRef.current = sound;
      setCurrentState('speaking');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentState('idle');
          stopPlayback();
          
          // 음성 재생이 완료된 후 대화 완료 감지
          if (responseText && mode === 'goalSetting') {
            setTimeout(async () => {
              if (isConversationComplete(responseText)) {
                console.log('[음성채팅] AI 음성 재생 완료 후 대화 완료 감지됨! 골 스텝 5로 이동합니다.');
                await handleConversationComplete();
              } else {
                console.log('[음성채팅] AI 음성 재생 완료 후 대화 완료 감지되지 않음. 응답 텍스트:', responseText);
              }
            }, 500); // 0.5초 후 대화 완료 감지
          }
        }
      });
    } catch (error) {
      console.error('[음성채팅] 오디오 재생 실패:', error);
      setCurrentState('idle');
    }
  };

  const handleMainAreaPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentState === 'idle' || currentState === 'error') {
      startRecording();
    } else if (currentState === 'listening') {
      stopRecordingAndSend();
    } else if (currentState === 'speaking') {
      stopPlayback();
      setCurrentState('idle');
    }
  };

  const handleClose = useCallback((force = false) => {
    const fullTranscript = conversationHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    if (!force && fullTranscript) {
      onComplete({ transcript: fullTranscript });
    }
    // 대화가 완전히 끝날 때만 세션 종료
    endSession().then(() => onClose());
  }, [conversationHistory, onComplete, endSession, onClose]);

  // AI 응답을 적절히 두 줄로 나누어 표시하는 함수
  const formatResponseText = (text: string): string[] => {
    if (text.length <= 40) {
      return [text];
    }
    
    const words = text.split(' ');
    let firstLine = '';
    let secondLine = '';
    
    // 자연스러운 위치에서 나누기 (한국어 문법 기준)
    const breakPoints = ['을', '를', '에', '로', '과', '와', '의', '가', '이', '때', '것', '점', ',', '，', '!', '?', '.'];
    let breakIndex = -1;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (breakPoints.some(point => word.includes(point))) {
        breakIndex = i;
        break;
      }
    }
    
    if (breakIndex > 0 && breakIndex < words.length - 1) {
      firstLine = words.slice(0, breakIndex + 1).join(' ');
      secondLine = words.slice(breakIndex + 1).join(' ');
    } else {
      // 자연스러운 위치가 없으면 중간에서 나누기
      const midPoint = Math.ceil(words.length / 2);
      firstLine = words.slice(0, midPoint).join(' ');
      secondLine = words.slice(midPoint).join(' ');
    }
    
    return [firstLine, secondLine];
  };

  const modalStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ scale: scaleAnim.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textFadeAnim.value }));

  const config = VOICE_STATE_CONFIG[currentState] || VOICE_STATE_CONFIG.idle;
  const lastMessage = conversationHistory[conversationHistory.length - 1]?.text;
  const displayTranscript = liveTranscript || lastMessage || config.subtitle;
  
  // AI 응답을 두 줄로 나누어 표시
  const formattedResponse = formatResponseText(displayTranscript);

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={() => handleClose()} statusBarTranslucent={true}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.modalContainer, modalStyle]}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.mainArea} onPress={handleMainAreaPress} activeOpacity={0.95} disabled={isPaused || currentState === 'connecting'}>
            <Animated.View style={[styles.statusContainer, textStyle]}>
              <Text style={styles.titleText}>{config.title}</Text>
              <View style={styles.subtitleContainer}>
                {formattedResponse.map((line, index) => (
                  <Text key={index} style={styles.subtitleText}>
                    {line}
                  </Text>
                ))}
              </View>
              {config.showMicIcon && <View style={styles.micIconContainer}><Text style={styles.micIcon}>🎤</Text></View>}
            </Animated.View>
            <View style={styles.visualizerContainer}>
              <VoiceVisualizer state={isPaused ? 'idle' : currentState} amplitude={0.7} />
            </View>
          </TouchableOpacity>
          <VoiceChatControls onPause={() => setIsPaused(true)} onResume={() => setIsPaused(false)} onClose={() => handleClose()} isPaused={isPaused} disabled={currentState === 'idle' || currentState === 'connecting'} />
          
          {/* 모드 전환 버튼 */}
          {onSwitchToText && (
            <TouchableOpacity 
              style={styles.switchModeButton} 
              onPress={onSwitchToText}
              disabled={currentState === 'connecting'}
            >
              <Text style={styles.switchModeText}>📝 텍스트 모드로 전환</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#000000' },
  safeArea: { flex: 1 },
  mainArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  statusContainer: { position: 'absolute', top: 120, alignItems: 'center', width: '100%' },
  titleText: { fontSize: 28, fontWeight: '600', color: '#FFFFFF', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitleText: { 
    fontSize: 16, 
    fontWeight: '400', 
    color: 'rgba(255, 255, 255, 0.7)', 
    textAlign: 'center', 
    marginBottom: 8, // 줄간격 줄임
    paddingHorizontal: 20,
    lineHeight: 20, // 줄간격 조절
  },
  subtitleContainer: {
    width: '100%',
    alignItems: 'center',
  },
  micIconContainer: { marginTop: 8 },
  micIcon: { fontSize: 24, opacity: 0.7 },
  visualizerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', maxHeight: 400 },
  switchModeButton: { 
    position: 'absolute', 
    bottom: 120, 
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  switchModeText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '500' 
  },
});

export default VoiceChatScreen;
