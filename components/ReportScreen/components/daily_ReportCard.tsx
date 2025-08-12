import { StyleSheet, Text, View } from 'react-native';
import { ReportFromSupabase } from '../../../backend/supabase/reports';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

// Achievement score color mapping
const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';        // Green (90%+)
  if (score >= 7) return '#8BC34A';        // Light Green (70%+)
  if (score >= 5) return '#FF9800';        // Orange (50%+)
  return '#F44336';                        // Red (below 50%)
};

// Helper function to format date string
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}월 ${day}일 일간 리포트`;
};

interface ReportCardProps {
  data: ReportFromSupabase;
  isToday?: boolean;
}

export const ReportCard = ({ data, isToday = false }: ReportCardProps) => {
  const colorScheme = useColorScheme();
  const achievementColor = getAchievementColor(data.achievement_score);
  
  return (
    <View style={[
      styles.reportCard,
      isToday ? styles.todayCard : styles.historyCard,
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      {/* Date Title */}
      <Text style={[
        styles.reportCardTitle,
        isToday ? styles.todayCardTitle : styles.historyCardTitle,
        { color: Colors[colorScheme ?? 'light'].text }
      ]}>
        {formatDisplayDate(data.report_date)}
      </Text>

      {/* Achievement Rate Indicator */}
      <View style={styles.achievementContainer}>
        <View style={[
          styles.achievementBox,
          { backgroundColor: achievementColor }
        ]}>
          <Text style={styles.achievementScore}>
            {data.achievement_score}
          </Text>
        </View>
        <Text style={[styles.achievementLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
          Achievement Score
        </Text>
      </View>

      {/* AI Coach's Feedback Summary */}
      <View style={styles.feedbackContainer}>
        {data.ai_coach_feedback.map((feedback, index) => (
          <View key={index} style={styles.feedbackItem}>
            <Text style={styles.feedbackBullet}>•</Text>
            <Text style={[styles.feedbackText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {feedback}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reportCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#6c5ce7',
    marginBottom: 8,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  reportCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  todayCardTitle: {
    fontSize: 20,
    color: '#6c5ce7',
  },
  historyCardTitle: {
    fontSize: 16,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  achievementLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackContainer: {
    gap: 8,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  feedbackBullet: {
    fontSize: 16,
    color: '#6c5ce7',
    marginRight: 8,
    marginTop: 2,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
