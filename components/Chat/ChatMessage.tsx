import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { koreanTextStyle } from '../../utils/koreanUtils';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function ChatMessage({ role, content, timestamp, isTyping = false }: ChatMessageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const isUser = role === 'user';

  return (
    <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.coachContainer]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        </View>
      )}
      
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.coachBubble]}>
        <Text style={[
          styles.messageText, 
          isUser ? styles.userText : styles.coachText,
          koreanTextStyle(content)
        ]}>
          {content}
        </Text>
        
        {!isTyping && (
          <Text style={[styles.timestampText, isUser ? styles.userTimestamp : styles.coachTimestamp]}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
      
      {isUser && <View style={styles.spacer} />}
    </View>
  );
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  coachContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  userText: {
    color: colors.background,
    fontWeight: '500',
  },
  coachText: {
    color: colors.text,
    fontWeight: '400',
  },
  timestampText: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  userTimestamp: {
    color: colors.background,
    opacity: 0.7,
    textAlign: 'right',
  },
  coachTimestamp: {
    color: colors.textSecondary,
    opacity: 0.6,
  },
  spacer: {
    width: 40,
  },
});