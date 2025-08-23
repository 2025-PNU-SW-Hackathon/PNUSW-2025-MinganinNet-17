import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Base glassmorphism tab button component
function GlassTabButton({ 
  backgroundColor, 
  children, 
  ...props 
}: { 
  backgroundColor: string; 
  children: React.ReactNode; 
  [key: string]: any; 
}) {
  const isActive = props.accessibilityState?.selected;
  const baseColor = isActive ? backgroundColor : backgroundColor + '80'; // 50% opacity for inactive
  
  return (
    <TouchableOpacity
      {...props}
      style={[
        styles.glassTab,
        {
          elevation: isActive ? 2 : 6, // Pressed down vs floating
          transform: [{ scale: isActive ? 0.98 : 1.0 }], // Slight scale down for active
        },
        isActive && styles.glassTabActive
      ]}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.();
      }}
    >
      <LinearGradient
        colors={[
          baseColor + 'F5', // 96% opacity at top
          baseColor + 'E8', // 91% opacity at bottom
        ]}
        style={styles.glassGradient}
      >
        <View style={styles.glassTabContent}>
          {children}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Home tab with beige glass background
function HomeTabButton(props: any) {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].neutral[200];
  
  return (
    <GlassTabButton backgroundColor={backgroundColor} {...props}>
      {props.children}
    </GlassTabButton>
  );
}

// Home tab with warm tan glass background
function HomeTabButtonNew(props: any) {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].neutral[300];
  
  return (
    <GlassTabButton backgroundColor={backgroundColor} {...props}>
      {props.children}
    </GlassTabButton>
  );
}

// Report tab with muted brown glass background
function ReportTabButton(props: any) {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].neutral[400];
  
  return (
    <GlassTabButton backgroundColor={backgroundColor} {...props}>
      {props.children}
    </GlassTabButton>
  );
}

// Custom tab button component for the Add Goal button with navigation
function AddGoalTabButton(props: any) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const backgroundColor = Colors[colorScheme ?? 'light'].primary;

  const handlePress = () => {
    // Add haptic feedback for better UX
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to goal-setting screen
    router.push('/goal-setting');
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.glassTab,
        styles.addGoalButton,
        { 
          elevation: 8, // Prominent but not floating like inactive tabs
        }
      ]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <LinearGradient
        colors={[
          backgroundColor + 'F5', // 96% opacity at top
          backgroundColor + 'E8', // 91% opacity at bottom
        ]}
        style={styles.glassGradient}
      >
        <View style={styles.glassTabContent}>
          <Text style={styles.plusEmoji}>
            ➕
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#ffffff',
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          height: 85,
          paddingBottom: 15,
          paddingTop: 8,
          paddingHorizontal: 4,
          backgroundColor: 'rgba(248, 248, 248, 0.92)', // Android-optimized glass effect
          borderTopWidth: 0,
          elevation: 12, // Android glass container elevation
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 4,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          marginHorizontal: 1,
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
          tabBarButton: HomeTabButton,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 28 : 24} 
              name="calendar" 
              color={color} 
            />
          ),
          tabBarButton: HomeTabButtonNew,
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
          tabBarButton: ReportTabButton,
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

    </Tabs>
  );
}

const styles = StyleSheet.create({
  glassTab: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 1,
    borderRadius: 8,
    overflow: 'hidden', // Ensure gradient doesn't overflow
    // Base shadow for all tabs
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  glassGradient: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassTabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassTabActive: {
    // Active tabs have stronger shadow (pressed down effect)
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addGoalButton: {
    justifyContent: 'center',
    alignItems: 'center',
    // Special styling for add goal button
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  plusEmoji: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 18,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
