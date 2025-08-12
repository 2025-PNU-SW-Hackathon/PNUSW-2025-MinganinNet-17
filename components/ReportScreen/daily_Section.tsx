import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ReportCard } from './components/daily_ReportCard';

interface DailyReportSectionProps {
  todayReport: ReportFromSupabase | null;
  historicalReports: ReportFromSupabase[];
  isLoading: boolean;
  onCreateReport: () => void;
}

export const DailyReportSection = ({ 
  todayReport, 
  historicalReports, 
  isLoading, 
  onCreateReport 
}: DailyReportSectionProps) => {
  const colorScheme = useColorScheme();

  const CreateReportPrompt = () => {
    return (
      <TouchableOpacity 
        style={[
          styles.createReportCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}
        onPress={onCreateReport}
        activeOpacity={0.7}
      >
        <View style={styles.createReportContent}>
          {/* Semi-transparent Plus Icon */}
          <View style={styles.createReportIconContainer}>
            <Text style={[styles.createReportIcon, { color: Colors[colorScheme ?? 'light'].text }]}>
              +
            </Text>
          </View>
          
          {/* Semi-transparent Text */}
          <Text style={[styles.createReportText, { color: Colors[colorScheme ?? 'light'].text }]}>
            하루가 끝나면, 오늘의 일간 리포트를 생성해보세요.
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.contentContainer}>
        <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>리포트 로딩 중...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.dailyReportContainer}>
      {/* Sticky Today's Report Card - Conditional Rendering */}
      <View style={styles.stickyHeaderContainer}>
        {todayReport ? (
          <ReportCard data={todayReport} isToday={true} />
        ) : (
          <CreateReportPrompt />
        )}
      </View>

      {/* Scrollable History Section */}
      <View style={styles.historyContainer}>
        <Text style={[styles.historyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          지난 리포트
        </Text>
        <FlatList
          data={historicalReports}
          renderItem={({ item }) => <ReportCard data={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          style={styles.historyList}
          contentContainerStyle={styles.historyListContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dailyReportContainer: {
    flex: 1,
  },
  stickyHeaderContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 4,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  contentContainer: {
    paddingHorizontal: 24,
    gap: 16,
    flex: 1,
  },
  // Create Report Prompt Styles
  createReportCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  createReportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  createReportIconContainer: {
    marginRight: 16,
  },
  createReportIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    opacity: 0.5, // Semi-transparent
  },
  createReportText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.5, // Semi-transparent
    flex: 1,
    textAlign: 'center',
  },
});
