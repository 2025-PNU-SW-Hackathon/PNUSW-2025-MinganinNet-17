import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard, { PrimaryGlassCard, SecondaryGlassCard, AccentGlassCard, withGlassCard } from './GlassCard';
import GradientBackground, { PurpleBlueGradient } from './GradientBackground';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

/**
 * Example component demonstrating various GlassCard usage patterns
 * This is for reference - not used in the main app
 */
export const GlassCardExamples: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <PurpleBlueGradient style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={[styles.title, { color: colors.text }]}>
          White/Purple Glassmorphism Examples
        </Text>
        
        {/* Basic Usage */}
        <GlassCard blur="medium" opacity="medium" variant="secondary">
          <Text style={[styles.cardTitle, { color: colors.text }]}>Basic GlassCard</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Enhanced white/purple glassmorphism effect with gradient background.
          </Text>
        </GlassCard>

        {/* Primary Variant */}
        <PrimaryGlassCard blur="strong" opacity="light">
          <Text style={[styles.cardTitle, { color: colors.text }]}>Primary GlassCard</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Strong blur with light opacity creates a prominent glass effect.
          </Text>
        </PrimaryGlassCard>

        {/* Accent Variant */}
        <AccentGlassCard 
          blur="subtle" 
          opacity="medium"
          onPress={() => console.log('Accent card pressed')}
          accessibilityLabel="Accent card example"
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Interactive Accent Card</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Subtle blur with purple tinting for gentle emphasis and interaction.
          </Text>
        </AccentGlassCard>

        {/* Different Blur Levels */}
        <View style={styles.blurExamples}>
          <GlassCard blur="subtle" opacity="medium" style={styles.smallCard}>
            <Text style={[styles.smallText, { color: colors.text }]}>Subtle Blur</Text>
          </GlassCard>
          
          <GlassCard blur="medium" opacity="medium" style={styles.smallCard}>
            <Text style={[styles.smallText, { color: colors.text }]}>Medium Blur</Text>
          </GlassCard>
          
          <GlassCard blur="strong" opacity="medium" style={styles.smallCard}>
            <Text style={[styles.smallText, { color: colors.text }]}>Strong Blur</Text>
          </GlassCard>
        </View>

        {/* Different Opacity Levels */}
        <View style={styles.opacityExamples}>
          <GlassCard blur="medium" opacity="light" style={styles.smallCard}>
            <Text style={[styles.smallText, { color: colors.text }]}>Light</Text>
          </GlassCard>
          
          <GlassCard blur="medium" opacity="medium" style={styles.smallCard}>
            <Text style={[styles.smallText, { color: colors.text }]}>Medium</Text>
          </GlassCard>
          
          <GlassCard blur="medium" opacity="dark" style={styles.smallCard}>
            <Text style={[styles.smallText, { color: colors.text }]}>Dark</Text>
          </GlassCard>
        </View>
      </View>
    </PurpleBlueGradient>
  );
};

// Example of Higher-Order Component usage
const ExampleComponent: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardText}>{content}</Text>
  </View>
);

export const WrappedExampleComponent = withGlassCard(ExampleComponent, {
  variant: 'primary',
  blur: 'medium',
  opacity: 'light',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  blurExamples: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  opacityExamples: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  smallCard: {
    flex: 1,
    padding: Spacing.md,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default GlassCardExamples;