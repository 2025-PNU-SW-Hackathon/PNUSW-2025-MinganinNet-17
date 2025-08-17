import React, { useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import TypewriterMessage from './TypewriterMessage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onVoicePress?: () => void;
  onBack: () => void;
  isTyping?: boolean;
  disabled?: boolean;
  coachName?: string;
  placeholder?: string;
  showVoiceButton?: boolean;
  enableTypewriter?: boolean;
}

export default function ChatContainer({
  messages,
  onSendMessage,
  onVoicePress,
  onBack,
  isTyping = false,
  disabled = false,
  coachName = "AI 코치",
  placeholder = "오늘 하루에 대해 이야기해보세요...",
  showVoiceButton = true,
  enableTypewriter = true
}: ChatContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages are added or typing starts
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isTyping]);

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader 
        onBack={onBack}
        coachName={coachName}
        isOnline={true}
      />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, index) => {
          const isLatestCoachMessage = enableTypewriter && 
            message.role === 'coach' && 
            index === messages.length - 1 &&
            !isTyping;

          if (isLatestCoachMessage) {
            return (
              <TypewriterMessage
                key={message.id}
                id={message.id}
                content={message.content}
                timestamp={message.timestamp}
                onComplete={() => {
                  // Scroll to bottom after typewriter completes
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />
            );
          }

          return (
            <ChatMessage
              key={message.id}
              id={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          );
        })}
        
        {isTyping && (
          <TypingIndicator visible={true} />
        )}
        
        {/* Extra space at bottom for better UX */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <ChatInput
        onSendMessage={onSendMessage}
        onVoicePress={onVoicePress}
        disabled={disabled}
        placeholder={placeholder}
        showVoiceButton={showVoiceButton}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContent: {
    paddingVertical: 8,
    minHeight: '100%',
  },
  bottomSpacer: {
    height: 20,
  },
});