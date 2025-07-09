import { supabase } from './client';

// 습관 이벤트 타입 정의
export interface HabitEvent {
  startDate: string;
  description: string;
  time: string;
  repeat: number;
  score: number;
}

export interface HabitData {
  habit_name: string;
  time_slot: string;
  intensity: string;
  difficulty: string;
  ai_routine: string;
}

export async function saveHabitToSupabase(habitData: HabitData) {
  try {
    // 1. 사용자 인증 확인
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.warn('🔓 No authenticated user found, skipping database save:', userError?.message || 'No user');
      // 인증되지 않은 경우 로컬 저장소만 사용하고 성공으로 처리
      throw new Error('AUTH_MISSING');
    }

    // 2. 데이터 저장 (인증된 사용자만)
    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: userData.user.id,
          ...habitData
        }
      ])
      .select();

    if (error) {
      console.error('Supabase 저장 오류:', error);
      throw error;
    }

    if (!data) {
      throw new Error('데이터 저장 후 응답이 없습니다.');
    }

    console.log('✅ 습관 데이터 저장 성공:', data);
    return data;
  } catch (error) {
    console.error('Error saving habit:', error);
    
    // 인증 오류는 특별히 처리
    if (error instanceof Error && error.message === 'AUTH_MISSING') {
      throw new Error('AUTH_MISSING');
    }
    
    if (error instanceof Error) {
      throw new Error(`습관 저장 중 오류 발생: ${error.message}`);
    }
    throw error;
  }
}

// 습관 데이터를 데이터베이스에 저장하는 함수
export async function saveHabitRoutine(
  habit: string,
  availableTime: string,
  intensity: string,
  difficulty: string,
  habitEvents: HabitEvent[]
) {
  try {
    const habitData: HabitData = {
      habit_name: habit,
      time_slot: availableTime,
      intensity: intensity,
      difficulty: difficulty,
      ai_routine: JSON.stringify(habitEvents)
    };

    try {
      const savedData = await saveHabitToSupabase(habitData);
      console.log('✅ Full habit routine saved to database');
      return savedData;
    } catch (error) {
      // 인증 오류인 경우 로컬 저장소만 사용
      if (error instanceof Error && error.message === 'AUTH_MISSING') {
        console.log('🔓 No authentication - routine saved locally only');
        return { message: 'Saved locally only - no authentication' };
      }
      
      // 다른 오류는 재발생
      throw error;
    }
  } catch (error) {
    console.error('습관 데이터 저장 중 오류 발생:', error);
    throw error;
  }
} 