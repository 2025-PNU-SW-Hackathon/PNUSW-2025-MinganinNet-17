import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AccentGlassCard } from './GlassCard';
import { PurpleBlueGradient } from './GradientBackground';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

/**
 * Test component to verify Coach's Status is working properly
 */
export const CoachStatusTest: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Mock coach status for testing
  const coachStatus = {
    emoji: '😊',
    message: '정말 잘하고 있어요!',
    color: '#8BC34A'
  };

  return (
    <PurpleBlueGradient style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Coach's Status Test
        </Text>
        
        <AccentGlassCard
          blur="medium"
          opacity="medium"
          accessibilityLabel="Coach status card test"
        >
          <View style={styles.coachHeader}>
            <Text style={styles.cardTitle}>Coach's Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: coachStatus.color }]}>
              <Text style={styles.statusBadgeText}>Live</Text>
            </View>
          </View>
          
          <View style={styles.coachContent}>
            <View style={styles.coachAvatarContainer}>
              <View 
                style={[
                  styles.coachAvatar, 
                  { backgroundColor: coachStatus.color + '20' }
                ]}
              >
                <Text style={styles.coachEmoji}>{coachStatus.emoji}</Text>
              </View>
              <View style={[styles.coachPulse, { backgroundColor: coachStatus.color }]} />
            </View>
            
            <View style={styles.coachMessageContainer}>
              <Text style={styles.coachMessage}>{coachStatus.message}</Text>
              <View style={styles.coachMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Today</Text>
                  <View style={[styles.metricIndicator, { backgroundColor: coachStatus.color }]} />
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.coachInteraction}>
            <Text style={styles.coachInteractionText}>💬 Ask Coach</Text>
            <Text style={styles.coachInteractionArrow}>→</Text>
          </View>
        </AccentGlassCard>
        
        <Text style={[styles.status, { color: colors.text }]}>
          ✅ Coach's Status should now be visible in HomeScreen!
        </Text>
      </View>
    </PurpleBlueGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.screen.paddingHorizontal,
    paddingTop: Spacing['4xl'],
    justifyContent: 'center',
    gap: Spacing['2xl'],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: Spacing.xl,
  },
  // Coach Status Styles
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.layout.borderRadius.md,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coachContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  coachAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachPulse: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  coachEmoji: {
    fontSize: 28,
  },
  coachMessageContainer: {
    flex: 1,
  },
  coachMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  coachMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginRight: Spacing.sm,
  },
  metricIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  coachInteraction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  coachInteractionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coachInteractionArrow: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default CoachStatusTest;