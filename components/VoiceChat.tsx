import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { generateNativeAudio, endConversationSession } from '../backend/hwirang/geminiLiveAudio';
import { validateAIResponse } from '../backend/hwirang/aiSafety';
import RealTimeVoiceInput from './RealTimeVoiceInput';
import AudioPlayer from './AudioPlayer';

interface GoalData {
  goal: string;
  period: string;
  time_slot: string;
  difficulty: string;
  coaching_intensity: 'high' | 'medium' | 'low' | '';
  allDataCollected: boolean;
  confirmationStatus: 'pending' | 'confirmed' | 'denied';
}

interface VoiceChatProps {
  onClose?: () => void;
}

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponseText, setAiResponseText] = useState('');
  const [aiAudioData, setAiAudioData] = useState<string | undefined>();
  const [audioMimeType, setAudioMimeType] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([]);
  const [goalData, setGoalData] = useState<GoalData>({
    goal: '',
    period: '',
    time_slot: '',
    difficulty: '',
    coaching_intensity: '',
    allDataCollected: false,
    confirmationStatus: 'pending',
  });
  
  // Custom hook or useEffect for session management could be even better.
  const handleClose = () => {
    endConversationSession();
    if (onClose) {
      onClose();
    }
  };

  const handleRecordingStop = async (transcription: string) => {
    if (!transcription.trim()) return;
    const newUserMessage = { type: 'user' as const, content: transcription };
    // We pass the full history to the AI processing function
    await processWithAI([...conversationHistory, newUserMessage]);
  };
  
  const processWithAI = async (currentHistory: typeof conversationHistory) => {
    setIsProcessing(true);
    setCurrentTranscription('');
    
    const latestUserMessage = currentHistory[currentHistory.length - 1]?.content || '';
    
    try {
      // 대화 히스토리를 포함한 더 스마트한 시스템 인스트럭션
      const conversationSummary = currentHistory.slice(-6).map(msg => 
        `${msg.type === 'user' ? '사용자' : 'AI'}: ${msg.content}`
      ).join('\n');
      
      const systemInstruction = `당신은 Routy, 친근하고 격려적인 AI 코치입니다. 사용자의 목표 설정을 도와주세요.

현재 수집된 정보:
- 목표: ${goalData.goal || '미정'}
- 기간: ${goalData.period || '미정'}  
- 시간대: ${goalData.time_slot || '미정'}
- 난이도: ${goalData.difficulty || '미정'}
- 코칭 강도: ${goalData.coaching_intensity || '미정'}

최근 대화:
${conversationSummary}

규칙:
1. 한국어로 자연스럽게 대화하세요
2. 응답은 2-3문장으로 간결하게 
3. 미수집 정보가 있으면 자연스럽게 질문으로 유도
4. 사용자의 감정을 공감하고 격려해주세요
5. 모든 정보가 수집되면 요약하고 확인 요청

사용자의 최신 메시지에 따뜻하게 반응하고, 다음 단계로 자연스럽게 이어가세요.`;

      const { text, audioData, mimeType, error } = await generateNativeAudio(latestUserMessage, systemInstruction);

      if (error) {
        throw new Error(text || 'AI 처리 중 오류가 발생했습니다.');
      }
      
      const validation = validateAIResponse(text);
      const finalText = validation.filteredResponse;
      
      // 목표 데이터 자동 추출 시도
      const updatedGoalData = extractGoalDataFromResponse(finalText, latestUserMessage, goalData);
      setGoalData(updatedGoalData);
      
      setAiResponseText(finalText);
      setAiAudioData(audioData);
      setAudioMimeType(mimeType);

      // 대화 히스토리 업데이트
      setConversationHistory(prev => [...prev, { type: 'user', content: latestUserMessage }, { type: 'ai', content: finalText }]);

      console.log('✅ AI 응답 처리 완료:', {
        textLength: finalText.length,
        hasAudioData: !!audioData,
        goalDataComplete: updatedGoalData.allDataCollected
      });

    } catch (error: any) {
      console.error('🚨 AI 처리 중 오류 발생:', error);
      const errorMessage = '죄송해요, 처리 중에 문제가 발생했어요. 다시 말씀해 주시겠어요?';
      setAiResponseText(errorMessage);
      setAiAudioData(undefined);
      setAudioMimeType(undefined);
      
      // 오류도 히스토리에 추가
      setConversationHistory(prev => [...prev, { type: 'user', content: latestUserMessage }, { type: 'ai', content: errorMessage }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 응답에서 목표 데이터 추출 (간단한 키워드 기반)
  const extractGoalDataFromResponse = (aiResponse: string, userMessage: string, currentGoalData: GoalData): GoalData => {
    const updated = { ...currentGoalData };
    
    // 사용자 메시지에서 목표 정보 추출
    const userLower = userMessage.toLowerCase();
    const aiLower = aiResponse.toLowerCase();
    
    // 목표 추출
    if (!updated.goal && (userLower.includes('목표') || userLower.includes('하고 싶') || userLower.includes('계획'))) {
      updated.goal = userMessage;
    }
    
    // 시간대 추출
    const timeKeywords = ['아침', '점심', '저녁', '밤', '새벽', '오전', '오후', '시', '분'];
    if (!updated.time_slot && timeKeywords.some(keyword => userLower.includes(keyword))) {
      updated.time_slot = userMessage;
    }
    
    // 기간 추출  
    const periodKeywords = ['주', '달', '개월', '년', '일', '하루', '매일'];
    if (!updated.period && periodKeywords.some(keyword => userLower.includes(keyword))) {
      updated.period = userMessage;
    }
    
    // 난이도 추출
    const difficultyKeywords = ['쉬운', '어려운', '보통', '힘든', '간단한'];
    if (!updated.difficulty && difficultyKeywords.some(keyword => userLower.includes(keyword))) {
      updated.difficulty = userMessage;
    }
    
    // 모든 데이터 수집 확인
    updated.allDataCollected = !!(updated.goal && updated.period && updated.time_slot && updated.difficulty);
    
    return updated;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI와 목표 설정</Text>
        {onClose && (
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.aiResponseContainer}>
          {isProcessing && !aiResponseText ? (
             <View style={styles.processingContainer}>
               <ActivityIndicator size="large" color="#8A63D2" />
               <Text style={styles.processingText}>Routy가 생각 중이에요...</Text>
             </View>
          ) : (
            <>
              <Text style={styles.aiResponseText}>
                {aiResponseText || "안녕하세요! 저는 당신의 목표 달성을 도와줄 AI 코치, Routy예요. 💪 어떤 새로운 목표를 세워볼까요?"}
              </Text>
              
              <AudioPlayer
                audioData={aiAudioData}
                audioMimeType={audioMimeType}
                text={aiResponseText || "안녕하세요! 저는 당신의 목표 달성을 도와줄 AI 코치, Routy예요. 어떤 새로운 목표를 세워볼까요?"} 
                onPlaybackStatusChange={setIsPlaying}
                autoPlay={true}
                showControls={false}
              />
            </>
          )}
        </View>

        <View style={styles.userInputContainer}>
          <Text style={styles.userInputLabel}>나의 답변</Text>
          <View style={styles.transcriptionDisplay}>
            <Text style={styles.transcriptionText}>{currentTranscription || '...'}</Text>
          </View>
          <RealTimeVoiceInput
            onTranscriptionUpdate={setCurrentTranscription}
            onRecordingStop={handleRecordingStop}
            isEnabled={!isProcessing}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#3a3a50',
    justifyContent: 'center', alignItems: 'center',
  },
  closeButtonText: { fontSize: 18, color: '#ffffff' },
  mainContent: { flex: 1, justifyContent: 'space-between' },
  aiResponseContainer: {
    flex: 2, // Less space
    justifyContent: 'center', alignItems: 'center',
    padding: 20, borderRadius: 20,
    backgroundColor: '#2a2a3e', marginBottom: 24,
  },
  aiResponseText: {
    fontSize: 20, fontWeight: '600',
    color: '#e0e0ff', textAlign: 'center', lineHeight: 30,
  },
  processingContainer: { justifyContent: 'center', alignItems: 'center' },
  processingText: { marginTop: 16, fontSize: 16, color: '#a9a9c2' },
  userInputContainer: {
    flex: 3, // More space
  },
  userInputLabel: {
    fontSize: 16, fontWeight: '600',
    color: '#a9a9c2', marginBottom: 8, textAlign: 'center',
  },
  transcriptionDisplay: {
    flex: 1,
    backgroundColor: '#1c1c2e', borderRadius: 12,
    padding: 16, justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: '#3a3a50',
    minHeight: 60,
  },
  transcriptionText: {
    fontSize: 18, color: '#e0e0ff',
    fontStyle: 'italic', textAlign: 'center',
  },
  progressIndicator: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3a3a50',
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#a9a9c2',
    textAlign: 'center',
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#8a8a8a',
    textAlign: 'center',
  },
});
