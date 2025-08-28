import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { AnimationConfig } from '../../constants/AnimationConfig';
import { useColorScheme } from '../../hooks/useColorScheme';
import AnimatedTabBar from '../../components/AnimatedTabBar';

// Animated Tab Icon Component
interface AnimatedTabIconProps {
  name: string;
  color: string;
  focused: boolean;
  size?: number;
}

function AnimatedTabIcon({ name, color, focused, size = 24 }: AnimatedTabIconProps) {
  const scale = useSharedValue(focused ? AnimationConfig.TABS.ICONS.SCALE_SELECTED : AnimationConfig.TABS.ICONS.SCALE_UNSELECTED);
  const opacity = useSharedValue(focused ? AnimationConfig.TABS.ICONS.OPACITY_SELECTED : AnimationConfig.TABS.ICONS.OPACITY_UNSELECTED);

  useEffect(() => {
    scale.value = withTiming(
      focused ? AnimationConfig.TABS.ICONS.SCALE_SELECTED : AnimationConfig.TABS.ICONS.SCALE_UNSELECTED,
      {
        duration: AnimationConfig.TABS.ICONS.SCALE_DURATION,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }
    );
    
    opacity.value = withTiming(
      focused ? AnimationConfig.TABS.ICONS.OPACITY_SELECTED : AnimationConfig.TABS.ICONS.OPACITY_UNSELECTED,
      {
        duration: AnimationConfig.TABS.ICONS.COLOR_DURATION,
        easing: Easing.out(Easing.quad),
      }
    );
  }, [focused, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <IconSymbol 
        size={focused ? size + 4 : size} 
        name={name as any} 
        color={color} 
      />
    </Animated.View>
  );
}

// Custom Add Goal button component with navigation
function AddGoalTabButton(props: any) {
  const router = useRouter();

  const handlePress = () => {
    router.push('/goal-setting');
  };
  
  return (
    <TouchableOpacity
      style={styles.addGoalButton}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Text style={styles.plusEmoji}>➕</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focusedTabIndex, setFocusedTabIndex] = useState(0);

  // Map tab names to indices for animated tab bar
  const getTabIndex = (routeName: string): number => {
    const tabMapping = {
      'index': 0,
      'plan': 1, 
      'report': 2,
      'add-goal': 3,
    };
    return tabMapping[routeName as keyof typeof tabMapping] || 0;
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenListeners={{
          tabPress: (e) => {
            const routeName = e.target?.split('--')[0];
            if (routeName) {
              setFocusedTabIndex(getTabIndex(routeName));
            }
          },
        }}
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 0, // Remove default border since we have animated indicator
            paddingBottom: 8,
            height: 84, // Slightly taller for better visual balance
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name="house.fill"
                color={color}
                focused={focused}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plan',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name="calendar"
                color={color}
                focused={focused}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'Report',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name="chart.bar"
                color={color}
                focused={focused}
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-goal"
          options={{
            title: 'Add Goal',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name="plus"
                color={color}
                focused={focused}
                size={24}
              />
            ),
            tabBarButton: () => <AddGoalTabButton />,
          }}
        />
      </Tabs>
      
      {/* Animated Tab Indicator */}
      <AnimatedTabBar
        focusedTabIndex={focusedTabIndex}
        tabCount={4}
        backgroundColor={colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  addGoalButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusEmoji: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 18,
  },
});