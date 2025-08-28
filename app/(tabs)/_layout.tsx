import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Custom Add Goal button component with navigation
function AddGoalTabButton(props: any) {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to homescreen first with transition parameter to trigger fade out animation
    // This ensures consistent transition experience from any tab (plan, report, home)
    router.push('/(tabs)?transition=plus-button');
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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.tabIconDefault,
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 28 : 24} 
              name="house.fill" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: '일정',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 28 : 24} 
              name="calendar" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: '리포트',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 28 : 24} 
              name="chart.bar" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-goal"
        options={{
          title: 'Add Goal',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 28 : 24} 
              name="plus" 
              color={color} 
            />
          ),
          tabBarButton: () => <AddGoalTabButton />,
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
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
