import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function PlanScreen() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Plan
          </Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Your goal planning dashboard
          </Text>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Goal Planning
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              View and manage your scheduled sub-goals, track progress, and adjust your plan.
            </Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Calendar Integration
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              See your goals scheduled on the calendar with smart conflict resolution.
            </Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Time Management
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Optimize your available time windows and manage goal dependencies.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  contentContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  placeholderCard: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 