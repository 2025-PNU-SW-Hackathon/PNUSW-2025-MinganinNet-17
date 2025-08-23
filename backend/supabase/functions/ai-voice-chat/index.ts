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
    
    // 3. STT 시작
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
            { inlineData: { mimeType: "audio/mp4", data: audioData } } 
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
    
    const transcribedText = sttResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
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
      
                 // 사용자 목표 정보 조회
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
    
    // 사용자 입력에서 목표 설정 정보 파싱
    const parseGoalSettingInfo = (text) => {
      const info = {};
      
      // 목표 추출 (예: "100만원 모으기", "운동하기")
      const goalMatch = text.match(/(\d+만원\s*모으기?|운동하기?|공부하기?|독서하기?|절약하기?|저축하기?)/);
      if (goalMatch) info.goal = goalMatch[1];
      
      // 기간 추출 (예: "3개월", "6개월", "1년")
      const periodMatch = text.match(/(\d+개월|\d+년|일주일|한달)/);
      if (periodMatch) info.period = periodMatch[1];
      
      // 시간 추출 (예: "아침 7시", "저녁 8시")
      const timeMatch = text.match(/(아침|저녁|오전|오후)\s*(\d+시)/);
      if (timeMatch) info.time = `${timeMatch[1]} ${timeMatch[2]}시`;
      
      // 어려운 점 추출
      if (text.includes('의지') || text.includes('시간') || text.includes('귀찮')) {
        info.difficulty = '사용자가 어려운 점을 언급했습니다.';
      }
      
      // 강도 추출 (높음/보통/낮음)
      if (text.includes('높음') || text.includes('어려워') || text.includes('힘들어')) {
        info.intensity = '높음';
      } else if (text.includes('보통') || text.includes('적당해')) {
        info.intensity = '보통';
      } else if (text.includes('낮음') || text.includes('쉬워') || text.includes('가벼워')) {
        info.intensity = '낮음';
      }
      
      return info;
    };

    // 이전 대화에서 목표 정보를 추출하는 함수
    const extractPreviousGoalInfo = (conversationContext) => {
      const info = {};
      
      // 목표 내용 추출
      const goalMatch = conversationContext.match(/목표[:\s]*([^,\n]+)/);
      if (goalMatch) {
        info.goal = goalMatch[1].trim();
      }
      
      // 기간 추출
      const periodMatch = conversationContext.match(/(\d+)개월|(\d+)주|(\d+)일/);
      if (periodMatch) {
        info.period = periodMatch[0];
      }
      
      // 시간 추출
      const timeMatch = conversationContext.match(/(오전|오후|새벽|밤|아침|점심|저녁)\s*(\d+)시\s*~?\s*(\d+)?시?/);
      if (timeMatch) {
        info.time = timeMatch[0];
      }
      
      // 어려운 점 추출
      const difficultyMatch = conversationContext.match(/어려운\s*점[:\s]*([^,\n]+)/);
      if (difficultyMatch) {
        info.difficulty = difficultyMatch[1].trim();
      }
      
      // 강도 추출
      const intensityMatch = conversationContext.match(/강도[:\s]*([^,\n]+)/);
      if (intensityMatch) {
        info.intensity = intensityMatch[1].trim();
      }
      
      // 앱 제한 추출
      const appsMatch = conversationContext.match(/앱[:\s]*([^,\n]+)/);
      if (appsMatch) {
        info.apps = appsMatch[1].trim();
      }
      
      // 코칭 스타일 추출
      const styleMatch = conversationContext.match(/스타일[:\s]*([^,\n]+)/);
      if (styleMatch) {
        info.style = styleMatch[1].trim();
      }
      
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
    
    // 이전 대화에서 이미 설정된 정보들 확인
    if (conversationContext?.conversation_context) {
      const previousGoalInfo = extractPreviousGoalInfo(conversationContext.conversation_context);
      console.log('[ai-voice-chat] 이전 대화에서 파싱된 정보:', previousGoalInfo);
      allGoalInfo = { ...previousGoalInfo };
    }
    
    // 현재 입력에서 정보 파싱 및 추가
    const extractedInfo = parseGoalSettingInfo(transcribedText);
    console.log('[ai-voice-chat] 현재 파싱된 정보:', extractedInfo);
    allGoalInfo = { ...allGoalInfo, ...extractedInfo };
    
    console.log('[ai-voice-chat] 최종 allGoalInfo:', allGoalInfo);
    
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
          
          IMPORTANT: 당신은 목표 설정 코치입니다. 사용자가 단순히 인사만 해도 다음 단계로 진행시켜야 합니다.
          
          현재 단계: ${currentStep}단계
          - 1단계: 목표 내용 파악 (예: "어떤 목표를 이루고 싶으신가요?")
          - 2단계: 목표 기간 설정 (예: "언제까지 달성하고 싶으신가요?")
          - 3단계: 실천 시간 설정 (예: "언제 시간을 내서 실천하고 싶으신가요?")
          - 4단계: 어려운 점 파악 (예: "이 습관을 형성하는 데 어려운 점이 있나요?")
          - 5단계: 강도 설정 (예: "목표 달성 난이도는 어느 정도로 설정하고 싶으신가요? 높음/보통/낮음")
          
          IMPORTANT: 5단계가 완료되면 사용자에게 "목표 설정이 완료되었습니다! 이제 루틴을 만들어드릴게요."라고 말하고 
          골세팅 5번 화면으로 이동하도록 안내해주세요.
          
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
          
          사용자가 인사만 해도 다음 단계 질문을 던져주세요!`;
          break;
        case 'home':
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
          break;
        case 'report':
          basePrompt = `사용자가 리포트 화면에서 열었어요. 
          
          IMPORTANT: 당신은 리포트 코치입니다. 사용자가 단순히 인사만 해도 리포트 작성을 유도해야 합니다.
          
          사용 가능한 데이터를 최대한 활용하세요:
          
          사용자 목표 정보 (userGoals):
          - 목표명: ${userGoals?.map(g => g.habit_name).join(', ') || '없음'}
          - 목표 기간: ${userGoals?.map(g => g.goal_period).join(', ') || '없음'}
          - 실천 시간: ${userGoals?.map(g => g.available_time).join(', ') || '없음'}
          - 어려운 점: ${userGoals?.map(g => g.difficulty_reason).join(', ') || '없음'}
          
          이전 대화 맥락 (conversationContext):
          - 최근 대화 내용: ${conversationContext?.conversation_context || '없음'}
          - 사용자 감정 상태: ${conversationContext?.recent_emotions?.join(', ') || '없음'}
          
          리포트 유형:
          - 일간 리포트: 하루를 마치는 상황에서 오늘 하루를 돌아보고 평가
          - 주간 리포트: 일일 리포트들을 종합해서 한 주를 정리하고 다음 주 계획 수립
          
          현재 상황에 맞는 맞춤형 질문을 던져주세요:
          
          일간 리포트 예시 질문 (목표 정보 활용):
          - "오늘 ${userGoals?.[0]?.habit_name || '목표'} 진행은 어땠나요? ${userGoals?.[0]?.available_time || '설정된 시간'}에 잘 하고 계시나요?"
          - "오늘 가장 만족스러웠던 순간은 언제였나요?"
          - "내일은 ${userGoals?.[0]?.difficulty_reason || '어려운 점'}을 개선하고 싶으신가요?"
          
          주간 리포트 예시 질문 (이전 대화 맥락 활용):
          - "이번 주는 전반적으로 어땠나요? ${userGoals?.[0]?.habit_name || '목표'} 달성률은 어느 정도인가요?"
          - "이번 주 가장 어려웠던 순간은 언제였나요? ${conversationContext?.recent_emotions?.[0] || '감정 상태'}와 관련이 있나요?"
          - "다음 주는 ${userGoals?.[0]?.goal_period || '목표 기간'}을 고려해서 어떤 계획을 세우고 싶으신가요?"
          
          사용자가 인사만 해도 구체적인 목표 정보와 이전 대화 맥락을 활용해서 맞춤형 리포트 작성을 유도해주세요!`;
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
         if (conversationContext && conversationContext.conversation_context) {
           conversationMemory = `\n\n이전 대화 맥락 (최근 7일간):\n${conversationContext.conversation_context}`;
           
           if (conversationContext.recent_emotions && conversationContext.recent_emotions.length > 0) {
             conversationMemory += `\n사용자 최근 감정 상태: ${conversationContext.recent_emotions.join(', ')}`;
           }
         }
         
                   const llmPrompt = `${systemPrompt}\n\n맥락: ${contextualPrompt}${conversationMemory}\n\n사용자: "${transcribedText}"\n\n규칙: 2문장 내로만 답해. 절대 길게 말하지 마.\n\nIMPORTANT: 위의 맥락 정보를 반드시 기억하고 따르세요. 사용자가 이미 제공한 정보를 무시하지 마세요.`;
    
          // 디버깅을 위한 최종 프롬프트 로그
      console.log('[ai-voice-chat] 최종 LLM 프롬프트:', llmPrompt);
      console.log('[ai-voice-chat] allGoalInfo 상태:', allGoalInfo);
      console.log('[ai-voice-chat] conversationContext 상태:', conversationContext);
    
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