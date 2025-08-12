import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import DebugNextButton from '../DebugNextButton';

interface GeneratingWeeklyReportScreenProps {
  onBack: () => void;
  onGenerationComplete: () => void;
  onDebugSkip: () => void;
}

export const GeneratingWeeklyReportScreen = ({ 
  onBack, 
  onGenerationComplete, 
  onDebugSkip 
}: GeneratingWeeklyReportScreenProps) => {
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
            onGenerationComplete();
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [onGenerationComplete]);

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

      {/* Debug Button */}
      <DebugNextButton
        to="Skip Generation"
        onPress={onDebugSkip}
        label="Debug: Skip Generation"
        disabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  generatingContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  circularProgressContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  circularProgressTrack: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  circularProgressBar: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circularProgressFill: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderColor: 'transparent',
  },
  circularProgressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  loadingIcon: {
    fontSize: 60,
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
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
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    fontFamily: 'Inter',
  },
});
