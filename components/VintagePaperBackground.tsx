import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../hooks/useColorScheme';

interface VintagePaperBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const VintagePaperBackground: React.FC<VintagePaperBackgroundProps> = ({
  children,
  style,
  contentContainerStyle,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Vintage paper gradient colors
  const gradientColors = isDark
    ? [
        '#2c2c2c', // Dark charcoal
        '#353b34', // Very dark sage
        '#4a5549', // Darker sage
        '#748873', // Sage green
      ]
    : [
        '#f8f8f8', // Warm white (top)
        '#f4f2f0', // Very light warm beige
        '#e8e2d8', // Light beige (middle)
        '#e5e0d8', // Light beige (bottom)
      ];

  return (
    <View style={[styles.container, style]}>
      {/* Base gradient layer */}
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Paper texture overlay - subtle noise pattern */}
      <View style={[styles.textureOverlay, isDark && styles.textureOverlayDark]} />
      
      {/* Subtle paper grain effect */}
      <View style={[styles.grainOverlay, isDark && styles.grainOverlayDark]} />
      
      {/* Content container */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  
  // Light mode texture overlays
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: 'transparent',
    // CSS-like pattern simulation using backgroundColor and opacity
  },
  
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    backgroundColor: '#d1a980', // Warm beige overlay for paper feel
  },
  
  // Dark mode texture overlays
  textureOverlayDark: {
    opacity: 0.05,
    backgroundColor: '#748873', // Sage green texture
  },
  
  grainOverlayDark: {
    opacity: 0.03,
    backgroundColor: '#5f6f5e', // Dark sage overlay
  },
});

export default VintagePaperBackground;