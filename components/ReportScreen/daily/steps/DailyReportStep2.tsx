import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { 
  generateDailyReflectionChatResponse, 
  evaluateDailyReflectionCompletion,
  generateFinalDailyReflectionSummary
} from '../../../../backend/hwirang/gemini';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { DailyTodo } from '../../../../types/habit';
import ChatContainer, { ChatMessageType } from '../../../Chat/ChatContainer';
import VoiceChatScreen from '../../../VoiceChatScreen';

interface DailyReportStep2Props {
  todos: DailyTodo[];
  achievementScore: number;
  onComplete: (userSummary: string, aiFeedback: string) => void;
  onBack: () => void;
}

type ChatMode = 'chat' | 'voice';

export default function DailyReportStep2({ todos, achievementScore, onComplete, onBack }: DailyReportStep2Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const [mode, setMode] = useState<ChatMode>('chat');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceChatVisible, setVoiceChatVisible] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const messageIdCounter = useRef(0);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: `msg-${messageIdCounter.current++}`,
      role: 'coach',
      content: `안녕하세요! 😊 오늘 하루 정말 수고하셨어요. 오늘은 ${todos.filter(t => t.is_completed).length}개의 할 일을 완료하셨고, 스스로 ${achievementScore}/10점을 주셨네요. 어떤 하루였는지 편안하게 이야기해보시겠어요?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [todos, achievementScore]);

  // Track if user can submit conversation
  useEffect(() => {
    const userMessages = messages.filter(msg => msg.role === 'user');
    setCanSubmit(userMessages.length >= 2); // Allow submission after 2 user messages
  }, [messages]);

  const generateUniqueId = () => `msg-${messageIdCounter.current++}`;

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessageType = {
      id: generateUniqueId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Convert todos to the format expected by the backend
      const feedbackTodos = todos.map(t => ({
        id: t.id.toString(),
        description: t.description,
        completed: t.is_completed,
      }));

      // Get user message count for flow control
      const userMessages = updatedMessages.filter(msg => msg.role === 'user');
      
      // Check if conversation is complete enough for final analysis
      const completionStatus = await evaluateDailyReflectionCompletion(updatedMessages);
      
      let aiResponse: string;
      
      // Check if conversation should auto-complete (for very long conversations)
      if (completionStatus.isComplete && completionStatus.completionScore >= 90 && userMessages.length >= 8) {
        // Auto-complete only for very comprehensive conversations
        aiResponse = "정말 풍성한 대화였어요! ✨ 충분히 많은 이야기를 나누었으니 이제 오늘 하루에 대한 종합적인 분석을 정리해드릴게요.";
        
        // Add AI response first
        const finalMessage: ChatMessageType = {
          id: generateUniqueId(),
          role: 'coach',
          content: aiResponse,
          timestamp: new Date()
        };
        
        const messagesWithFinal = [...updatedMessages, finalMessage];
        setMessages(messagesWithFinal);
        setIsTyping(false);
        setIsLoading(false);
        
        // Generate comprehensive analysis
        setTimeout(async () => {
          try {
            const comprehensiveAnalysis = await generateFinalDailyReflectionSummary(
              messagesWithFinal, 
              feedbackTodos, 
              achievementScore
            );
            
            // Convert the conversation to a summary format for the existing flow
            const conversationSummary = updatedMessages
              .filter(msg => msg.role === 'user')
              .map(msg => msg.content)
              .join(' ');
            
            onComplete(conversationSummary, comprehensiveAnalysis);
          } catch (error) {
            console.error('Final analysis generation failed:', error);
            Alert.alert('오류', '최종 분석 생성 중 오류가 발생했습니다.');
          }
        }, 1000);
        
        return;
      } else {
        // Continue conversation with contextual response
        aiResponse = await generateDailyReflectionChatResponse(
          updatedMessages, 
          feedbackTodos, 
          achievementScore
        );
      }

      // Add AI response
      const aiMessage: ChatMessageType = {
        id: generateUniqueId(),
        role: 'coach',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessageType = {
        id: generateUniqueId(),
        role: 'coach',
        content: '죄송해요, 일시적인 오류가 발생했어요. 다시 한 번 말씀해주시겠어요? 🙏',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleVoicePress = () => {
    setVoiceChatVisible(true);
  };

  const handleVoiceComplete = (data: any) => {
    setVoiceChatVisible(false);
    if (data && data.transcript) {
      // Use the transcript as if it were a chat message
      handleSendMessage(data.transcript);
    }
  };

  const handleSubmitConversation = async () => {
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    
    try {
      const feedbackTodos = todos.map(t => ({
        id: t.id.toString(),
        description: t.description,
        completed: t.is_completed,
      }));

      // Generate final comprehensive analysis
      const comprehensiveAnalysis = await generateFinalDailyReflectionSummary(
        messages, 
        feedbackTodos, 
        achievementScore
      );
      
      // Convert the conversation to a summary format for the existing flow
      const conversationSummary = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');
      
      onComplete(conversationSummary, comprehensiveAnalysis);
    } catch (error) {
      console.error('Manual submission failed:', error);
      Alert.alert('오류', '대화를 제출하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'voice' || voiceChatVisible) {
    return (
      <VoiceChatScreen
        visible={true}
        mode="report"
        onClose={() => {
          setVoiceChatVisible(false);
          setMode('chat');
        }}
        onComplete={handleVoiceComplete}
      />
    );
  }

  return (
    <ChatContainer
      messages={messages}
      onSendMessage={handleSendMessage}
      onVoicePress={handleVoicePress}
      onSubmitConversation={handleSubmitConversation}
      onBack={onBack}
      isTyping={isTyping}
      disabled={isLoading}
      coachName="루티"
      placeholder="오늘 하루에 대해 이야기해보세요..."
      showVoiceButton={true}
      showSubmitButton={canSubmit && !isLoading}
    />
  );
}
