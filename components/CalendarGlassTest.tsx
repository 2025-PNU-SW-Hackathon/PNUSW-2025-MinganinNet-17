import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SecondaryGlassCard } from './GlassCard';
import { PurpleBlueGradient } from './GradientBackground';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

/**
 * Test component to verify calendar glassmorphism integration
 */
export const CalendarGlassTest: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Mock calendar data
  const mockDates = [
    { dayName: 'MON', dayNumber: '08', isToday: false, isSelected: false },
    { dayName: 'TUE', dayNumber: '09', isToday: false, isSelected: true },
    { dayName: 'WED', dayNumber: '10', isToday: true, isSelected: false },
    { dayName: 'THU', dayNumber: '11', isToday: false, isSelected: false },
    { dayName: 'FRI', dayNumber: '12', isToday: false, isSelected: false },
  ];

  return (
    <PurpleBlueGradient style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Calendar Glass Design Test
        </Text>
        
        {/* Glass Calendar Section - Same as HomeScreen */}
        <SecondaryGlassCard
          blur="subtle"
          opacity="light"
          style={styles.calendarGlass}
          accessibilityLabel="Calendar section test"
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.calendarScroll}
            contentContainerStyle={styles.calendarContainer}
          >
            {mockDates.map((dateInfo, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDate, 
                  dateInfo.isToday && styles.calendarDateToday, 
                  dateInfo.isSelected && styles.calendarDateSelected,
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarDayName}>{dateInfo.dayName}</Text>
                <Text style={[
                  styles.calendarDayNumber, 
                  (dateInfo.isToday || dateInfo.isSelected) && styles.calendarTextActive
                ]}>
                  {dateInfo.dayNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SecondaryGlassCard>
        
        <Text style={[styles.status, { color: colors.text }]}>
          ✅ Calendar now has glassmorphism background!
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>
          • Glass background with subtle blur{'\n'}
          • Extends to screen edges{'\n'}
          • Individual dates maintain contrast{'\n'}
          • Comments removed from code
        </Text>
      </View>
    </PurpleBlueGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.screen.paddingHorizontal,
    paddingTop: Spacing['4xl'],
    justifyContent: 'center',
    gap: Spacing['2xl'],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  details: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Calendar Glass Styles - Match HomeScreen
  calendarGlass: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  calendarScroll: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  calendarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  calendarDate: {
    width: 64,
    height: 88,
    borderRadius: Spacing.layout.borderRadius.lg,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.light.neutral[100],
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: Spacing.md,
    elevation: 2,
  },
  calendarDateToday: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primaryLight,
    borderWidth: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: Spacing.lg,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  calendarDateSelected: {
    borderWidth: 2.5,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryOpacity[10],
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: Spacing.md,
    elevation: 3,
    transform: [{ scale: 1.02 }],
  },
  calendarDayName: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  calendarDayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  calendarTextActive: {
    color: '#ffffff',
  },
});

export default CalendarGlassTest;