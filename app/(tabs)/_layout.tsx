import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Simple Figma-style tab button component
function FigmaTabButton(props: any) {
  const isActive = props.accessibilityState?.selected;
  
  return (
    <TouchableOpacity
      {...props}
      style={styles.figmaTab}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.();
      }}
    >
      <View style={styles.figmaTabContent}>
        {props.children}
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.figma.darkGray,
        tabBarInactiveTintColor: colors.figma.darkGray,
        headerShown: false,
        tabBarStyle: {
          height: 84,
          backgroundColor: colors.figma.menuBg,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 8,
          paddingHorizontal: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          fontFamily: 'Karla',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="house.fill" 
              color={color} 
            />
          ),
          tabBarButton: FigmaTabButton,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: '리포트',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="chart.bar.fill" 
              color={color} 
            />
          ),
          tabBarButton: FigmaTabButton,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: '일정',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="calendar" 
              color={color} 
            />
          ),
          tabBarButton: FigmaTabButton,
        }}
      />
      <Tabs.Screen
        name="consultation"
        options={{
          title: 'Routy와 상담',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="message.fill" 
              color={color} 
            />
          ),
          tabBarButton: FigmaTabButton,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  figmaTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  figmaTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
