import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Profile
          </Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Your account and personalization settings
          </Text>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Account Settings
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Manage your account information, email, and authentication settings.
            </Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              AI Coach Personality
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Customize your AI coach's personality, coaching style, and intensity level.
            </Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Notification Preferences
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Control how and when you receive notifications about your goals and progress.
            </Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              App Restrictions
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Manage which apps should be restricted during your goal-focused time.
            </Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Data & Privacy
            </Text>
            <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Control your data sharing preferences and privacy settings.
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