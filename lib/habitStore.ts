import { create } from 'zustand';

interface HabitState {
  habit: string;
  time: string;
  intensity: string;
  difficulty: string;
  setHabit: (habit: string) => void;
  setTime: (time: string) => void;
  setIntensity: (intensity: string) => void;
  setDifficulty: (difficulty: string) => void;
  resetAll: () => void;
}

export const useHabitStore = create<HabitState>((set) => ({
  habit: '',
  time: '',
  intensity: '',
  difficulty: '',
  setHabit: (habit) => set({ habit }),
  setTime: (time) => set({ time }),
  setIntensity: (intensity) => set({ intensity }),
  setDifficulty: (difficulty) => set({ difficulty }),
  resetAll: () => set({ habit: '', time: '', intensity: '', difficulty: '' }),
})); 