import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeeklyReportFromSupabase } from '../../../../backend/supabase/reports';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

interface WeeklyReportStep2Props {
  step1Data: any;
  onComplete: (report: WeeklyReportFromSupabase) => void;
  onBack: () => void;
}

export default function WeeklyReportStep2({ 
  step1Data, 
  onComplete, 
  onBack 
}: WeeklyReportStep2Props) {
  const colorScheme = useColorScheme();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Set report as generated and stay in weekly_create to show results
          setTimeout(() => {
            // step1Data에서 생성된 리포트를 사용
            onComplete(step1Data);
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [onComplete, step1Data]);

  return (
    <View style={styles.generatingContent}>
      <View style={styles.loadingContainer}>
        <View style={styles.circularProgressContainer}>
          {/* Background Circle */}
          <View style={styles.circularProgressTrack} />
          
          {/* Progress Circle using strokeDasharray technique */}
          <View 
            style={[
              styles.circularProgressBar,
              {
                transform: [{ rotate: '-90deg' }]
              }
            ]}
          >
            <View 
              style={[
                styles.circularProgressFill,
                {
                  borderTopWidth: loadingProgress >= 25 ? 6 : (loadingProgress * 6 / 25),
                  borderRightWidth: loadingProgress >= 50 ? 6 : Math.max(0, (loadingProgress - 25) * 6 / 25),
                  borderBottomWidth: loadingProgress >= 75 ? 6 : Math.max(0, (loadingProgress - 50) * 6 / 25),
                  borderLeftWidth: loadingProgress >= 100 ? 6 : Math.max(0, (loadingProgress - 75) * 6 / 25),
                  borderTopColor: loadingProgress > 0 ? '#4CAF50' : 'transparent',
                  borderRightColor: loadingProgress > 25 ? '#4CAF50' : 'transparent',
                  borderBottomColor: loadingProgress > 50 ? '#4CAF50' : 'transparent',
                  borderLeftColor: loadingProgress > 75 ? '#4CAF50' : 'transparent',
                }
              ]}
            />
          </View>
          
          {/* Content */}
          <View style={styles.circularProgressContent}>
            <Text style={styles.loadingIcon}>📊</Text>
            <Text style={[styles.loadingTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              리포트 생성중...
            </Text>
          </View>
        </View>
        <Text style={[styles.loadingSubtext, { color: Colors[colorScheme ?? 'light'].icon }]}>
          이번 주의 데이터를 분석하고 있습니다
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${loadingProgress}%`,
                  backgroundColor: Colors[colorScheme ?? 'light'].tint
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: Colors[colorScheme ?? 'light'].icon }]}>
            {loadingProgress}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  generatingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  circularProgressContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  circularProgressTrack: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  circularProgressBar: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  circularProgressFill: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: 'transparent',
  },
  circularProgressContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
});
