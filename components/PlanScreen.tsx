import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import { koreanTextStyle } from '../utils/koreanUtils';
import WeekCalendarStrip from './WeekCalendarStrip';
import TimelineEvent from './TimelineEvent';
import { sampleScheduleEvents, sampleWeekData } from '../types/schedule';

export default function PlanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(colors);

  const handleDateSelect = (date: number) => {
    console.log('Selected date:', date);
    // Handle date selection logic here
  };

  const handleEventPress = (eventId: string) => {
    console.log('Pressed event:', eventId);
    // Handle event press logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Korean Date */}
        <View style={styles.headerContainer}>
          <Text style={[styles.dateHeader, koreanTextStyle('2025년 8월')]}>
            <Text style={styles.dateHighlight}>2025년 </Text>
            8월
          </Text>
        </View>

        {/* Week Calendar Strip */}
        <WeekCalendarStrip 
          weekData={sampleWeekData}
          onDateSelect={handleDateSelect}
        />

        {/* Timeline Events */}
        <View style={styles.timelineContainer}>
          {sampleScheduleEvents.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              isFirst={index === 0}
              isLast={index === sampleScheduleEvents.length - 1}
              onPress={() => handleEventPress(event.id)}
            />
          ))}
        </View>

        {/* Bottom spacing for scrolling */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  dateHeader: {
    fontSize: colors.typography.fontSize['2xl'],
    fontWeight: '600' as any,
    color: colors.text,
    fontFamily: 'sans-serif',
  },
  dateHighlight: {
    color: colors.primary, // Green highlight for year
  },
  timelineContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  bottomSpacing: {
    height: 100, // Extra space at bottom for comfortable scrolling
  },
});