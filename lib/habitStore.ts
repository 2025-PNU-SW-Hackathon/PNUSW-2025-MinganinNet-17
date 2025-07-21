import { create } from 'zustand';
import { Plan } from '../types/habit';

// `HabitData` 타입을 직접 정의하거나, 공유된 타입 파일에서 가져옵니다.
// 여기서는 `backend/supabase/habits.ts`와 유사하게 직접 정의합니다.
export interface HabitData {
  habit_name: string;
  time_slot: string;
  intensity: string;
  difficulty: string;
  // goal_period는 ai_routine JSON에 포함되므로 여기서 제거합니다.
  ai_routine: string;
}
interface HabitState {
  habit: string;
  time: string;
  intensity: string;
  difficulty: string;
  goalPeriod: string;
  plan: Plan | null; // AI가 생성한 계획
  setHabit: (habit: string) => void;
  setTime: (time: string) => void;
  setIntensity: (intensity: string) => void;
  setDifficulty: (difficulty: string) => void;
  setGoalPeriod: (goalPeriod: string) => void;
  setPlan: (plan: Plan) => void; // 계획 설정 액션
  getHabitData: () => Omit<HabitData, 'ai_routine' | 'goal_period'>; // ai_routine 및 goal_period를 제외한 데이터 반환
  reset: () => void;
}

const initialState = {
  habit: '',
  time: '07:00-07:30',
  intensity: '보통',
  difficulty: '',
  goalPeriod: '1개월',
  plan: null,
};

export const useHabitStore = create<HabitState>((set, get) => ({
  ...initialState,
  setHabit: (habit) => set({ habit }),
  setTime: (time) => set({ time }),
  setIntensity: (intensity) => set({ intensity }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGoalPeriod: (goalPeriod) => set({ goalPeriod }),
  setPlan: (plan) => set({ plan }),
  getHabitData: () => {
    const state = get();
    return {
      habit_name: state.habit,
      time_slot: state.time,
      intensity: state.intensity,
      difficulty: state.difficulty,
      // goal_period는 ai_routine에 포함되므로 여기서 반환하지 않습니다.
    };
  },
  reset: () => set(initialState),
})); 