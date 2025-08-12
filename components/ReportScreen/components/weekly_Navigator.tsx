import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface WeekNavigatorProps {
  currentWeekIndex: number;
  currentWeekReportGenerated: boolean;
  weeklyReportsLength: number;
  onNavigate: (direction: 'previous' | 'next') => void;
}

export const WeekNavigator = ({ 
  currentWeekIndex, 
  currentWeekReportGenerated, 
  weeklyReportsLength,
  onNavigate 
}: WeekNavigatorProps) => {
  const colorScheme = useColorScheme();
  
  // Allow going to -1 (next week) when current week report is generated
  const canGoPrevious = currentWeekIndex < weeklyReportsLength - 1;
  const canGoNext = currentWeekReportGenerated ? currentWeekIndex > -1 : currentWeekIndex > 0;
  
  return (
    <View style={styles.weekNavigatorContainer}>
      <TouchableOpacity 
        style={[
          styles.weekNavButton, 
          !canGoPrevious && styles.weekNavButtonDisabled
        ]}
        onPress={() => canGoPrevious && onNavigate('previous')}
        disabled={!canGoPrevious}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.weekNavButtonText, 
          { color: Colors[colorScheme ?? 'light'].text },
          !canGoPrevious && styles.weekNavButtonTextDisabled
        ]}>
          ← 이전 주
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.weekNavButton, 
          !canGoNext && styles.weekNavButtonDisabled
        ]}
        onPress={() => canGoNext && onNavigate('next')}
        disabled={!canGoNext}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.weekNavButtonText, 
          { color: Colors[colorScheme ?? 'light'].text },
          !canGoNext && styles.weekNavButtonTextDisabled
        ]}>
          다음 주 →
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  weekNavigatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  weekNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekNavButtonDisabled: {
    opacity: 0.3,
  },
  weekNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekNavButtonTextDisabled: {
    opacity: 0.5,
  },
});
