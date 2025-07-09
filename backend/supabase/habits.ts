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
    if (userError) {
      console.error('사용자 인증 오류:', userError);
      throw userError;
    }

    if (!userData.user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 2. 데이터 저장
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

    console.log('습관 데이터 저장 성공:', data);
    return data;
  } catch (error) {
    console.error('Error saving habit:', error);
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

    const savedData = await saveHabitToSupabase(habitData);
    return savedData;
  } catch (error) {
    console.error('습관 데이터 저장 중 오류 발생:', error);
    throw error;
  }
} 