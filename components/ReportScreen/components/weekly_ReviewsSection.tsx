import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface WeeklyReportData {
  id: string;
  weekStart: string;
  weekEnd: string;
  daysCompleted: number;
  insights: string;
  averageScore: number;
  dailyScores: number[];
}

interface ReviewsSectionProps {
  data: WeeklyReportData;
}

const stripOuterBracketsAndQuotes = (text: string): string => {
  if (!text) return '';
  let result = text.trim();
  if (result.startsWith('[') && result.endsWith(']')) {
    result = result.slice(1, -1).trim();
  }
  if (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'"))
  ) {
    result = result.slice(1, -1).trim();
  }
  return result;
};

export const ReviewsSection = ({ data }: ReviewsSectionProps) => {
  const colorScheme = useColorScheme();
  const averagePercentage = Math.round((data.averageScore / 10) * 100);
  const completedTasks = data.daysCompleted;
  
  return (
    <View style={[styles.reviewsSection, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        주간 리포트
      </Text>
      
      <View style={styles.reviewsGrid}>
        <View style={styles.reviewsColumn}>
          <Text style={[styles.reviewsLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            평균 점수
          </Text>
          <Text style={[styles.reviewsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {data.averageScore.toFixed(1)}
          </Text>
        </View>
        
        <View style={styles.reviewsColumn}>
          <Text style={[styles.reviewsLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            완료된 일수
          </Text>
          <Text style={[styles.reviewsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {completedTasks}
          </Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${averagePercentage}%`,
                backgroundColor: '#4CAF50'
              }
            ]} 
          />
        </View>
      </View>
      
      {/* AI Report Section */}
      <View style={styles.aiReportContainer}>
        <Text style={[styles.aiReportLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
          Routy의 코멘트
        </Text>
        <View style={[styles.aiReportContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          {data.insights && data.insights.trim().length > 0 ? (
            <Text style={[styles.aiReportText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {stripOuterBracketsAndQuotes(data.insights)}
            </Text>
          ) : (
            <Text style={[styles.aiReportText, { color: Colors[colorScheme ?? 'light'].icon }]}>코멘트가 없습니다</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewsSection: {
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
  reviewsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  reviewsColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  reviewsLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  reviewsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiReportContainer: {
    marginTop: 20,
  },
  aiReportLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  aiReportContent: {
    padding: 16,
    borderRadius: 12,
    minHeight: 240,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  aiReportText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
});
