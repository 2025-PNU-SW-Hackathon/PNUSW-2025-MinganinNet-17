import { create } from 'zustand';
import { PersonaType, Plan } from '../types/habit';

interface HabitState {
  habit: string;
  time: string;
  intensity: PersonaType;
  difficulty: string;
  goalPeriod: string;
  plan: Plan | null; // AI가 생성한 계획
  setHabit: (habit: string) => void;
  setTime: (time: string) => void;
  setIntensity: (intensity: PersonaType) => void;
  setDifficulty: (difficulty: string) => void;
  setGoalPeriod: (goalPeriod: string) => void;
  setPlan: (plan: Plan) => void; // 계획 설정 액션
  reset: () => void;
}

const initialState = {
  habit: '',
  time: '07:00-07:30',
  intensity: '보통' as PersonaType,
  difficulty: '',
  goalPeriod: '1개월',
  plan: null,
};

export const useHabitStore = create<HabitState>((set) => ({
  ...initialState,
  setHabit: (habit) => set({ habit }),
  setTime: (time) => set({ time }),
  setIntensity: (intensity) => set({ intensity }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGoalPeriod: (goalPeriod) => set({ goalPeriod }),
  setPlan: (plan) => set({ plan }),
  reset: () => set(initialState),
})); 