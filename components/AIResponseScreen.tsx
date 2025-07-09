import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMessage } from '../backend/hwirang/gemini';

export default function AIResponseScreen() {
  const [selectedStyle, setSelectedStyle] = useState<'kind' | 'aggressive' | 'boyfriend'>('kind');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAIResponse = async () => {
    setIsLoading(true);
    setAiResponse('');

    try {
      const aiResponse = await sendMessage(selectedStyle);
      setAiResponse(aiResponse);
    } catch (error) {
      Alert.alert('오류', 'AI 응답을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setAiResponse('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>습관 관리 경고 메시지</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>경고 메시지 스타일 선택</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, selectedStyle === 'kind' && styles.optionButtonSelected]}
              onPress={() => setSelectedStyle('kind')}
              disabled={isLoading}
            >
              <Text style={[styles.optionButtonText, selectedStyle === 'kind' && styles.optionButtonTextSelected]}>친절함</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, selectedStyle === 'aggressive' && styles.optionButtonSelected]}
              onPress={() => setSelectedStyle('aggressive')}
              disabled={isLoading}
            >
              <Text style={[styles.optionButtonText, selectedStyle === 'aggressive' && styles.optionButtonTextSelected]}>공격적</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, selectedStyle === 'boyfriend' && styles.optionButtonSelected]}
              onPress={() => setSelectedStyle('boyfriend')}
              disabled={isLoading}
            >
              <Text style={[styles.optionButtonText, selectedStyle === 'boyfriend' && styles.optionButtonTextSelected]}>남친룩</Text>
            </TouchableOpacity>

          </View>
          <Text style={styles.description}>
            제한된 앱에 접근했을 때 사용자에게 보낼 경고 메시지를 생성합니다. 옵션에 따라 메시지의 말투와 분위기가 달라집니다.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={getAIResponse}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>경고 메시지 생성</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={clearAll}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>초기화</Text>
            </TouchableOpacity>
          </View>
        </View>
        {aiResponse && (
          <View style={styles.responseSection}>
            <Text style={styles.sectionTitle}>AI 경고 메시지</Text>
            <View style={styles.responseContainer}>
              <Text style={styles.responseText}>{aiResponse}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'white',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  optionButtonTextSelected: {
    color: 'white',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  responseSection: {
    marginTop: 8,
  },
  responseContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
}); 