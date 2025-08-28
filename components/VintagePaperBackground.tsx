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
      
      {/* Enhanced Multi-Layer Paper Texture System */}
      
      {/* Paper fiber grain - diagonal pattern */}
      <View style={[styles.paperFibers, isDark && styles.paperFibersDark]} />
      
      {/* Paper noise - speckled texture for imperfections */}
      <View style={[styles.paperNoise, isDark && styles.paperNoiseDark]} />
      
      {/* Paper weave - cross-hatch fiber pattern */}
      <View style={[styles.paperWeave, isDark && styles.paperWeaveDark]} />
      
      {/* Vintage patina - aging effects */}
      <View style={[styles.vintagePatina, isDark && styles.vintagePatinaDark]} />
      
      {/* Legacy grain overlay - enhanced */}
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
  
  // Enhanced Paper Fiber Grain - Diagonal Pattern
  paperFibers: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08, // More visible for authentic paper feel
    backgroundColor: 'transparent',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: 'rgba(209, 169, 128, 0.3)', // Warm beige fiber lines
    borderBottomColor: 'rgba(229, 224, 216, 0.2)',
    transform: [{ rotate: '45deg' }, { scale: 1.5 }], // Diagonal grain pattern
  },
  paperFibersDark: {
    borderTopColor: 'rgba(116, 136, 115, 0.25)', // Sage green fibers
    borderBottomColor: 'rgba(143, 160, 135, 0.15)',
  },
  
  // Paper Noise - Speckled Texture for Imperfections
  paperNoise: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    // Simulate paper speckles using background pattern
    backgroundColor: 'rgba(209, 169, 128, 0.1)',
    // Create noise effect using multiple small gradients
    borderRadius: 1,
    borderWidth: 0.25,
    borderColor: 'rgba(229, 224, 216, 0.3)',
  },
  paperNoiseDark: {
    backgroundColor: 'rgba(116, 136, 115, 0.08)',
    borderColor: 'rgba(143, 160, 135, 0.2)',
  },
  
  // Paper Weave - Cross-hatch Fiber Pattern
  paperWeave: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
    borderLeftWidth: 0.25,
    borderRightWidth: 0.25,
    borderLeftColor: 'rgba(209, 169, 128, 0.4)',
    borderRightColor: 'rgba(229, 224, 216, 0.3)',
    transform: [{ rotate: '-45deg' }, { scale: 1.2 }], // Cross-grain effect
  },
  paperWeaveDark: {
    borderLeftColor: 'rgba(116, 136, 115, 0.3)',
    borderRightColor: 'rgba(143, 160, 135, 0.2)',
  },
  
  // Vintage Patina - Aging Effects
  vintagePatina: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'rgba(209, 169, 128, 0.08)', // Subtle aging discoloration
    // Create uneven aging pattern
    borderTopLeftRadius: 50,
    borderBottomRightRadius: 30,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 40,
  },
  vintagePatinaDark: {
    backgroundColor: 'rgba(95, 111, 94, 0.06)', // Dark aged paper effect
  },
  
  // Enhanced grain overlay
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06, // Increased from 0.02 for better visibility
    backgroundColor: '#d1a980', // Warm beige overlay for paper feel
    // Add subtle texture variation
    borderWidth: 0.1,
    borderColor: 'rgba(229, 224, 216, 0.5)',
  },
  
  grainOverlayDark: {
    opacity: 0.08, // Increased from 0.03
    backgroundColor: '#5f6f5e', // Dark sage overlay
    borderColor: 'rgba(143, 160, 135, 0.4)',
  },
});

export default VintagePaperBackground;