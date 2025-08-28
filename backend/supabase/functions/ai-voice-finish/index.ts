import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 헬퍼 함수들 (전체 코드)
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function convertPcmToWav(pcmData: Uint8Array, sampleRate: number): Uint8Array {
  const numChannels = 1, bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const headerSize = 44;
  const wavBufferSize = headerSize + pcmData.length;
  const wavBuffer = new ArrayBuffer(wavBufferSize);
  const view = new DataView(wavBuffer);
  view.setUint32(0, 0x52494646, false); view.setUint32(4, 36 + pcmData.length, true); view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true); view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true); view.setUint16(34, bitsPerSample, true);
  view.setUint32(36, 0x64617461, false); view.setUint32(40, pcmData.length, true);
  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(pcmData, headerSize);
  return wavBytes;
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const job = payload.record;
    const context = payload.context; // 디버그 모드 확인용 context 추가
    
    // 디버그 모드 확인
    const isDebugMode = context?.isDebugMode === true;
    console.log(`[FINISH] 작업 ${job.job_id} 시작. 텍스트: "${job.response_text}", 디버그 모드: ${isDebugMode}`);
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Gemini 2.5 Flash Preview TTS 사용 (속도 최적화)
    const ttsApiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: job.response_text }] }], 
          generationConfig: { 
            responseModalities: ["AUDIO"], 
            speechConfig: { 
              voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: "Kore" } 
              } 
            } 
          } 
        })
    });
    
    if (!ttsApiResponse.ok) {
      const errorText = await ttsApiResponse.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { code: 'unknown', message: errorText } };
      }
      
      // 429 오류 (할당량 초과) 시 특별 처리
      if (errorData.error?.code === 429) {
        console.error(`[FINISH] TTS API 할당량 초과 (429). 작업을 건너뛰고 나중에 재시도하도록 설정.`);
        
        // 작업 상태를 'retry_later'로 설정
        await supabaseAdmin
          .from('voice_processing_jobs')
          .update({ 
            status: 'retry_later', 
            error_message: 'TTS API 할당량 초과. 나중에 재시도 예정.' 
          })
          .eq('job_id', job.job_id);
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'TTS API 할당량 초과',
          status: 'retry_later',
          message: '나중에 자동으로 재시도됩니다.'
        }));
      }
      
      // 다른 오류는 그대로 던지기
      throw new Error(`TTS API 오류: ${errorText}`);
    }
    
    const ttsResult = await ttsApiResponse.json();
    const pcmBase64 = ttsResult.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!pcmBase64) throw new Error("TTS 응답에 오디오 데이터가 없습니다.");
    
    // 2. 디버그 모드에 따른 처리 분기
    if (isDebugMode) {
      // 디버그 모드: DB/스토리지 작업 건너뛰기, 하지만 실제 오디오 데이터는 반환
      console.log(`[FINISH] 디버그 모드 - DB/스토리지 작업 건너뛰기, 실제 오디오 데이터 반환`);
      
      // WAV 변환은 수행하되 스토리지만 건너뛰기
      const wavData = convertPcmToWav(base64ToUint8Array(pcmBase64), 24000);
      
      // Base64로 인코딩하여 응답에 포함 (안전한 방법)
      let wavBase64 = '';
      for (let i = 0; i < wavData.length; i++) {
        wavBase64 += String.fromCharCode(wavData[i]);
      }
      wavBase64 = btoa(wavBase64);
      
      return new Response(JSON.stringify({ 
        success: true, 
        audioData: wavBase64, // 실제 오디오 데이터
        isDebugMode: true,
        mimeType: 'audio/wav'
      }));
    }
    
    // 프로덕션 모드: 정상적인 DB/스토리지 작업
    console.log(`[FINISH] 프로덕션 모드 - WAV 변환 및 스토리지 업로드 시작`);
    
    // 2. WAV 변환 및 스토리지 업로드
    const wavData = convertPcmToWav(base64ToUint8Array(pcmBase64), 24000);
    const filePath = `public/${job.job_id}.wav`;
    const { error: uploadError } = await supabaseAdmin.storage.from('audio-outputs').upload(filePath, wavData, { contentType: 'audio/wav' });
    if (uploadError) throw new Error(`스토리지 업로드 실패: ${uploadError.message}`);

    // 3. 공개 URL 가져오기 및 DB에 최종 결과 업데이트
    const { data: { publicUrl } } = supabaseAdmin.storage.from('audio-outputs').getPublicUrl(filePath);
    await supabaseAdmin.from('voice_processing_jobs').update({ status: 'completed', audio_url: publicUrl }).eq('job_id', job.job_id);
    
    console.log(`[FINISH] 작업 ${job.job_id} 완료.`);
    return new Response(JSON.stringify({ success: true, audioUrl: publicUrl }));
  } catch (error) {
    // Body가 이미 소비되었으므로 job 정보를 사용할 수 없음
    console.error(`[FINISH] 작업 처리 중 오류 발생:`, error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
});