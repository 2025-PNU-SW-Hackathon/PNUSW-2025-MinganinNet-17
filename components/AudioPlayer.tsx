import { Audio } from 'expo-av';
import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { generateWebSpeech, stopWebSpeech } from '../backend/hwirang/geminiAudio';
import { PlatformSupport } from '../utils/platformUtils';
import { pcmToWavDataUri } from '../utils/audioUtils';

interface AudioPlayerProps {
  audioData?: string; // Base64 encoded PCM audio data from Gemini
  audioMimeType?: string; // MIME type of the audio data
  text?: string;
  onPlaybackStatusChange?: (isPlaying: boolean) => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

export default function AudioPlayer({
  audioData,
  audioMimeType,
  text,
  onPlaybackStatusChange,
  autoPlay = false,
  showControls = true,
}: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [aiAudioData, setAiAudioData] = useState<string | undefined>();
  
  const isComponentMounted = useRef(true);

  const cleanup = async () => {
    if (soundRef.current) {
      console.log('Unloading previous sound...');
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (Platform.OS === 'web') {
        stopWebSpeech();
    }
    if(isComponentMounted.current) {
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    }
  };

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    isComponentMounted.current = true;

    return () => {
      isComponentMounted.current = false;
      cleanup();
    };
  }, []);
  
  useEffect(() => {
    if (autoPlay && (audioData || text)) {
        handlePlay();
    }
  }, [autoPlay, audioData, text]);


  const handlePlay = async () => {
    if (isPlaying) {
      await handlePause();
      return;
    }

    if (!isComponentMounted.current) return;
    setIsLoading(true);
    setError(null);
    await cleanup();

    try {
      if (audioData && audioData.length > 0 && PlatformSupport.audioRecording) {
        console.log('🎤 네이티브 오디오 재생...', {
          audioDataLength: audioData.length,
          audioMimeType: audioMimeType || 'PCM 24kHz',
          platform: Platform.OS
        });
        await playNativeAudio(audioData);
      } else if (text) {
        console.log('📢 텍스트 음성 변환 시작...');
        await playSmartTTS();
      } else {
        throw new Error('재생할 오디오나 텍스트가 없습니다.');
      }
    } catch (e: any) {
      console.error('🚨 오디오 재생 실패:', e.message);
      if (text) {
        console.log('🔄 Web TTS로 최종 fallback...');
        try {
          await playWebSpeech();
        } catch (fallbackError: any) {
          console.error('🚨 최종 TTS 오류:', fallbackError);
          if (isComponentMounted.current) setError('음성 출력 중 오류가 발생했습니다.');
        }
      } else {
        if (isComponentMounted.current) setError('오디오를 재생할 수 없습니다.');
      }
    } finally {
      if (isComponentMounted.current) setIsLoading(false);
    }
  };
  
  const playNativeAudio = async (directAudioData?: string) => {
    // 직접 전달된 오디오 데이터를 우선 사용, 없으면 state에서 가져오기
    const currentAudioData = directAudioData || aiAudioData || audioData;
    
    console.log('🔍 오디오 데이터 상태 확인:', {
      directAudioData: directAudioData ? `있음 (${directAudioData.length}자)` : '없음',
      aiAudioData: aiAudioData ? `있음 (${aiAudioData.length}자)` : '없음',
      audioData: audioData ? `있음 (${audioData.length}자)` : '없음',
      currentAudioData: currentAudioData ? `있음 (${currentAudioData.length}자)` : '없음'
    });
    
    if (!currentAudioData || currentAudioData.length === 0) {
      throw new Error('오디오 데이터가 없거나 비어있습니다.');
    }

    try {
      console.log("🎤 네이티브 PCM 데이터를 WAV로 변환 중...", {
        dataLength: currentAudioData.length,
        mimeType: audioMimeType || 'PCM 24kHz',
        sampleRate: 24000,
        preview: currentAudioData.substring(0, 50) + '...'
      });
      
      const wavDataUri = await pcmToWavDataUri(currentAudioData, 24000); // Gemini 2.5 Pro uses 24kHz
      
      if (!wavDataUri || !isComponentMounted.current) {
        throw new Error('WAV 데이터 URI 생성 실패');
      }

      console.log("✅ WAV 데이터 URI 생성 완료, 사운드 객체에 로딩 중...");
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: wavDataUri },
        { shouldPlay: true },
        (playbackStatus) => onPlaybackStatusUpdate(playbackStatus, 'native')
      );

      if (status.isLoaded) {
        soundRef.current = sound;
        if (isComponentMounted.current) {
          setIsPlaying(true);
          setDuration(status.durationMillis || 0);
          onPlaybackStatusChange?.(true);
          console.log("🎤 Gemini 2.5 Pro 네이티브 오디오 재생 시작!");
        }
      } else {
        throw new Error('네이티브 오디오 로딩 실패');
      }
    } catch (error) {
      console.error('🚨 네이티브 오디오 처리 중 오류:', error);
      throw error;
    }
  };

  const playSmartTTS = async () => {
    if (!text) throw new Error('TTS용 텍스트가 없습니다.');
    
    console.log('🎵 스마트 TTS 시작:', { textLength: text.length });
    
    // 설정된 TTS 우선순위에 따라 시도 (Gemini 2.5 Pro 우선)
    const ttsOptions = [
      { name: 'Gemini 2.5 Pro TTS', enabled: true, priority: 1 },
      { name: 'Google Cloud TTS', enabled: false, priority: 2 }, // Gemini가 더 좋으니 일단 비활성화
      { name: 'Web TTS', enabled: true, isLastResort: true, priority: 3 }
    ];
    
    for (const option of ttsOptions) {
      if (!option.enabled) continue;
      
      try {
        if (option.name === 'Gemini 2.5 Pro TTS') {
          console.log('🎤 Gemini 2.5 Pro TTS 시도...');
          const { generateNativeTTS } = await import('../backend/hwirang/geminiAudio');
          
          // Gemini의 가장 자연스러운 음성들 중 선택
          const geminiVoices = [
            'Aoede',        // 자연스럽고 친근한 음성
            'Charon',       // 정보전달에 좋은 음성
            'Puck',         // 밝고 활기찬 음성
            'Kore',         // 안정적이고 명확한 음성
          ];
          const selectedVoice = geminiVoices[Math.floor(Math.random() * geminiVoices.length)];
          
          const audioData = await generateNativeTTS(text, selectedVoice);
          
          console.log('🔍 Gemini TTS 응답 분석:', {
            audioData: audioData ? `있음 (${audioData.length}자)` : '없음',
            type: typeof audioData,
            isValid: !!(audioData && audioData.length > 0)
          });
          
          if (audioData && audioData.length > 0 && isComponentMounted.current) {
            console.log(`✅ Gemini 2.5 Pro TTS 성공 (${selectedVoice})`);
            setAiAudioData(audioData);
            
            // 오디오 데이터를 직접 전달하여 즉시 재생
            try {
              await playNativeAudio(audioData);
            } catch (error) {
              console.error('🚨 네이티브 오디오 재생 실패:', error);
              throw error;
            }
            return;
          } else {
            console.warn('⚠️ Gemini TTS에서 유효한 오디오 데이터를 받지 못함');
            throw new Error('Gemini TTS 오디오 데이터 없음');
          }
        } else if (option.name === 'Google Cloud TTS') {
          console.log('🔊 Google Cloud TTS 시도...');
          const { generateSpeechFromText } = await import('../backend/hwirang/geminiAudio');
          
          // 다양한 자연스러운 음성 옵션 중 랜덤 선택
          const naturalVoices = [
            'ko-KR-Neural2-A',  // 가장 자연스러운 여성 음성
            'ko-KR-Neural2-B',  // 자연스러운 남성 음성  
            'ko-KR-Wavenet-A',  // 고품질 여성 음성
            'ko-KR-Wavenet-C',  // 부드러운 남성 음성
          ];
          const selectedVoice = naturalVoices[Math.floor(Math.random() * naturalVoices.length)];
          
          const audioData = await generateSpeechFromText(text, selectedVoice);
          
          if (audioData && isComponentMounted.current) {
            console.log(`✅ Google Cloud TTS 성공 (${selectedVoice})`);
            setAiAudioData(audioData);
            await playGoogleTTSAudio(audioData);
            return;
          }
        } else if (option.name === 'Web TTS') {
          console.log('📢 Web TTS 시도...');
          await playWebSpeech();
          return;
        }
      } catch (error: any) {
        console.warn(`${option.name} 실패:`, error.message);
        
        // 403/429 오류면 해당 서비스 비활성화로 간주
        if (error.message.includes('403') || error.message.includes('429')) {
          console.log(`⚠️ ${option.name} 서비스 비활성화됨`);
        }
        
        // 마지막 옵션이 아니면 다음으로 계속
        if (!option.isLastResort) continue;
      }
    }
    
    throw new Error('모든 TTS 옵션이 실패했습니다.');
  };

  const playGoogleTTSAudio = async (audioData: string) => {
    if (!audioData) throw new Error('Google TTS 오디오 데이터가 없습니다.');

    try {
      console.log('🎵 Google TTS MP3 오디오 재생...');
      
      // MP3 데이터를 Blob URL로 변환
      const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (!isComponentMounted.current) return;

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (playbackStatus) => onPlaybackStatusUpdate(playbackStatus, 'native')
      );

      if (status.isLoaded) {
        soundRef.current = sound;
        if (isComponentMounted.current) {
          setIsPlaying(true);
          setDuration(status.durationMillis || 0);
          onPlaybackStatusChange?.(true);
          console.log('🎵 Google TTS 오디오 재생 시작!');
        }
      } else {
        throw new Error('Google TTS 오디오 로딩 실패');
      }
    } catch (error) {
      console.error('🚨 Google TTS 오디오 재생 중 오류:', error);
      throw error;
    }
  };

  const playWebSpeech = async () => {
    if (!text) throw new Error('TTS용 텍스트가 없습니다.');
    
    console.log('📢 Web TTS 시작 (최종 fallback):', { textLength: text.length });
    
    await generateWebSpeech(text, 'ko-KR');
    if (isComponentMounted.current) {
      setIsPlaying(true);
      onPlaybackStatusChange?.(true);

      // 더 정확한 지속 시간 추정 (한국어 기준)
      const estimatedDuration = Math.max(text.length * 110, 2500); // 약간 더 길게 (자연스러운 속도)
      console.log('⏱️ Web TTS 예상 재생 시간:', estimatedDuration + 'ms');
      
      setTimeout(() => {
          if (isPlaying && isComponentMounted.current) {
              console.log('✅ Web TTS 재생 완료');
              setIsPlaying(false);
              onPlaybackStatusChange?.(false);
          }
      }, estimatedDuration);
    }
  };
  
  const handlePause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
    } else if (Platform.OS === 'web') {
      stopWebSpeech();
    }
    if (isComponentMounted.current) {
      setIsPlaying(false);
      onPlaybackStatusChange?.(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any, type: 'native' | 'web') => {
    if (!isComponentMounted.current) return;

    if (type === 'native') {
        if (!status.isLoaded) {
            if (status.error) {
                console.error(`Audio playback error: ${status.error}`);
                setError('오디오 재생 중 오류가 발생했습니다.');
            }
            setIsPlaying(false);
        } else {
            setIsPlaying(status.isPlaying);
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
                cleanup();
                onPlaybackStatusChange?.(false);
            }
        }
    }
  };

  if (!showControls) {
    if (autoPlay && isLoading) {
        return <ActivityIndicator size="small" />;
    }
    return null;
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title={isPlaying ? "일시정지" : "재생"} onPress={handlePlay} disabled={!audioData && !text} />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {duration > 0 && (
        <View style={styles.progressContainer}>
            <Text>{new Date(position).toISOString().slice(14, 19)}</Text>
            <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${(position / duration) * 100}%` }]} />
            </View>
            <Text>{new Date(duration).toISOString().slice(14, 19)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    borderRadius: 3,
  },
  progress: {
    height: '100%',
    backgroundColor: '#007aff',
    borderRadius: 3,
  },
});
