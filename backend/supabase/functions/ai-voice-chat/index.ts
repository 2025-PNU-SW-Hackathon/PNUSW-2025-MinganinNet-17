import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { v4 as uuidv4 } from 'https://deno.land/std@0.100.0/uuid/mod.ts';

// 헬퍼 함수: Base64를 Uint8Array로 변환
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    console.log('[ai-voice-chat] 함수 시작됨');
    
    // 1. 요청 데이터 파싱 (화면별 맥락 포함)
    const requestBody = await req.json();
    // console.log('[ai-voice-chat] 전체 요청 데이터:', requestBody); // Base64 데이터가 너무 길어서 제거
    
    const { audio: base64Audio, context } = requestBody;
    console.log('[ai-voice-chat] 파싱된 데이터:', { 
      audioLength: base64Audio?.length || 0,
      context: context,
      hasAudio: !!base64Audio,
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : []
    });
    
    // 2. 환경 변수 검증
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('[ai-voice-chat] 환경 변수 확인:', {
      hasGeminiKey: !!geminiApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey
    });
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL이 설정되지 않았습니다.');
    }
    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY가 설정되지 않았습니다.');
    }
    
    // 3. STT 시작 (Gemini 2.5 Flash로 오디오를 텍스트로 변환)
    console.log('[ai-voice-chat] STT 시작...');
    const audioData = base64Audio.split(',').pop() || base64Audio;
    console.log('[ai-voice-chat] 오디오 데이터 처리됨, 길이:', audioData.length);
    
    const sttResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ 
          parts: [ 
            { text: "다음 오디오를 들리는 그대로 한글 텍스트로만 변환하고 [웃음]같은 괄호 설명은 제거해줘." }, 
            { inlineData: { mimeType: "audio/m4a", data: audioData } } 
          ] 
        }] 
      })
    });
    
    console.log('[ai-voice-chat] STT API 응답 상태:', sttResponse.status);
    
    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error('[ai-voice-chat] STT API 오류:', errorText);
      throw new Error(`STT API 오류: ${errorText}`);
    }
    
    const sttResult = await sttResponse.json();
    console.log('[ai-voice-chat] STT 결과 구조:', Object.keys(sttResult));
    
    // Gemini STT 응답 구조에 맞게 파싱
    const transcribedText = sttResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    // STT 결과 검증
    if (!transcribedText) {
      console.error('[ai-voice-chat] STT 실패 - 텍스트가 비어있음');
      console.error('[ai-voice-chat] STT 응답 상세:', sttResult);
      throw new Error('음성을 텍스트로 변환하지 못했습니다. 다시 시도해주세요.');
    }
    
    console.log('[ai-voice-chat] STT 완료:', transcribedText);

    // 4. 사용자 인증 및 목표 조회 (LLM 시작 전에)
    console.log('[ai-voice-chat] 사용자 인증 시작...');
    
    // 디버그 모드 확인 (클라이언트 context에서)
    const isDebugMode = context?.isDebugMode === true;
    console.log('[ai-voice-chat] 디버그 모드:', isDebugMode);
    
    let user = null;
    let userGoals = null;
    let conversationContext = null; // 대화 맥락 변수를 상단에서 선언
    
    if (isDebugMode) {
      // 디버그 모드: 가짜 사용자 정보 사용
      console.log('[ai-voice-chat] 디버그 모드 - 가짜 사용자 정보 사용');
      user = { id: 'debug-user-001' };
      userGoals = [];
      conversationContext = null; // 디버그 모드에서는 대화 맥락 없음
    } else {
      // 프로덕션 모드: 실제 인증
      const supabase = createClient(supabaseUrl, supabaseAnonKey, { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      });
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[ai-voice-chat] 인증 오류:', authError);
        throw new Error(`인증 오류: ${authError.message}`);
      }
      if (!authUser) {
        throw new Error("인증된 사용자가 아닙니다.");
      }
      user = authUser;
      console.log('[ai-voice-chat] 사용자 인증 완료:', user.id);
      
          // 사용자 목표 정보 조회 (목표 설정 중에는 기존 정보 유지)
          if (context.isNewGoal && context.screen === 'home') {
            // 홈화면에서 새로운 목표 추가 모드일 때만 기존 목표 정보를 무시
            userGoals = [];
            console.log('[ai-voice-chat] 홈화면 새로운 목표 모드 - 기존 목표 정보 무시');
          } else {
            // 목표 설정 중이거나 기존 목표 정보 조회
            const { data: goals, error: goalsError } = await supabase
              .from('habits')
              .select('*')
              .eq('user_id', user.id);
            
            if (goalsError) {
              console.error('[ai-voice-chat] 목표 조회 오류:', goalsError);
              // 목표 조회 실패는 치명적이지 않으므로 계속 진행
            } else {
              userGoals = goals;
              console.log('[ai-voice-chat] 사용자 목표 조회 완료:', userGoals?.length || 0, '개');
            }
          }
           
           // 사용자 이전 대화 맥락 조회 (최근 7일간)
           let conversationContext = null;
           try {
             const { data: contextData, error: contextError } = await supabase
               .rpc('get_user_conversation_context', { 
                 p_user_id: user.id, 
                 p_limit: 5 
               });
             
             if (!contextError && contextData && contextData.length > 0) {
               conversationContext = contextData[0];
               console.log('[ai-voice-chat] 이전 대화 맥락 조회 완료:', conversationContext);
             }
           } catch (contextError) {
             console.error('[ai-voice-chat] 대화 맥락 조회 오류:', contextError);
           }
      
      // 프로덕션 모드에서만 supabase 클라이언트를 전역으로 설정
      globalThis.supabase = supabase;
    }



    // 5. LLM 시작 (목표 정보를 포함한 프롬프트 생성)
    console.log('[ai-voice-chat] LLM 시작...');
    
    // 사용자 입력에서 목표 설정 정보 파싱 (개선된 버전)
    const parseGoalSettingInfo = (text, previousInfo = {}) => {
      const info = { ...previousInfo }; // 이전 정보 유지
      console.log('[ai-voice-chat] 파싱 시작 - 입력 텍스트:', text);
      console.log('[ai-voice-chat] 이전 정보:', previousInfo);
      
      // 목표 추출 (예: "100만원 모으기", "운동하기", "코딩 연습하기", "코딩 연습을 하고 싶어")
      const goalPatterns = [
        // 1순위: 구체적인 목표 패턴들 (가장 정확함)
        /(코딩\s*연습(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(프로그래밍(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(개발(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(영어(를?\s*배우고?\s*싶어?|를?\s*할래?|를?\s*해보고?\s*싶어?|해볼래?))/,
        /(일본어(를?\s*배우고?\s*싶어?|를?\s*할래?|를?\s*해보고?\s*싶어?|해볼래?))/,
        /(중국어(를?\s*배우고?\s*싶어?|를?\s*할래?|를?\s*해보고?\s*싶어?|해볼래?))/,
        /(운동(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(헬스(를?\s*하고?\s*싶어?|를?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(독서(를?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(책(을?\s*읽고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|읽을래?))/,
        /(요리(를?\s*하고?\s*싶어?|를?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(정리(를?\s*하고?\s*싶어?|를?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(청소(를?\s*하고?\s*싶어?|를?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(명상(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(요가(를?\s*하고?\s*싶어?|를?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        /(스트레칭(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/,
        
        // 2순위: 숫자 + 단위 패턴들
        /(\d+만원\s*모으기?|저축하기?)/,
        
        // 3순위: 일반적인 한국어 표현 (가장 마지막)
        /([가-힣\s]+(을?\s*하고?\s*싶어?|을?\s*할래?|을?\s*해보고?\s*싶어?|해볼래?))/
      ];
      
      for (const pattern of goalPatterns) {
        const match = text.match(pattern);
        if (match) {
          info.goal = match[1].trim();
          console.log('[ai-voice-chat] 목표 추출됨 (일반 패턴):', info.goal);
          break;
        }
      }
      
      // 1. 기간 추출 (가장 먼저 처리)
      const periodPatterns = [
        /(\d+개월)\s*동안/,
        /(\d+년)\s*동안/,
        /(\d+주)\s*동안/,
        /(\d+일)\s*동안/,
        /일주일\s*동안/,
        /한달\s*동안/
      ];
      
      for (const pattern of periodPatterns) {
        const match = text.match(pattern);
        if (match) {
          info.period = match[1] || match[0];
          console.log('[ai-voice-chat] 기간 추출됨:', info.period);
          break;
        }
      }
      
      // 3. 시간 추출 (더 정확한 패턴)
      const timePatterns = [
        /(아침|저녁|오전|오후)\s*(\d+시)/,
        /(\d+)시\s*부터\s*(\d+)시\s*까지/,
        /(\d+)시\s*~?\s*(\d+)시/
      ];
      
      for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[1] && match[2]) {
            info.time = `${match[1]} ${match[2]}시`;
          } else if (match[0]) {
            info.time = match[0];
          }
          console.log('[ai-voice-chat] 시간 추출됨:', info.time);
          break;
        }
      }
      
      // 4. 어려운 점 추출 (더 정확한 패턴)
      const difficultyPatterns = [
        /(의지|동기|동기부여|의욕)(가?\s*부족해?|가?\s*없어?|가?\s*안\s*생겨?)/,
        /(시간)(이?\s*부족해?|이?\s*없어?|이?\s*안\s*돼?)/,
        /(귀찮|싫어|하기\s*싫어|하기\s*귀찮)/,
        /(까먹어|잊어버려|기억\s*안\s*나)/,
        /(어려워|힘들어|복잡해)/
      ];
      
      for (const pattern of difficultyPatterns) {
        const match = text.match(pattern);
        if (match) {
          info.difficulty = match[0];
          console.log('[ai-voice-chat] 어려운 점 추출됨:', info.difficulty);
          break;
        }
      }
      
      // 5. 강도 추출 (더 정확한 패턴)
      const intensityPatterns = [
        /(높음|높은|어려워|힘들어|복잡해|도전적)/,
        /(보통|적당해|보통이야|보통이에요)/,
        /(낮음|낮은|쉬워|가벼워|간단해|쉬워요)/
      ];
      
      for (const pattern of intensityPatterns) {
        const match = text.match(pattern);
        if (match) {
          info.intensity = match[1];
          console.log('[ai-voice-chat] 강도 추출됨:', info.intensity);
          break;
        }
      }
      
      console.log('[ai-voice-chat] 최종 파싱 결과:', info);
      return info;
    };

    // 이전 대화에서 목표 정보를 추출하는 함수
    const extractPreviousGoalInfo = (conversationContext) => {
      const info = {};
      
      console.log('[ai-voice-chat] extractPreviousGoalInfo 시작 - 입력:', conversationContext);
      
      // 대화 맥락에서 사용자 발화만 추출 (사용자: ... 형태)
      const userUtterances = [];
      const userPattern = /사용자:\s*([^|]+)/g;
      let match;
      while ((match = userPattern.exec(conversationContext)) !== null) {
        userUtterances.push(match[1].trim());
      }
      
      console.log('[ai-voice-chat] 추출된 사용자 발화:', userUtterances);
      
      // 모든 사용자 발화를 하나의 텍스트로 합치기
      const allUserText = userUtterances.join(' ');
      console.log('[ai-voice-chat] 모든 사용자 발화 합친 텍스트:', allUserText);
      
      // 목표 내용 추출 (더 유연한 패턴)
      const goalPatterns = [
        /(코딩\s*연습|프로그래밍|개발|운동|공부|독서|저축|다이어트|금연|금주|습관|목표|계획)/,
        /([^,\n]+)\s*(하고?\s*싶어|하려고|할래|할\s*거야|할\s*예정이야|해볼래)/,
        /(매일|매주|매월|정기적으로)\s*(하는|할|하려는)\s*([^,\n]+)/,
        /(코딩\s*연습을?\s*하고?\s*싶어)/,
        /(코딩\s*연습을?\s*할래)/
      ];
      
      for (const pattern of goalPatterns) {
        const goalMatch = allUserText.match(pattern);
        if (goalMatch) {
          info.goal = goalMatch[0].trim();
          console.log('[ai-voice-chat] 목표 추출됨:', info.goal);
          break;
        }
      }
      
      // 기간 추출 (더 정확한 패턴)
      const periodPatterns = [
        /(\d+개월)\s*동안/,
        /(\d+년)\s*동안/,
        /(\d+주)\s*동안/,
        /(\d+일)\s*동안/,
        /일주일\s*동안/,
        /한달\s*동안/,
        /(\d+개월)/,
        /(\d+주)/,
        /(\d+일)/,
        /삼개월/,
        /(\d+)개월\s*할래/,
        /(\d+)개월\s*하고?\s*싶어/
      ];
      
      for (const pattern of periodPatterns) {
        const periodMatch = allUserText.match(pattern);
        if (periodMatch) {
          info.period = periodMatch[1] || periodMatch[0];
          console.log('[ai-voice-chat] 기간 추출됨:', info.period);
          break;
        }
      }
      
      // 시간 추출 (더 정확한 패턴)
      const timePatterns = [
        /(아침|저녁|오전|오후)\s*(\d+시)/,
        /(\d+)시\s*부터\s*(\d+)시\s*까지/,
        /(\d+)시\s*~?\s*(\d+)시/,
        /(새벽|밤|아침|점심|저녁)\s*(\d+)시/,
        /다섯\s*시\s*에서\s*(\d+)시\s*까지/,
        /오후\s*(\d+)시\s*부터\s*(\d+)시\s*까지/
      ];
      
      for (const pattern of timePatterns) {
        const timeMatch = allUserText.match(pattern);
        if (timeMatch) {
          if (timeMatch[1] && timeMatch[2]) {
            info.time = `${timeMatch[1]} ${timeMatch[2]}시`;
          } else if (timeMatch[0]) {
            info.time = timeMatch[0];
          }
          console.log('[ai-voice-chat] 시간 추출됨:', info.time);
          break;
        }
      }
      
      // 어려운 점 추출 (더 정확한 패턴)
      const difficultyPatterns = [
        /(의지|동기|동기부여|의욕)(가?\s*부족해?|가?\s*없어?|가?\s*안\s*생겨?)/,
        /(시간)(이?\s*부족해?|이?\s*없어?|이?\s*안\s*돼?)/,
        /(귀찮|싫어|하기\s*싫어|하기\s*귀찮)/,
        /(까먹어|잊어버려|기억\s*안\s*나|맨날\s*까먹어)/,
        /(어려워|힘들어|복잡해)/
      ];
      
      for (const pattern of difficultyPatterns) {
        const difficultyMatch = allUserText.match(pattern);
        if (difficultyMatch) {
          info.difficulty = difficultyMatch[0];
          console.log('[ai-voice-chat] 어려운 점 추출됨:', info.difficulty);
          break;
        }
      }
      
      // 강도 추출 (더 정확한 패턴)
      const intensityPatterns = [
        /(높음|높은|어려워|힘들어|복잡해|도전적)/,
        /(보통|적당해|보통이야|보통이에요)/,
        /(낮음|낮은|쉬워|가벼워|간단해|쉬워요)/
      ];
      
      for (const pattern of intensityPatterns) {
        const intensityMatch = allUserText.match(pattern);
        if (intensityMatch) {
          info.intensity = intensityMatch[1];
          console.log('[ai-voice-chat] 강도 추출됨:', info.intensity);
          break;
        }
      }
      
      console.log('[ai-voice-chat] extractPreviousGoalInfo 최종 결과:', info);
      
      // 디버깅: 각 필드별 상태 확인
      console.log('[ai-voice-chat] 필드별 상태:');
      console.log('- goal:', info.goal || '없음');
      console.log('- period:', info.period || '없음');
      console.log('- time:', info.time || '없음');
      console.log('- difficulty:', info.difficulty || '없음');
      console.log('- intensity:', info.intensity || '없음');
      
      return info;
    };

    // 목표 설정 단계별 안내 정보
    const getGoalSettingStepInfo = (currentStep, extractedInfo = {}) => {
      let stepInfo = "";
      
      switch(currentStep) {
        case 1:
          stepInfo = "1단계: 사용자가 이루고 싶은 목표를 말해주세요.";
          if (extractedInfo.goal) {
            stepInfo += ` 사용자가 이미 '${extractedInfo.goal}'라고 말했습니다.`;
          }
          if (extractedInfo.period) {
            stepInfo += ` 기간도 '${extractedInfo.period}'라고 말했습니다.`;
          }
          break;
        case 2:
          stepInfo = "2단계: 목표를 언제까지 달성하고 싶은지 물어보세요.";
          if (extractedInfo.period) {
            stepInfo += ` 사용자가 이미 '${extractedInfo.period}'라고 말했습니다.`;
          }
          break;
        case 3:
          stepInfo = "3단계: 언제 시간을 내서 실천하고 싶은지 물어보세요.";
          if (extractedInfo.time) {
            stepInfo += ` 사용자가 이미 '${extractedInfo.time}'라고 말했습니다.`;
          }
          break;
        case 4:
          stepInfo = "4단계: 이 습관을 형성하는 데 어려운 점이 있는지 물어보세요.";
          if (extractedInfo.difficulty) {
            stepInfo += ` 사용자가 이미 어려운 점을 언급했습니다.`;
          }
          break;
        case 5:
          stepInfo = "5단계: 목표 달성 난이도를 물어보세요. 높음/보통/낮음 중에서 선택하도록 하세요.";
          if (extractedInfo.intensity) {
            stepInfo += ` 사용자가 이미 '${extractedInfo.intensity}'라고 말했습니다.`;
          }
          break;
        case 6:
          stepInfo = "목표 설정이 완료되었습니다! 이제 루틴을 만들어드릴게요. 골세팅 5번 화면으로 이동해주세요.";
          break;
        default:
          stepInfo = "목표 설정을 시작해보세요. 어떤 목표를 만들고 싶으신가요?";
      }
      
      return stepInfo;
    };

    // allGoalInfo를 함수 시작 부분에서 설정 (이전 대화 + 현재 입력)
    let allGoalInfo = {};
    
    // 목표 설정 중에는 이전 정보 유지, 홈화면에서만 초기화
    if (context.screen === 'goalSetting') {
      console.log('[ai-voice-chat] 목표 설정 모드 - conversationContext 확인:', conversationContext);
      
      // 이전 대화에서 이미 설정된 정보들 확인
      if (conversationContext?.conversation_context) {
        console.log('[ai-voice-chat] conversation_context 존재, 길이:', conversationContext.conversation_context.length);
        console.log('[ai-voice-chat] extractPreviousGoalInfo 함수 호출 시작');
        try {
          const previousGoalInfo = extractPreviousGoalInfo(conversationContext.conversation_context);
          console.log('[ai-voice-chat] extractPreviousGoalInfo 함수 실행 완료');
          console.log('[ai-voice-chat] 이전 대화에서 파싱된 정보:', previousGoalInfo);
          allGoalInfo = { ...previousGoalInfo };
          console.log('[ai-voice-chat] previousGoalInfo 적용 후 allGoalInfo:', allGoalInfo);
        } catch (error) {
          console.error('[ai-voice-chat] extractPreviousGoalInfo 함수 실행 중 오류:', error);
          allGoalInfo = {};
        }
      } else {
        console.log('[ai-voice-chat] conversation_context가 없음');
      }
      
      // 현재 입력에서 정보 파싱 및 추가 (이전 정보와 합쳐서 파싱)
      const extractedInfo = parseGoalSettingInfo(transcribedText, allGoalInfo);
      console.log('[ai-voice-chat] 현재 파싱된 정보:', extractedInfo);
      allGoalInfo = { ...allGoalInfo, ...extractedInfo };
      
      console.log('[ai-voice-chat] 목표 설정 중 - 최종 allGoalInfo:', allGoalInfo);
    } else {
      // 홈화면 등에서는 새로운 목표 모드
      console.log('[ai-voice-chat] 홈화면 모드 - 새로운 목표 시작');
      allGoalInfo = {};
    }
    
    // 화면별 맥락에 따른 프롬프트 생성 (목표 정보 포함)
    const getContextualPrompt = (context, userGoals) => {
      if (!context) return "일반적인 대화를 이어가세요.";
      
      let basePrompt = "";
      switch(context.screen) {
        case 'goalSetting':
          // 현재 단계 정보
          const currentStep = context.currentStep || 1;
          
          const stepInfo = getGoalSettingStepInfo(currentStep, allGoalInfo);
          basePrompt = `사용자가 목표 설정 ${currentStep}단계에 있어요. ${stepInfo}
          
          CRITICAL: 당신은 목표 설정 코치입니다. 사용자가 "안녕하세요", "반갑습니다" 등 인사만 해도 무조건 다음 단계로 진행하세요!
          
          현재 단계: ${currentStep}단계
          - 1단계: 목표 내용 파악 → "어떤 목표를 이루고 싶으신가요?"
          - 2단계: 목표 기간 설정 → "언제까지 달성하고 싶으신가요?"
          - 3단계: 실천 시간 설정 → "언제 시간을 내서 실천하고 싶으신가요?"
          - 4단계: 어려운 점 파악 → "이 습관을 형성하는 데 어려운 점이 있나요?"
          - 5단계: 강도 설정 → "목표 달성 난이도는 어느 정도로 설정하고 싶으신가요? 높음/보통/낮음"
          
          IMPORTANT: 5단계가 완료되면 사용자에게 "목표 설정이 완료되었습니다! 이제 루틴을 만들어드릴게요."라고 말하고 
          골세팅 5번 화면으로 이동하도록 안내해주세요.
          CRITICAL: 사용자가 인사만 해도 무조건 위의 해당 단계 질문을 던져주세요!
          
          사용자가 이미 제공한 정보 (이전 대화 포함):
          ${JSON.stringify(allGoalInfo, null, 2)}
          
          IMPORTANT: 이 정보를 내부적으로 파악하고 맥락을 이해하세요. 
          하지만 사용자에게 말할 때는 직전에 제공된 정보만 간단히 언급하고, 
          다음 단계로 자연스럽게 진행하세요.
          
          CRITICAL: 사용자가 이미 제공한 정보를 절대 잊어버리지 마세요!
          이전 대화에서 수집된 정보를 기억하고 활용하세요.
          
          예시:
          - 사용자가 "3개월 동안 100만원 모으기"라고 했다면: "좋은 목표예요! 언제까지 달성하고 싶으신가요?"
          - 사용자가 "오후 3시~5시"라고 했다면: "좋아요! 이제 어려운 점이 있나요?"
          
          IMPORTANT: 5가지 정보(목표, 기간, 시간, 어려운 점, 강도)가 모두 수집되면:
          "목표 설정이 완료되었습니다! 이제 루틴을 만들어드릴게요."라고 말하고
          응답 데이터에 goalSettingComplete: true와 nextScreen: 'goalSettingStep5'를 포함시켜주세요.
          더 이상 질문하지 마세요.
          
          CRITICAL: 사용자가 인사만 해도 무조건 다음 단계 질문을 던져주세요!`;
          break;
        case 'home':
          // 홈화면에서 새로운 목표 추가인 경우
          if (context.isNewGoal) {
            basePrompt = `사용자가 홈화면에서 + 버튼을 눌러 새로운 목표를 추가하려고 합니다.
            
            CRITICAL: 완전히 새로운 목표 설정을 시작해야 합니다. 기존 목표나 이전 대화와는 무관하게 진행하세요.
            
            새로운 목표 설정을 위한 안내:
            - 사용자에게 새로운 목표 설정을 시작한다고 안내
            - 목표 설정 1단계로 자연스럽게 진행
            - 기존 목표나 이전 대화는 언급하지 않기
            
            사용자가 인사만 해도 "새로운 목표를 설정해보시겠어요?"라고 말하고 목표 설정을 시작하세요.`;
          } else {
            basePrompt = `사용자가 홈화면에서 열었어요. 
            
            IMPORTANT: 당신은 홈 화면 코치입니다. 사용자가 단순히 인사만 해도 목표 진행 상황을 체크하고 동기부여를 해야 합니다.
            
            사용 가능한 데이터를 최대한 활용하세요:
            
            사용자 목표 정보 (userGoals):
            - 목표명: ${userGoals?.map(g => g.habit_name).join(', ') || '없음'}
            - 목표 기간: ${userGoals?.map(g => g.goal_period).join(', ') || '없음'}
            - 실천 시간: ${userGoals?.map(g => g.available_time).join(', ') || '없음'}
            - 어려운 점: ${userGoals?.map(g => g.difficulty_reason).join(', ') || '없음'}
            - 제한 앱: ${userGoals?.map(g => g.restricted_apps).join(', ') || '없음'}
            - 코칭 스타일: ${userGoals?.map(g => g.persona).join(', ') || '없음'}
            
            이전 대화 맥락 (conversationContext):
            - 최근 대화 내용: ${conversationContext?.conversation_context || '없음'}
            - 사용자 감정 상태: ${conversationContext?.recent_emotions?.join(', ') || '없음'}
            
            홈 화면에서의 역할:
            - 목표 진행 상황 점검 및 격려
            - 일상적인 동기부여 및 응원
            - 목표 달성에 도움이 되는 조언
            - 사용자의 감정 상태 파악 및 케어
            
            상황별 맞춤형 대응:
            
            1. 목표가 있는 경우 (구체적인 목표 정보 활용):
            - "오늘 ${userGoals?.[0]?.habit_name || '목표'} 진행은 어땠나요? ${userGoals?.[0]?.available_time || '설정된 시간'}에 잘 하고 계시나요?"
            - "${userGoals?.[0]?.difficulty_reason || '어려운 점'}은 여전히 힘드신가요? 함께 해결해볼까요?"
            - "정말 대단해요! ${userGoals?.[0]?.goal_period || '목표 기간'} 동안 꾸준히 하고 계시는군요!"
            
            2. 목표가 없는 경우:
            - "새로운 목표를 설정해보는 건 어떨까요?"
            - "어떤 습관을 만들고 싶으신가요?"
            - "루티가 함께 도와드릴게요!"
            
            3. 일반적인 인사 (이전 대화 맥락 활용):
            - "안녕하세요! 오늘 하루는 어땠나요?"
            - "목표 달성을 위해 오늘도 힘내세요!"
            - "무엇을 도와드릴까요?"
            
            사용자가 인사만 해도 구체적인 목표 정보와 이전 대화 맥락을 활용해서 맞춤형 동기부여를 해주세요!`;
          }
          break;
        case 'report':
          basePrompt = `너는 리포트 작성 코치야.

- 사용자가 하루나 한 주를 돌아보는 회고를 작성하도록 유도해야 해.
- **\`userGoals\`** (사용자 목표 정보)와 **\`conversationContext\`** (이전 대화)를 활용해서 맞춤형 질문을 던져.
- 예: "오늘 목표는 얼마나 달성하셨나요?", "이번 주에 가장 만족스러웠던 순간은 언제였나요?"

사용자 목표 정보 (userGoals):
- 목표명: ${userGoals?.map(g => g.habit_name).join(', ') || '없음'}
- 목표 기간: ${userGoals?.map(g => g.goal_period).join(', ') || '없음'}
- 실천 시간: ${userGoals?.map(g => g.available_time).join(', ') || '없음'}
- 어려운 점: ${userGoals?.map(g => g.difficulty_reason).join(', ') || '없음'}

이전 대화 맥락 (conversationContext):
- 최근 대화 내용: ${conversationContext?.conversation_context || '없음'}
- 사용자 감정 상태: ${conversationContext?.recent_emotions?.join(', ') || '없음'}`;
          break;
        default:
          basePrompt = "일반적인 대화를 이어가세요.";
      }

      // 목표 정보 추가 (자연스러운 대화를 위한 배경 정보)
      if (userGoals && userGoals.length > 0) {
        // AI가 알고 있어야 할 사용자 정보 (직접 언급하지 말고 자연스럽게 챙겨주기)
        const userContext = userGoals.map(goal => ({
          habit: goal.habit_name,
          period: goal.goal_period,
          time: goal.available_time,
          difficulty: goal.difficulty_reason,
          apps: goal.restricted_apps,
          style: goal.persona
        }));
        
        basePrompt += ` 사용자 정보 (직접 언급하지 말고 자연스럽게 챙겨주기): ${JSON.stringify(userContext)}`;
      } else {
        basePrompt += " 사용자에게 아직 목표가 없습니다.";
      }

      return basePrompt;
    };

    const contextualPrompt = getContextualPrompt(context, userGoals);
    
    // 디버깅을 위한 로그 추가
    console.log('[ai-voice-chat] 생성된 맥락 프롬프트:', contextualPrompt);
    console.log('[ai-voice-chat] 사용자 목표 데이터:', userGoals);
    
             // 시스템 프롬프트를 간단하게 수정 (자연스러운 대화 + 개인화된 케어)
         const systemPrompt = `You are 루티, a Korean habit coach. 

IMPORTANT RULES:
1. ALWAYS start with "안녕하세요! 루티에요!" when greeting for the first time
2. Remember previous conversations and continue naturally
3. Keep responses SHORT - maximum 2 sentences
4. When user has goals, naturally care about their progress and encourage them
5. Don't directly mention "you set a goal of X" - instead ask naturally like "오늘도 잘 하고 있나요?" or "어려운 점은 없으신가요?"
6. Use the user's information to provide personalized care without being obvious about it
7. Be warm and supportive, like a friend who remembers your situation`;

             // 이전 대화 맥락을 포함한 프롬프트 생성
         let conversationMemory = "";
    
    // 목표 설정 중에는 이전 대화 맥락 포함 (메모리 유지)
    if (context.screen === 'goalSetting' || !context.isNewGoal) {
      if (conversationContext && conversationContext.conversation_context) {
        conversationMemory = `\n\n이전 대화 맥락 (최근 7일간):\n${conversationContext.conversation_context}`;
        
        if (conversationContext.recent_emotions && conversationContext.recent_emotions.length > 0) {
          conversationMemory += `\n사용자 최근 감정 상태: ${conversationContext.recent_emotions.join(', ')}`;
        }
      }
      
      // 클라이언트에서 전달받은 현재 세션 대화 기억도 추가
      if (context.conversationMemory && context.conversationMemory.trim()) {
        if (conversationMemory) {
          conversationMemory += `\n\n현재 세션 대화 기억:\n${context.conversationMemory}`;
        } else {
          conversationMemory = `\n\n현재 세션 대화 기억:\n${context.conversationMemory}`;
        }
        console.log('[ai-voice-chat] 클라이언트 대화 기억 추가됨:', context.conversationMemory.length, '자');
      }
    } else {
      console.log('[ai-voice-chat] 홈화면 새로운 목표 모드 - 이전 대화 맥락 무시');
    }
    
    // 디버깅을 위한 맥락 정보 로그
    console.log('[ai-voice-chat] 맥락 정보 요약:', {
      isNewGoal: context.isNewGoal,
      hasConversationContext: !!conversationContext?.conversation_context,
      hasClientMemory: !!context.conversationMemory,
      conversationMemoryLength: conversationMemory.length,
      clientMemoryLength: context.conversationMemory?.length || 0
    });
    
    const llmPrompt = `${systemPrompt}\n\n맥락: ${contextualPrompt}${conversationMemory}\n\n사용자: "${transcribedText}"\n\n규칙: 2문장 내로만 답해. 절대 길게 말하지 마.\n\nIMPORTANT: 위의 맥락 정보를 반드시 기억하고 따르세요. 사용자가 이미 제공한 정보를 무시하지 마세요.`;
    
    // 디버깅을 위한 최종 프롬프트 로그
    console.log('[ai-voice-chat] 최종 LLM 프롬프트 길이:', llmPrompt.length);
    console.log('[ai-voice-chat] 맥락 정보 포함 여부:', {
      hasContextualPrompt: !!contextualPrompt,
      hasConversationMemory: !!conversationMemory,
      isNewGoal: context.isNewGoal,
      totalPromptLength: llmPrompt.length
    });
    
    const llmResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ 
          role: "user", 
          parts: [{ text: llmPrompt }] 
        }] 
      })
    });
    
    console.log('[ai-voice-chat] LLM API 응답 상태:', llmResponse.status);
    
    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('[ai-voice-chat] LLM API 오류:', errorText);
      throw new Error(`LLM API 오류: ${errorText}`);
    }
    
    const llmResult = await llmResponse.json();
    const responseText = llmResult.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('LLM이 응답 생성을 거부했습니다.');
    }
    console.log('[ai-voice-chat] LLM 완료:', responseText);
    
    // 6. 디버그 모드에 따른 처리 분기
    if (isDebugMode) {
      // 디버그 모드: DB/스토리지 작업 건너뛰기
      console.log('[ai-voice-chat] 디버그 모드 - DB/스토리지 작업 건너뛰기');
      
      const jobId = 'debug-' + Date.now();
      console.log('[ai-voice-chat] 디버그 작업 ID 생성됨:', jobId);
      
      // 5가지 정보 수집 완료 여부 확인 (디버그 모드)
      const allInfoCollected = allGoalInfo && 
        allGoalInfo.goal && 
        allGoalInfo.period && 
        allGoalInfo.time && 
        allGoalInfo.difficulty && 
        allGoalInfo.intensity;
      
      // 부족한 정보 분석
      const missingInfo = {
        goal: !allGoalInfo.goal ? '목표 내용' : null,
        period: !allGoalInfo.period ? '목표 기간' : null,
        time: !allGoalInfo.time ? '실천 시간' : null,
        difficulty: !allGoalInfo.difficulty ? '어려운 점' : null,
        intensity: !allGoalInfo.intensity ? '강도 설정' : null
      };
      
      const missingInfoList = Object.values(missingInfo).filter(info => info !== null);
      
      // 스마트 화면 전환: 누락된 정보에 따라 적절한 화면 선택
      let nextStep = 'goalSettingStep5'; // 기본값: 정보 취합
      
      if (missingInfoList.length > 0) {
        // 누락된 정보가 있으면 해당 정보를 입력받는 화면으로
        if (!allGoalInfo.goal) {
          nextStep = 'goalSettingStep1'; // 목표 입력
        } else if (!allGoalInfo.period || !allGoalInfo.time) {
          nextStep = 'goalSettingStep2'; // 기간/시간 입력
        } else if (!allGoalInfo.difficulty) {
          nextStep = 'goalSettingStep3'; // 어려운 점 입력
        } else if (!allGoalInfo.intensity) {
          nextStep = 'goalSettingStep4'; // 강도 입력
        }
      }

      // 6. 클라이언트에게 즉시 응답 반환 (디버그 모드)
      console.log('[ai-voice-chat] 디버그 모드 응답 전송 시작...');
      const response = { 
        success: true, 
        jobId: jobId, 
        userText: transcribedText, 
        responseText: responseText,
        goalSettingComplete: allInfoCollected || false,
        nextScreen: allInfoCollected ? 'goalSettingStep5' : nextStep,
        collectedGoalInfo: allInfoCollected ? allGoalInfo : allGoalInfo,
        missingInfo: missingInfoList,
        currentProgress: {
          total: 5,
          completed: 5 - missingInfoList.length,
          missing: missingInfoList
        }
      };
      
      console.log('[ai-voice-chat] 디버그 모드 응답 데이터:', response);
      console.log('[ai-voice-chat] 디버그 모드 함수 성공적으로 완료됨');
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 202 // 202: 요청이 성공적으로 접수됨
      });
    }
    
    // 프로덕션 모드: 정상적인 DB/스토리지 작업
    console.log('[ai-voice-chat] 프로덕션 모드 - 사용자 음성 저장 시작...');
    
    const jobId = uuidv4.generate();
    console.log('[ai-voice-chat] 작업 ID 생성됨:', jobId);
    
    // 사용자 음성을 voice-chat 버킷에 저장
    const userAudioFileName = `user_${jobId}.m4a`;
    const userAudioData = base64ToUint8Array(audioData);
    
    const { error: userAudioUploadError } = await supabase.storage
      .from('voice-chat')
      .upload(userAudioFileName, userAudioData, { 
        contentType: 'audio/mp4',
        metadata: {
          userId: user.id,
          jobId: jobId,
          timestamp: new Date().toISOString(),
          type: 'user_input'
        }
      });
    
    if (userAudioUploadError) {
      console.error('[ai-voice-chat] 사용자 음성 업로드 오류:', userAudioUploadError);
      // 사용자 음성 업로드 실패는 치명적이지 않으므로 계속 진행
    } else {
      console.log('[ai-voice-chat] 사용자 음성 저장 완료:', userAudioFileName);
    }
    
    // 6. 작업(Job) 생성 및 DB에 저장
    console.log('[ai-voice-chat] 작업 생성 시작...');
    
    const { error: insertError } = await supabase.from('voice_processing_jobs').insert({
      job_id: jobId, 
      user_id: user.id, 
      response_text: responseText, 
      user_text: transcribedText,
      user_audio_file: userAudioFileName // 사용자 음성 파일명 추가
    });
    
    if (insertError) {
      console.error('[ai-voice-chat] DB 저장 오류:', insertError);
      throw new Error(`작업 DB 저장 실패: ${insertError.message}`);
    }
    console.log('[ai-voice-chat] DB 저장 완료');
    
    // 5가지 정보 수집 완료 여부 확인 (프로덕션 모드)
    const allInfoCollected = allGoalInfo && 
      allGoalInfo.goal && 
      allGoalInfo.period && 
      allGoalInfo.time && 
      allGoalInfo.difficulty && 
      allGoalInfo.intensity;
    
    // 부족한 정보 분석
    const missingInfo = {
      goal: !allGoalInfo.goal ? '목표 내용' : null,
      period: !allGoalInfo.period ? '목표 기간' : null,
      time: !allGoalInfo.time ? '실천 시간' : null,
      difficulty: !allGoalInfo.difficulty ? '어려운 점' : null,
      intensity: !allGoalInfo.intensity ? '강도 설정' : null
    };
    
    const missingInfoList = Object.values(missingInfo).filter(info => info !== null);
    
    // 스마트 화면 전환: 누락된 정보에 따라 적절한 화면 선택
    let nextStep = 'goalSettingStep5'; // 기본값: 정보 취합
    
    if (missingInfoList.length > 0) {
      // 누락된 정보가 있으면 해당 정보를 입력받는 화면으로
      if (!allGoalInfo.goal) {
        nextStep = 'goalSettingStep1'; // 목표 입력
      } else if (!allGoalInfo.period || !allGoalInfo.time) {
        nextStep = 'goalSettingStep2'; // 기간/시간 입력
      } else if (!allGoalInfo.difficulty) {
        nextStep = 'goalSettingStep3'; // 어려운 점 입력
      } else if (!allGoalInfo.intensity) {
        nextStep = 'goalSettingStep4'; // 강도 입력
      }
    }

    // 6. 클라이언트에게 즉시 작업 ID(진동벨)와 텍스트 결과를 반환하고 함수 종료
    console.log('[ai-voice-chat] 응답 전송 시작...');
    const response = { 
      success: true, 
      jobId: jobId, 
      userText: transcribedText, 
      responseText: responseText,
      goalSettingComplete: allInfoCollected || false,
      nextScreen: allInfoCollected ? 'goalSettingStep5' : nextStep,
      collectedGoalInfo: allInfoCollected ? allGoalInfo : allGoalInfo,
      missingInfo: missingInfoList,
      currentProgress: {
        total: 5,
        completed: 5 - missingInfoList.length,
        missing: missingInfoList
      }
    };
    
    console.log('[ai-voice-chat] 응답 데이터:', response);
    console.log('[ai-voice-chat] 함수 성공적으로 완료됨');
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 202 // 202: 요청이 성공적으로 접수됨
    });

  } catch (error) {
    console.error('[ai-voice-chat] 함수 실행 중 오류 발생:', error);
    console.error('[ai-voice-chat] 오류 상세 정보:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500
    });
  }
});