import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface ProgressCircleProps {
  progress?: number; // 0 to 1, or undefined for empty circle
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ 
  progress, 
  size = 24, 
  strokeWidth = 2,
  color 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors, size, strokeWidth);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = progress ? circumference * (1 - progress) : circumference;
  
  const progressColor = color || colors.primary;

  return (
    <View style={styles.container}>
      {/* Background circle */}
      <View style={[
        styles.circle,
        { 
          borderColor: colors.border,
          borderWidth: strokeWidth
        }
      ]} />
      
      {/* Progress circle (if progress is defined) */}
      {progress !== undefined && (
        <View style={[
          styles.circle,
          styles.progressCircle,
          {
            borderColor: progressColor,
            borderWidth: strokeWidth,
            transform: [{ rotate: '-90deg' }]
          }
        ]}>
          {/* This would need SVG for proper circular progress, for now using simple border */}
          <View style={[
            styles.progressFill,
            {
              backgroundColor: progressColor,
              width: size * progress,
              height: size * progress,
            }
          ]} />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: typeof Colors.light, size: number, strokeWidth: number) => StyleSheet.create({
  container: {
    width: size,
    height: size,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: 'transparent',
  },
  progressCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    borderRadius: size / 2,
    opacity: 0.2,
  },
});

export default ProgressCircle;