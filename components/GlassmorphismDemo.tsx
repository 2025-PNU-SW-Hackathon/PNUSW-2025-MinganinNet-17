import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import GradientBackground, { PurpleBlueGradient } from './GradientBackground';
import GlassCard, { PrimaryGlassCard, SecondaryGlassCard, AccentGlassCard } from './GlassCard';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

/**
 * Demonstration component showing Android-optimized glassmorphism effect
 * with white/purple styling over gradient backgrounds
 */
export const GlassmorphismDemo: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <PurpleBlueGradient style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Android Glassmorphism
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Android-optimized white/purple glass effects with elevation
        </Text>

        {/* Primary Glass Card Demo */}
        <PrimaryGlassCard
          blur="strong"
          opacity="medium"
          style={styles.demoCard}
          accessibilityLabel="Primary glass card demo"
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              30 days
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Meditation Challenge
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            100+ guided meditations covering anxiety, focus, stress, gratitude and more.
          </Text>
        </PrimaryGlassCard>

        {/* Secondary Glass Card Demo */}
        <SecondaryGlassCard
          blur="medium"
          opacity="medium"
          style={styles.demoCard}
          accessibilityLabel="Secondary glass card demo"
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Daily Progress
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Your Journey
            </Text>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressItem}>
              <Text style={[styles.progressNumber, { color: colors.primary }]}>15</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Days</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressNumber, { color: colors.primary }]}>8h</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressNumber, { color: colors.primary }]}>95%</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Complete</Text>
            </View>
          </View>
        </SecondaryGlassCard>

        {/* Accent Glass Card Demo */}
        <AccentGlassCard
          blur="subtle"
          opacity="light"
          style={styles.demoCard}
          accessibilityLabel="Accent glass card demo"
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Today's Focus
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Mindfulness Practice
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Take a moment to breathe deeply and center yourself in the present moment.
          </Text>
        </AccentGlassCard>

        {/* Different Blur Levels Demo */}
        <View style={styles.blurDemo}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Blur Variations
          </Text>
          <View style={styles.blurRow}>
            <GlassCard blur="subtle" opacity="medium" style={styles.smallCard}>
              <Text style={[styles.smallCardText, { color: colors.text }]}>Subtle</Text>
            </GlassCard>
            <GlassCard blur="medium" opacity="medium" style={styles.smallCard}>
              <Text style={[styles.smallCardText, { color: colors.text }]}>Medium</Text>
            </GlassCard>
            <GlassCard blur="strong" opacity="medium" style={styles.smallCard}>
              <Text style={[styles.smallCardText, { color: colors.text }]}>Strong</Text>
            </GlassCard>
          </View>
        </View>

        {/* Opacity Levels Demo */}
        <View style={styles.opacityDemo}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Opacity Variations
          </Text>
          <View style={styles.opacityRow}>
            <GlassCard blur="medium" opacity="light" style={styles.smallCard}>
              <Text style={[styles.smallCardText, { color: colors.text }]}>Light</Text>
            </GlassCard>
            <GlassCard blur="medium" opacity="medium" style={styles.smallCard}>
              <Text style={[styles.smallCardText, { color: colors.text }]}>Medium</Text>
            </GlassCard>
            <GlassCard blur="medium" opacity="dark" style={styles.smallCard}>
              <Text style={[styles.smallCardText, { color: colors.text }]}>Dark</Text>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </PurpleBlueGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.screen.paddingHorizontal,
    paddingVertical: Spacing['4xl'],
    gap: Spacing['2xl'],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  demoCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  blurDemo: {
    marginTop: Spacing['2xl'],
  },
  opacityDemo: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  blurRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  opacityRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  smallCard: {
    flex: 1,
    padding: Spacing.lg,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GlassmorphismDemo;