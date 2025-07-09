import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';

export default function HabitCreateScreen() {
  const [habitText, setHabitText] = useState('');

  const handleNext = () => {
    // TODO: Handle next button press
    console.log('Next button pressed with habit:', habitText);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        가장 만들고 싶은 좋은 습관은 무엇인가요?
      </ThemedText>
      <TextInput
        style={styles.input}
        value={habitText}
        onChangeText={setHabitText}
        placeholder="좋은 습관을 입력해주세요"
        placeholderTextColor={Colors.light.text + '80'}
        multiline
      />
      <Pressable 
        style={({pressed}) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
        onPress={handleNext}
      >
        <ThemedText style={styles.buttonText}>다음</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.text + '20',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 