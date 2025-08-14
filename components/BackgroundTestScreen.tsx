import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { PurpleBlueGradient } from './GradientBackground';
import { PrimaryGlassCard, SecondaryGlassCard, AccentGlassCard } from './GlassCard';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

/**
 * Test screen to verify gradient background and glassmorphism integration
 * This shows exactly what the HomeScreen background now looks like
 */
export const BackgroundTestScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <PurpleBlueGradient style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              🌱 Background Integration Success! 
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              HomeScreen now has the beautiful purple-blue gradient background
            </Text>

            {/* Test Glass Cards */}
            <PrimaryGlassCard
              blur="strong"
              opacity="medium"
              style={styles.card}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Primary Glass Card</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                White/purple glassmorphism effect with Android-optimized elevation and shadows.
              </Text>
            </PrimaryGlassCard>

            <SecondaryGlassCard
              blur="medium"
              opacity="medium"
              style={styles.card}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Secondary Glass Card</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                Perfect for your habit tracking content with enhanced visibility on Android.
              </Text>
            </SecondaryGlassCard>

            <AccentGlassCard
              blur="subtle"
              opacity="light"
              style={styles.card}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Accent Glass Card</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                Coach status and interactive elements now pop beautifully over the gradient!
              </Text>
            </AccentGlassCard>

            <View style={styles.successMessage}>
              <Text style={[styles.successText, { color: colors.text }]}>
                ✅ Gradient background successfully integrated into HomeScreen!
              </Text>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                • Purple-blue gradient matches your reference image
                {'\n'}• Android-optimized glassmorphism cards
                {'\n'}• No iOS-specific dependencies
                {'\n'}• Perfect white/purple glass effects
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PurpleBlueGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screen.paddingHorizontal,
    paddingVertical: Spacing['4xl'],
    gap: Spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
    lineHeight: 24,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
  },
  successMessage: {
    marginTop: Spacing['2xl'],
    padding: Spacing.xl,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default BackgroundTestScreen;