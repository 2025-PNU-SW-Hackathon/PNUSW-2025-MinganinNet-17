import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface EventIconProps {
  type: 'clock' | 'list' | 'document' | 'plus' | 'settings' | 'heart' | 'filter';
  color: 'red' | 'green' | 'blue' | 'gray' | 'coral';
  size?: number;
}

const EventIcon: React.FC<EventIconProps> = ({ type, color, size = 48 }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors, size);

  const getIconName = (type: EventIconProps['type']): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'clock': return 'alarm';
      case 'list': return 'list';
      case 'document': return 'description';
      case 'plus': return 'add';
      case 'settings': return 'settings';
      case 'heart': return 'favorite';
      case 'filter': return 'filter-list';
      default: return 'circle';
    }
  };

  const getBackgroundColor = (color: EventIconProps['color']): string => {
    switch (color) {
      case 'red': return colors.error;
      case 'green': return colors.success;
      case 'blue': return colors.info;
      case 'coral': return '#ff7875'; // Coral color
      case 'gray': return colors.neutral[400];
      default: return colors.neutral[400];
    }
  };

  const getIconColor = (color: EventIconProps['color']): string => {
    // White icons for better contrast on colored backgrounds
    return colors.background;
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: getBackgroundColor(color) }
    ]}>
      <MaterialIcons
        name={getIconName(type)}
        size={size * 0.5}
        color={getIconColor(color)}
      />
    </View>
  );
};

const createStyles = (colors: typeof Colors.light, size: number) => StyleSheet.create({
  container: {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default EventIcon;