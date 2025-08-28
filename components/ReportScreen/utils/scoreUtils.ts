import { Colors } from '../../../constants/Colors';

export interface ScoreStatus {
  label: string;
  color: string;
  backgroundColor: string;
  description: string;
}

/**
 * Get score status information based on achievement score
 * Maps score ranges to Korean status labels with appropriate theme colors
 */
export const getScoreStatus = (score: number, colorScheme: 'light' | 'dark' = 'light'): ScoreStatus => {
  const colors = Colors[colorScheme];
  
  if (score >= 9) {
    return {
      label: '훌륭해요',
      color: colors.success,
      backgroundColor: colors.success,
      description: '목표를 완벽하게 달성했어요!'
    };
  }
  
  if (score >= 7.5) {
    return {
      label: '좋아요',
      color: colors.primary,
      backgroundColor: colors.primary,
      description: '목표를 잘 달성하고 있어요!'
    };
  }
  
  if (score >= 6) {
    return {
      label: '보통이에요',
      color: colors.warning,
      backgroundColor: colors.warning,
      description: '조금 더 노력하면 좋겠어요!'
    };
  }
  
  return {
    label: '아쉬워요',
    color: colors.error,
    backgroundColor: colors.error,
    description: '다음 주는 더 잘할 수 있을 거예요!'
  };
};

/**
 * Format score for display with proper decimal places
 */
export const formatScore = (score: number): string => {
  return score.toFixed(1);
};

/**
 * Get achievement percentage from score (assumes max score is 10)
 */
export const getAchievementPercentage = (score: number): number => {
  return Math.round((score / 10) * 100);
};

/**
 * Generate chart data from weekly report data
 * Creates a 3-month view as shown in the Figma design
 */
export const generateChartData = (
  dailyScores: number[],
  weekStart: string
): { dates: string[]; scores: number[]; averageScore: number } => {
  // For the Figma design, we show 3 data points representing monthly trends
  // This simulates the "JUN 22", "JUL 22", "AUG 19" view
  const monthlyData = [
    { date: 'JUN 22', score: 7.8 },
    { date: 'JUL 22', score: 8.9 },
    { date: 'AUG 19', score: 8.3 }
  ];
  
  // If we have actual daily scores, use the recent ones to simulate monthly trend
  if (dailyScores.length >= 3) {
    monthlyData[2].score = dailyScores[dailyScores.length - 1]; // Most recent
    monthlyData[1].score = dailyScores.length >= 5 ? dailyScores[dailyScores.length - 3] : 8.9;
    monthlyData[0].score = dailyScores.length >= 7 ? dailyScores[dailyScores.length - 5] : 7.8;
  }
  
  const dates = monthlyData.map(item => item.date);
  const scores = monthlyData.map(item => item.score);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  return {
    dates,
    scores,
    averageScore
  };
};

/**
 * Get color for score value in chart
 */
export const getScoreColor = (score: number, colorScheme: 'light' | 'dark' = 'light'): string => {
  const colors = Colors[colorScheme];
  
  if (score >= 8.5) return colors.success;
  if (score >= 7.5) return colors.primary;
  if (score >= 6) return colors.warning;
  return colors.error;
};