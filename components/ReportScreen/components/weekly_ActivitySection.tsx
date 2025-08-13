import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

// Achievement score color mapping
const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';        // Green (90%+)
  if (score >= 7) return '#8BC34A';        // Light Green (70%+)
  if (score >= 5) return '#FF9800';        // Orange (50%+)
  return '#F44336';                        // Red (below 50%)
};

interface WeeklyReportData {
  id: string;
  weekStart: string;
  weekEnd: string;
  daysCompleted: number;
  insights: string;
  averageScore: number;
  dailyScores: number[];
}

interface ActivitySectionProps {
  data: WeeklyReportData;
}

export const ActivitySection = ({ data }: ActivitySectionProps) => {
  const colorScheme = useColorScheme();
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  return (
    <View style={[styles.activitySection, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        활동 요약
      </Text>
      
      <View style={styles.activityGrid}>
        {dayLabels.map((day, index) => {
          const score = data.dailyScores[index];
          const dayColor = score > 0 ? getAchievementColor(score) : Colors[colorScheme ?? 'light'].icon;
          
          return (
            <View key={index} style={styles.activityDay}>
              <View style={[styles.activityScoreContainer, { backgroundColor: dayColor }]}>
                <Text style={styles.activityScore}>
                  {new Date(data.weekStart).getDate() + index}
                </Text>
              </View>
              <Text style={[styles.activityDayLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activitySection: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  activityDay: {
    alignItems: 'center',
    flex: 1,
  },
  activityDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  activityScoreContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});
