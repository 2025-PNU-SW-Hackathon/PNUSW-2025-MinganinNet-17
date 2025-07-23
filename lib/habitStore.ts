import { create } from 'zustand';
import { Plan } from '../types/habit';

/**
 * State that holds user inputs during the multi-step goal creation flow.
 */
interface GoalCreationState {
  habitName: string;
  difficultyReason: string;
  intensity: string;
  availableTime: string;
  goalPeriod: string;
}

interface HabitState extends GoalCreationState {
  plan: Plan | null; // This holds the final, AI-generated plan object
  setHabitName: (name: string) => void;
  setDifficultyReason: (reason: string) => void;
  setIntensity: (intensity: string) => void;
  setAvailableTime: (time: string) => void;
  setGoalPeriod: (period: string) => void;
  setPlan: (plan: Plan | null) => void;
  reset: () => void;
}

const initialState: Omit<HabitState, 'setHabitName' | 'setDifficultyReason' | 'setIntensity' | 'setAvailableTime' | 'setGoalPeriod' | 'setPlan' | 'reset'> = {
  habitName: '',
  difficultyReason: '의지 부족',
  intensity: '보통',
  availableTime: '08:00-09:00',
  goalPeriod: '1개월',
  plan: null,
};

export const useHabitStore = create<HabitState>((set) => ({
  ...initialState,
  setHabitName: (name) => set({ habitName: name }),
  setDifficultyReason: (reason) => set({ difficultyReason: reason }),
  setIntensity: (intensity) => set({ intensity }),
  setAvailableTime: (time) => set({ availableTime: time }),
  setGoalPeriod: (period) => set({ goalPeriod: period }),
  setPlan: (plan) => set({ plan }),
  reset: () => set(initialState),
})); 