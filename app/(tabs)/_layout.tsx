import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Custom tab button component for the Add Goal button (UI-only, no navigation)
function AddGoalTabButton(props: any) {
  const colorScheme = useColorScheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.addGoalButton,
        { backgroundColor: Colors[colorScheme ?? 'light'].tint }
      ]}
      activeOpacity={0.7}
      // No onPress - UI-only component as requested
    >
      <Text style={styles.plusEmoji}>
        ➕
      </Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme ?? 'light'].icon + '20',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
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
          title: 'Plan',
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
        name="add-goal"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => <AddGoalTabButton />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 28 : 24} 
              name="chart.bar" 
              color={color} 
            />
          ),
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  addGoalButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -32, // Elevate the button above the tab bar
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  plusEmoji: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 28,
  },
});
