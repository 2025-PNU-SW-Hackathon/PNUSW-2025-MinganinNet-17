import { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

type ReportView = 'daily' | 'weekly';

// Mock data for historical reports
const generateHistoricalReports = () => {
  const reports = [];
  const today = new Date();
  
  // Generate 15 days of historical data (excluding today)
  for (let i = 1; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    reports.push({
      id: `report-${i}`,
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      })
    });
  }
  
  return reports;
};

export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const [selectedView, setSelectedView] = useState<ReportView>('daily');
  const historicalReports = generateHistoricalReports();

  const ViewSelector = () => {
    return (
      <View style={[styles.selectorContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedView === 'daily' 
                ? [styles.segmentButtonActive, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
                : styles.segmentButtonInactive
            ]}
            onPress={() => setSelectedView('daily')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              selectedView === 'daily' 
                ? [styles.segmentTextActive, { color: Colors[colorScheme ?? 'light'].background }]
                : [styles.segmentTextInactive, { color: Colors[colorScheme ?? 'light'].text }]
            ]}>
              일간 리포트
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedView === 'weekly' 
                ? [styles.segmentButtonActive, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
                : styles.segmentButtonInactive
            ]}
            onPress={() => setSelectedView('weekly')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              selectedView === 'weekly' 
                ? [styles.segmentTextActive, { color: Colors[colorScheme ?? 'light'].background }]
                : [styles.segmentTextInactive, { color: Colors[colorScheme ?? 'light'].text }]
            ]}>
              주간 리포트
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TodayReportCard = () => {
    return (
      <View style={[styles.todayCard, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
        <Text style={[styles.todayCardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          오늘의 리포트
        </Text>
        <View style={[styles.placeholderContent, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '40' }]}>
          <Text style={[styles.placeholderText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Today's Report Content
          </Text>
        </View>
      </View>
    );
  };

  const HistoricalReportCard = ({ item }: { item: any }) => {
    return (
      <View style={[styles.historyCard, { backgroundColor: Colors[colorScheme ?? 'light'].icon + '10' }]}>
        <Text style={[styles.historyCardDate, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.displayDate}
        </Text>
        <View style={[styles.placeholderContent, { backgroundColor: Colors[colorScheme ?? 'light'].icon + '20' }]}>
          <Text style={[styles.placeholderText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Historical Report Content
          </Text>
        </View>
      </View>
    );
  };

  const DailyReportContent = () => {
    return (
      <View style={styles.dailyReportContainer}>
        {/* Sticky Today's Report Card */}
        <View style={styles.stickyHeaderContainer}>
          <TodayReportCard />
        </View>

        {/* Scrollable History Section */}
        <View style={styles.historyContainer}>
          <Text style={[styles.historyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            지난 리포트
          </Text>
          <FlatList
            data={historicalReports}
            renderItem={HistoricalReportCard}
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

  const WeeklyReportContent = () => {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.placeholderCard}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Weekly Report Coming Soon
          </Text>
          <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Weekly report functionality will be implemented in the next phase.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* View Selector */}
      <ViewSelector />

      {/* Content based on selected view */}
      {selectedView === 'daily' ? <DailyReportContent /> : <WeeklyReportContent />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  selectorContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonInactive: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  segmentTextInactive: {
    opacity: 0.7,
  },
  // Daily Report Layout Styles
  dailyReportContainer: {
    flex: 1,
  },
  stickyHeaderContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  todayCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  todayCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
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
  historyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyCardDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderContent: {
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Legacy styles for weekly report
  contentContainer: {
    paddingHorizontal: 24,
    gap: 16,
    flex: 1,
  },
  placeholderCard: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 