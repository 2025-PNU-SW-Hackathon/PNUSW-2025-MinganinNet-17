import { StyleSheet, Text, View } from 'react-native';

// This is a placeholder screen for the Add Goal button
// The button itself is UI-only and should not navigate to this screen
export default function AddGoalTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Goal Placeholder</Text>
      <Text style={styles.subtext}>This screen should not be accessible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
}); 