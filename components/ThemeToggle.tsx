import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeToggleProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ onThemeChange }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const toggleTheme = async () => {
    const newTheme = colorScheme === 'light' ? 'dark' : 'light';
    
    try {
      await AsyncStorage.setItem('theme_preference', newTheme);
      onThemeChange?.(newTheme);
      
      // Force app reload to apply theme changes
      // In a real app, you'd use a context provider for instant updates
      if (global.location) {
        global.location.reload();
      }
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleTheme}>
      <View style={styles.toggle}>
        <View style={[styles.option, colorScheme === 'light' && styles.activeOption]}>
          <Text style={[styles.optionText, colorScheme === 'light' && styles.activeText]}>
            ☀️
          </Text>
        </View>
        <View style={[styles.option, colorScheme === 'dark' && styles.activeOption]}>
          <Text style={[styles.optionText, colorScheme === 'dark' && styles.activeText]}>
            🌙
          </Text>
        </View>
      </View>
      <Text style={styles.label}>
        {colorScheme === 'light' ? 'Light Mode' : 'Dark Mode'}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 4,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
  },
  activeText: {
    // Keep emoji visible
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});