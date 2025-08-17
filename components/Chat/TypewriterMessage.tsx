import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { koreanTextStyle } from '../../utils/koreanUtils';

interface TypewriterMessageProps {
  id: string;
  content: string;
  timestamp: Date;
  onComplete?: () => void;
  typingSpeed?: number;
}

export default function TypewriterMessage({ 
  content, 
  timestamp, 
  onComplete,
  typingSpeed = 30 
}: TypewriterMessageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    const textLength = content.length;
    
    const typeNextCharacter = () => {
      if (currentIndex <= textLength) {
        setDisplayText(content.slice(0, currentIndex));
        currentIndex++;
        
        if (currentIndex <= textLength) {
          setTimeout(typeNextCharacter, typingSpeed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      }
    };

    // Start typing animation
    typeNextCharacter();

    // Cleanup function
    return () => {
      setIsComplete(true);
    };
  }, [content, typingSpeed, onComplete]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      </View>
      
      <View style={styles.messageBubble}>
        <Text style={[styles.messageText, koreanTextStyle(displayText)]}>
          {displayText}
          {!isComplete && <Text style={styles.cursor}>|</Text>}
        </Text>
        
        {isComplete && (
          <Text style={styles.timestampText}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
      
      <View style={styles.spacer} />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
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
    borderBottomLeftRadius: 4,
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter',
    color: colors.text,
    fontWeight: '400',
  },
  cursor: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  timestampText: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter',
    color: colors.textSecondary,
    opacity: 0.6,
  },
  spacer: {
    flex: 1,
  },
});