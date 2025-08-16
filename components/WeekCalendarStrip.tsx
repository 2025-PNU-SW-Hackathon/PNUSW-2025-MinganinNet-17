import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import { koreanTextStyle } from '../utils/koreanUtils';
import { DayData } from '../types/schedule';

interface WeekCalendarStripProps {
  weekData: DayData[];
  onDateSelect?: (date: number) => void;
}

const WeekCalendarStrip: React.FC<WeekCalendarStripProps> = ({ weekData, onDateSelect }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const renderEventIndicators = (indicators: Array<'red' | 'blue' | 'green'>) => {
    return (
      <View style={styles.indicatorsContainer}>
        {indicators.map((color, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: color === 'red' ? colors.error : 
                               color === 'green' ? colors.success : 
                               colors.info
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {weekData.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dayContainer}
            onPress={() => onDateSelect?.(day.date)}
            activeOpacity={0.7}
          >
            {/* Day of week */}
            <Text style={[styles.dayOfWeek, koreanTextStyle(day.dayOfWeek)]}>
              {day.dayOfWeek}
            </Text>
            
            {/* Date number */}
            <View style={[
              styles.dateCircle,
              day.isToday && styles.todayCircle
            ]}>
              <Text style={[
                styles.dateNumber,
                day.isToday && styles.todayDateNumber
              ]}>
                {day.date}
              </Text>
            </View>
            
            {/* Event indicators */}
            {day.hasEvents && renderEventIndicators(day.eventIndicators)}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  dayContainer: {
    alignItems: 'center',
    minWidth: 50,
    paddingVertical: Spacing.sm,
  },
  dayOfWeek: {
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.regular,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'sans-serif',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: Spacing.xs,
  },
  todayCircle: {
    backgroundColor: colors.primary, // Green background for today
  },
  dateNumber: {
    fontSize: colors.typography.fontSize.lg,
    fontWeight: colors.typography.fontWeight.semibold,
    color: colors.text,
    fontFamily: 'sans-serif',
  },
  todayDateNumber: {
    color: colors.background, // White text on green background
  },
  indicatorsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default WeekCalendarStrip;