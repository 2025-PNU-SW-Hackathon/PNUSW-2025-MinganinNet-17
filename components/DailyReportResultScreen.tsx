import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface DailyReportResultScreenProps {
  onBack: () => void;
}

export default function DailyReportResultScreen({ onBack }: DailyReportResultScreenProps) {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
            ← 뒤로
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          일간 리포트 완성
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>
          AI가 생성한 일간 리포트가 여기에 표시됩니다.
        </Text>

        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, { color: Colors[colorScheme ?? 'light'].icon }]}>
            AI 생성 리포트 화면이 여기에 구현될 예정입니다.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.completeButton}
          onPress={onBack}
        >
          <Text style={styles.completeButtonText}>
            리포트 저장 완료
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: 24,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
}); 