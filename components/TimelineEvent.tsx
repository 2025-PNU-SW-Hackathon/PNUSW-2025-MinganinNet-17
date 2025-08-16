import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import { koreanTextStyle } from '../utils/koreanUtils';
import { ScheduleEvent } from '../types/schedule';
import EventIcon from './EventIcon';
import ProgressCircle from './ProgressCircle';

interface TimelineEventProps {
  event: ScheduleEvent;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ 
  event, 
  isFirst, 
  isLast, 
  onPress 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const renderProgressInfo = () => {
    if (!event.progress) return null;
    
    return (
      <View style={styles.progressInfo}>
        <MaterialIcons
          name="check-box-outline-blank"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.progressText}>
          {event.progress.current}/{event.progress.total}
        </Text>
        <MaterialIcons
          name="description"
          size={16}
          color={colors.textSecondary}
        />
      </View>
    );
  };

  const getCardBackgroundColor = () => {
    if (event.isHighlight) {
      return colors.success + '20'; // Light green background for highlighted events
    }
    return colors.card;
  };

  return (
    <View style={styles.container}>
      {/* Timeline line */}
      <View style={styles.timelineSection}>
        <Text style={styles.timeLabel}>{event.time}</Text>
        
        {/* Timeline line connector */}
        <View style={styles.timelineConnector}>
          {!isFirst && <View style={styles.lineUp} />}
          <EventIcon 
            type={event.iconType} 
            color={event.iconColor}
            size={event.isHighlight ? 56 : 48}
          />
          {!isLast && <View style={styles.lineDown} />}
        </View>
      </View>

      {/* Event content */}
      <TouchableOpacity
        style={[
          styles.eventCard,
          { backgroundColor: getCardBackgroundColor() },
          event.isHighlight && styles.highlightedCard
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventSubtitle, koreanTextStyle(event.subtitle || '')]}>
              {event.subtitle}
            </Text>
            <Text style={[styles.eventTitle, koreanTextStyle(event.title)]}>
              {event.title}
            </Text>
          </View>
          
          <ProgressCircle 
            progress={event.status === 'completed' ? 1 : event.progress ? event.progress.current / event.progress.total : undefined}
            color={event.status === 'completed' ? colors.success : colors.primary}
          />
        </View>

        {event.description && (
          <Text style={[styles.eventDescription, koreanTextStyle(event.description)]}>
            {event.description}
          </Text>
        )}

        {renderProgressInfo()}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
  },
  timelineSection: {
    width: 80,
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  timeLabel: {
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: Spacing.xs,
    fontFamily: 'sans-serif',
  },
  timelineConnector: {
    alignItems: 'center',
    position: 'relative',
  },
  lineUp: {
    position: 'absolute',
    top: -20,
    width: 2,
    height: 20,
    backgroundColor: colors.border,
  },
  lineDown: {
    position: 'absolute',
    bottom: -20,
    width: 2,
    height: 20,
    backgroundColor: colors.border,
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: Spacing.layout.borderRadius.lg,
    padding: Spacing.lg,
    marginLeft: Spacing.md,
    shadowColor: colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  highlightedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  eventInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  eventSubtitle: {
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.regular,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'sans-serif',
  },
  eventTitle: {
    fontSize: colors.typography.fontSize.base,
    fontWeight: colors.typography.fontWeight.semibold,
    color: colors.text,
    lineHeight: colors.typography.fontSize.base * colors.typography.lineHeight.snug,
    fontFamily: 'sans-serif',
  },
  eventDescription: {
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: colors.typography.fontSize.sm * colors.typography.lineHeight.relaxed,
    marginBottom: Spacing.sm,
    fontFamily: 'sans-serif',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressText: {
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.regular,
    color: colors.textSecondary,
    fontFamily: 'sans-serif',
  },
});

export default TimelineEvent;