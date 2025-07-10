import { create } from 'zustand';
import { PersonaType } from '../types/habit';

interface HabitState {
  habit: string;
  time: string;
  intensity: PersonaType;
  difficulty: string;
  goalPeriod: string;
  setHabit: (habit: string) => void;
  setTime: (time: string) => void;
  setIntensity: (intensity: PersonaType) => void;
  setDifficulty: (difficulty: string) => void;
  setGoalPeriod: (goalPeriod: string) => void;
  reset: () => void;
}

const initialState = {
  habit: '',
  time: '07:00-07:30',
  intensity: '보통' as PersonaType,
  difficulty: '',
  goalPeriod: '1개월',
};

export const useHabitStore = create<HabitState>((set) => ({
  ...initialState,
  setHabit: (habit) => set({ habit }),
  setTime: (time) => set({ time }),
  setIntensity: (intensity) => set({ intensity }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGoalPeriod: (goalPeriod) => set({ goalPeriod }),
  reset: () => set(initialState),
})); 