import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface WeekNavigatorProps {
  currentWeekIndex: number;
  currentWeekReportGenerated: boolean;
  weeklyReportsLength: number;
  onNavigate: (index: number) => void;
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
  // const canGoNext = currentWeekReportGenerated ? currentWeekIndex > -1 : currentWeekIndex > 0;
  const canGoNext = currentWeekIndex > 0;
  
  return (
    <View style={styles.weekNavigatorContainer}>
      <TouchableOpacity 
        style={[
          styles.weekNavButton, 
          !canGoPrevious && styles.weekNavButtonDisabled
        ]}
        onPress={() => canGoPrevious && onNavigate(currentWeekIndex + 1)}
        disabled={!canGoPrevious}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.weekNavButtonText, 
          { color: Colors[colorScheme ?? 'light'].text },
          !canGoPrevious && styles.weekNavButtonTextDisabled
        ]}>
          ← 이전 리포트
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.weekNavButton, 
          !canGoNext && styles.weekNavButtonDisabled
        ]}
        onPress={() => canGoNext && onNavigate(currentWeekIndex - 1)}
        disabled={!canGoNext}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.weekNavButtonText, 
          { color: Colors[colorScheme ?? 'light'].text },
          !canGoNext && styles.weekNavButtonTextDisabled
        ]}>
          다음 리포트 →
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
