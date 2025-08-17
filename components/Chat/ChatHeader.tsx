import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { koreanTextStyle } from '../../utils/koreanUtils';

interface ChatHeaderProps {
  onBack: () => void;
  coachName?: string;
  isOnline?: boolean;
}

export default function ChatHeader({ 
  onBack, 
  coachName = "AI 코치", 
  isOnline = true 
}: ChatHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onBack} 
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.coachInfo}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.textInfo}>
          <Text style={[styles.coachName, koreanTextStyle(coachName)]}>
            {coachName}
          </Text>
          <Text style={styles.statusText}>
            {isOnline ? '• 온라인' : '• 오프라인'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {/* Future: Add mute, settings, etc. */}
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 64,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  coachInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.background,
  },
  textInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});